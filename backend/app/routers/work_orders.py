from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Annotated, Optional
from datetime import datetime

from .. import models, schemas, crud
from ..database import get_db
from ..dependencies import get_current_active_user

router = APIRouter(
    prefix="/work-orders",
    tags=["work-orders"],
)

@router.post("", response_model=schemas.WorkOrder)
def create_work_order(
    work_order: schemas.WorkOrderCreate,
    current_user: Annotated[models.User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    ticket_number = f"WO-{datetime.now().strftime('%Y%m%d%H%M%S')}"

    db_wo = models.WorkOrder(
        company_id=current_user.company_id,
        asset_id=work_order.asset_id,
        sector_id=work_order.sector_id,
        ticket_number=ticket_number,
        type=work_order.type,
        status=work_order.status,
        priority=work_order.priority,
        description=work_order.description,
        observations=work_order.observations,
        requested_by_id=current_user.id, # defaulting to creator
        assigned_to_id=work_order.assigned_to_id
    )
    db.add(db_wo)
    db.commit()
    db.refresh(db_wo)
    return db_wo

@router.get("", response_model=List[schemas.WorkOrder])
def read_work_orders(
    current_user: Annotated[models.User, Depends(get_current_active_user)],
    db: Session = Depends(get_db),
    status: Optional[str] = None,
    asset_id: Optional[int] = None
):
    query = db.query(models.WorkOrder).filter(models.WorkOrder.company_id == current_user.company_id)
    
    if status:
        query = query.filter(models.WorkOrder.status == status)
    if asset_id:
        query = query.filter(models.WorkOrder.asset_id == asset_id)
        
    return query.order_by(models.WorkOrder.created_at.desc()).all()

@router.get("/{wo_id}", response_model=schemas.WorkOrder)
def read_work_order(
    wo_id: int,
    current_user: Annotated[models.User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    wo = db.query(models.WorkOrder).filter(models.WorkOrder.id == wo_id, models.WorkOrder.company_id == current_user.company_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail="Work Order not found")
    return wo

@router.put("/{wo_id}", response_model=schemas.WorkOrder)
def update_work_order(
    wo_id: int,
    wo_update: schemas.WorkOrderCreate, # Using Create schema but treating partial fields handling manually or simpler full update
    current_user: Annotated[models.User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    # Note: Using Create schema for update is lazy but works if we iterate. Ideally use a dedicated Update schema with Optional fields.
    # For now, we assume the frontend sends the full object or what's needed.
    # But wait, Create schema has required fields. We should probably use a dynamic approach or creating an update schema.
    # Given the MVP constraint, I'll stick to manual updates of key fields or assume the frontend sends everything.
    
    db_wo = db.query(models.WorkOrder).filter(models.WorkOrder.id == wo_id, models.WorkOrder.company_id == current_user.company_id).first()
    if not db_wo:
        raise HTTPException(status_code=404, detail="Work Order not found")

    # Update logic - for simplicity, updating what's passed except IDs if they shouldn't change
    db_wo.description = wo_update.description
    db_wo.observations = wo_update.observations
    db_wo.priority = wo_update.priority
    db_wo.status = wo_update.status
    db_wo.assigned_to_id = wo_update.assigned_to_id
    
    # Handle status changes side effects (start_date, end_date) could be added here
    # Handle status changes side effects (start_date, end_date) could be added here
    if wo_update.status == "EN_PROGRESO" and not db_wo.start_date:
        db_wo.start_date = datetime.now()
    if wo_update.status == "COMPLETADA" and not db_wo.end_date:
        db_wo.end_date = datetime.now()

    db.commit()
    db.refresh(db_wo)
    return db_wo
