from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Annotated
from .. import models, schemas, crud
from ..database import get_db
from ..dependencies import get_current_active_user

router = APIRouter(
    prefix="/stock",
    tags=["stock"],
)

# --- PURCHASE ORDERS ---

@router.post("/purchase-orders", response_model=schemas.PurchaseOrder)
def create_purchase_order(
    order: schemas.PurchaseOrderCreate,
    current_user: Annotated[models.User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    # 0. Auto-generate Order Number if missing
    final_order_number = order.order_number
    if not final_order_number:
        # Format: OC-YYYY-XXXX (e.g., OC-2025-0001)
        import datetime
        current_year = datetime.date.today().year
        prefix = f"OC-{current_year}-"
        
        # Find last order with this prefix for this company
        last_order = db.query(models.PurchaseOrder).filter(
            models.PurchaseOrder.company_id == current_user.company_id,
            models.PurchaseOrder.order_number.like(f"{prefix}%")
        ).order_by(models.PurchaseOrder.id.desc()).first()
        
        next_seq = 1
        if last_order and last_order.order_number:
            try:
                # Extract sequence part
                parts = last_order.order_number.split('-')
                if len(parts) >= 3:
                     # OC, 2025, 0001
                     last_seq = int(parts[-1])
                     next_seq = last_seq + 1
            except ValueError:
                pass # Fallback to 1 if parsing fails
        
        final_order_number = f"{prefix}{next_seq:04d}"

    # 1. Create Order
    db_order = models.PurchaseOrder(
        company_id=current_user.company_id,
        supplier_id=order.supplier_id,
        order_date=order.order_date,
        delivery_date=order.delivery_date,
        observations=order.observations,
        order_number=final_order_number,
        status=models.PurchaseOrderStatus.PENDIENTE,
        total_amount=0 # Will calc below
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)

    # 2. Add Items and Calc Total
    total_amount = 0
    for item in order.items:
        # Calculate item total
        item_total = item.quantity * item.unit_price
        total_amount += item_total
        
        db_item = models.PurchaseOrderItem(
            purchase_order_id=db_order.id,
            spare_part_id=item.spare_part_id,
            description=item.description,
            quantity=item.quantity,
            unit_price=item.unit_price,
            total_price=item_total,
            received_quantity=item.received_quantity,
            received_date=item.received_date
        )
        db.add(db_item)
    
    # Update Order Total
    db_order.total_amount = total_amount
    db.commit()
    db.refresh(db_order)
    
    return db_order

@router.get("/purchase-orders", response_model=List[schemas.PurchaseOrder])
def read_purchase_orders(
    current_user: Annotated[models.User, Depends(get_current_active_user)],
    db: Session = Depends(get_db),
    status: str = None, # Optional filter
    supplier_id: int = None
):
    query = db.query(models.PurchaseOrder).filter(models.PurchaseOrder.company_id == current_user.company_id)
    
    if status is not None:
        if status == "PENDIENTES":
            # "Pendientes" could mean Status PENDIENTE or PARCIALMENTE_RECIBIDO (anything not COMPLETED/CANCELLED)
             query = query.filter(models.PurchaseOrder.status.in_([
                 models.PurchaseOrderStatus.PENDIENTE, 
                 models.PurchaseOrderStatus.PARCIALMENTE_RECIBIDO
             ]))
        elif status == "RECIBIDAS":
             query = query.filter(models.PurchaseOrder.status == models.PurchaseOrderStatus.COMPLETADA)
        elif status != "TODAS":
             # Specific status
             query = query.filter(models.PurchaseOrder.status == status)

    if supplier_id:
        query = query.filter(models.PurchaseOrder.supplier_id == supplier_id)

    # Order by date desc
    return query.order_by(models.PurchaseOrder.order_date.desc()).all()

@router.get("/purchase-orders/{order_id}", response_model=schemas.PurchaseOrder)
def read_purchase_order(
    order_id: int,
    current_user: Annotated[models.User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    db_order = db.query(models.PurchaseOrder).filter(
        models.PurchaseOrder.id == order_id, 
        models.PurchaseOrder.company_id == current_user.company_id
    ).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Purchase Order not found")
    return db_order

def recalculate_order_status(db_order: models.PurchaseOrder):
    """
    Recalculates the status of the order based on items.
    Updates db_order.status in place (does not commit).
    """
    if db_order.status == models.PurchaseOrderStatus.CANCELADA:
        return # Don't auto-uncancel?

    total_items = len(db_order.items)
    if total_items == 0:
        db_order.status = models.PurchaseOrderStatus.PENDIENTE
        return

    all_received = True
    any_received = False

    for item in db_order.items:
        if item.received_quantity < item.quantity:
            all_received = False
        if item.received_quantity > 0:
            any_received = True

    if all_received:
        db_order.status = models.PurchaseOrderStatus.COMPLETADA
    elif any_received:
        db_order.status = models.PurchaseOrderStatus.PARCIALMENTE_RECIBIDO
    else:
        db_order.status = models.PurchaseOrderStatus.PENDIENTE

@router.put("/purchase-orders/{order_id}", response_model=schemas.PurchaseOrder)
def update_purchase_order(
    order_id: int,
    order_update: schemas.PurchaseOrderCreate, # reusing Create schema which has items
    current_user: Annotated[models.User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    db_order = db.query(models.PurchaseOrder).filter(
        models.PurchaseOrder.id == order_id, 
        models.PurchaseOrder.company_id == current_user.company_id
    ).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Purchase Order not found")

    # Update Header
    db_order.supplier_id = order_update.supplier_id
    db_order.order_date = order_update.order_date
    db_order.delivery_date = order_update.delivery_date
    db_order.observations = order_update.observations
    db_order.order_number = order_update.order_number
    
    # Update Items - Full Replacement Strategy for simplicity or Intelligent Merge?
    # Strategy: Delete all existing items and re-create. 
    # Pros: Simple. Cons: Loses 'id' of items if referenced elsewhere (not likely yet).
    # Since we are sending the full list from frontend usually, this is acceptable for now.
    
    # DELETE orphan logic is handled by cascade="all, delete-orphan" in models, 
    # but we need to remove them from the list or clear the list.
    
    # Current simplistic approach: Clear and Re-add. 
    # But wait, if we want to preserve received_quantity state that might NOT be in the input 
    # if the input is just "items to buy". 
    # However, the `PurchaseOrderCreate` schema is being used which now has `received_quantity` in `PurchaseOrderItemCreate`?
    # Let's check schemas again.
    # Yes, PurchaseOrderItemCreate inherits PurchaseOrderItemBase which HAS received_quantity.
    # So the frontend MUST send the current state of items.
    
    # 1. Clear existing items
    db.query(models.PurchaseOrderItem).filter(models.PurchaseOrderItem.purchase_order_id == db_order.id).delete()
    
    # 2. Add new items
    total_amount = 0
    new_items_models = []
    
    for item in order_update.items:
        item_total = item.quantity * item.unit_price
        total_amount += item_total
        
        db_item = models.PurchaseOrderItem(
            purchase_order_id=db_order.id,
            spare_part_id=item.spare_part_id,
            description=item.description,
            quantity=item.quantity,
            unit_price=item.unit_price,
            total_price=item_total,
            received_quantity=item.received_quantity,
            received_date=item.received_date
        )
        db.add(db_item)
        new_items_models.append(db_item)
        
    db_order.total_amount = total_amount
    
    # 3. Recalculate Status
    # We need to temporarily attach items to order object for the helper to see them?
    # db_order.items is a relationship. If we just added them to session, they might not be in db_order.items yet until flush/refresh.
    # We can pass the list explicitly or flush.
    db.flush() 
    db.refresh(db_order) # This should reload items
    
    recalculate_order_status(db_order)
    
    db.commit()
    db.refresh(db_order)
    return db_order

@router.delete("/purchase-orders/{order_id}")
def delete_purchase_order(
    order_id: int,
    current_user: Annotated[models.User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    db_order = db.query(models.PurchaseOrder).filter(
        models.PurchaseOrder.id == order_id, 
        models.PurchaseOrder.company_id == current_user.company_id
    ).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Purchase Order not found")
        
    db.delete(db_order)
    db.commit()
    return {"status": "success"}
