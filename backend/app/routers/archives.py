from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Annotated
from .. import models, schemas_archives, crud
from ..database import get_db
from ..dependencies import get_current_active_user

router = APIRouter(
    prefix="/archives",
    tags=["archives"],
)

# --- SECTORS ---
@router.post("/sectors", response_model=schemas_archives.Sector)
def create_sector(
    sector: schemas_archives.SectorCreate,
    current_user: Annotated[models.User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    db_sector = models.Sector(**sector.dict(), company_id=current_user.company_id)
    db.add(db_sector)
    db.commit()
    db.refresh(db_sector)
    return db_sector

@router.get("/sectors", response_model=List[schemas_archives.Sector])
def read_sectors(
    current_user: Annotated[models.User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)  
):
    return db.query(models.Sector).filter(models.Sector.company_id == current_user.company_id).all()

@router.put("/sectors/{sector_id}", response_model=schemas_archives.Sector)
def update_sector(
    sector_id: int,
    sector_update: schemas_archives.SectorCreate,
    current_user: Annotated[models.User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    db_sector = db.query(models.Sector).filter(models.Sector.id == sector_id, models.Sector.company_id == current_user.company_id).first()
    if not db_sector:
        raise HTTPException(status_code=404, detail="Sector not found")
    
    db_sector.name = sector_update.name
    db_sector.description = sector_update.description
    db.commit()
    db.refresh(db_sector)
    return db_sector

@router.delete("/sectors/{sector_id}")
def delete_sector(
    sector_id: int,
    current_user: Annotated[models.User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    db_sector = db.query(models.Sector).filter(models.Sector.id == sector_id, models.Sector.company_id == current_user.company_id).first()
    if not db_sector:
        raise HTTPException(status_code=404, detail="Sector not found")
        
    db.delete(db_sector)
    db.commit()
    return {"status": "success"}

# --- WORKERS ---
@router.post("/workers", response_model=schemas_archives.Worker)
def create_worker(
    worker: schemas_archives.WorkerCreate,
    current_user: Annotated[models.User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    # Verify sector belongs to company if provided
    if worker.sector_id:
        sector = db.query(models.Sector).filter(models.Sector.id == worker.sector_id, models.Sector.company_id == current_user.company_id).first()
        if not sector:
            raise HTTPException(status_code=400, detail="Invalid Sector ID")

    db_worker = models.Worker(**worker.dict(), company_id=current_user.company_id)
    db.add(db_worker)
    db.commit()
    db.refresh(db_worker)
    return db_worker

@router.get("/workers", response_model=List[schemas_archives.Worker])
def read_workers(
    current_user: Annotated[models.User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    return db.query(models.Worker).filter(models.Worker.company_id == current_user.company_id).all()

@router.put("/workers/{worker_id}", response_model=schemas_archives.Worker)
def update_worker(
    worker_id: int,
    worker_update: schemas_archives.WorkerCreate,
    current_user: Annotated[models.User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    db_worker = db.query(models.Worker).filter(models.Worker.id == worker_id, models.Worker.company_id == current_user.company_id).first()
    if not db_worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    
    # Validate Sector if provided
    if worker_update.sector_id:
         sector = db.query(models.Sector).filter(models.Sector.id == worker_update.sector_id, models.Sector.company_id == current_user.company_id).first()
         if not sector:
            raise HTTPException(status_code=400, detail="Invalid Sector ID")

    for key, value in worker_update.dict().items():
        setattr(db_worker, key, value)

    db.commit()
    db.refresh(db_worker)
    return db_worker

@router.delete("/workers/{worker_id}")
def delete_worker(
    worker_id: int,
    current_user: Annotated[models.User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    db_worker = db.query(models.Worker).filter(models.Worker.id == worker_id, models.Worker.company_id == current_user.company_id).first()
    if not db_worker:
        raise HTTPException(status_code=404, detail="Worker not found")
        
    db.delete(db_worker)
    db.commit()
    return {"status": "success"}

# --- ASSETS ---
@router.post("/assets", response_model=schemas_archives.Asset)
def create_asset(
    asset: schemas_archives.AssetCreate,
    current_user: Annotated[models.User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    # Validate Sector (Mandatory)
    sector = db.query(models.Sector).filter(models.Sector.id == asset.sector_id, models.Sector.company_id == current_user.company_id).first()
    if not sector:
        raise HTTPException(status_code=400, detail="Invalid Sector ID - Asset must belong to a valid sector")

    db_asset = models.Asset(**asset.dict(), company_id=current_user.company_id)
    db.add(db_asset)
    db.commit()
    db.refresh(db_asset)
    return db_asset

@router.get("/assets", response_model=List[schemas_archives.Asset])
def read_assets(
    current_user: Annotated[models.User, Depends(get_current_active_user)],
    db: Session = Depends(get_db),
    sector_id: int = None
):
    query = db.query(models.Asset).filter(models.Asset.company_id == current_user.company_id)
    if sector_id:
        query = query.filter(models.Asset.sector_id == sector_id)
    return query.all()

@router.put("/assets/{asset_id}", response_model=schemas_archives.Asset)
def update_asset(
    asset_id: int,
    asset_update: schemas_archives.AssetCreate,
    current_user: Annotated[models.User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    db_asset = db.query(models.Asset).filter(models.Asset.id == asset_id, models.Asset.company_id == current_user.company_id).first()
    if not db_asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # Validate Sector if changed
    if asset_update.sector_id != db_asset.sector_id:
         sector = db.query(models.Sector).filter(models.Sector.id == asset_update.sector_id, models.Sector.company_id == current_user.company_id).first()
         if not sector:
            raise HTTPException(status_code=400, detail="Invalid Sector ID")

    for key, value in asset_update.dict().items():
        setattr(db_asset, key, value)

    db.commit()
    db.refresh(db_asset)
    return db_asset

@router.delete("/assets/{asset_id}")
def delete_asset(
    asset_id: int,
    current_user: Annotated[models.User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    db_asset = db.query(models.Asset).filter(models.Asset.id == asset_id, models.Asset.company_id == current_user.company_id).first()
    if not db_asset:
        raise HTTPException(status_code=404, detail="Asset not found")
        
    db.delete(db_asset)
    db.commit()
    return {"status": "success"}

# --- TOOLS ---
@router.post("/tools", response_model=schemas_archives.Tool)
def create_tool(
    tool: schemas_archives.ToolCreate,
    current_user: Annotated[models.User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    # Validation logic for assignment could go here
    db_tool = models.Tool(**tool.dict(), company_id=current_user.company_id)
    db.add(db_tool)
    db.commit()
    db.refresh(db_tool)
    return db_tool

@router.get("/tools", response_model=List[schemas_archives.Tool])
def read_tools(
    current_user: Annotated[models.User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    return db.query(models.Tool).filter(models.Tool.company_id == current_user.company_id).all()
@router.put("/tools/{tool_id}", response_model=schemas_archives.Tool)
def update_tool(
    tool_id: int,
    tool_update: schemas_archives.ToolCreate,
    current_user: Annotated[models.User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    db_tool = db.query(models.Tool).filter(models.Tool.id == tool_id, models.Tool.company_id == current_user.company_id).first()
    if not db_tool:
        raise HTTPException(status_code=404, detail="Tool not found")

    # Validate assignments (Worker OR Sector, not both ideally, or priority?)
    # Model allows both nullable, but business logic usually implies one holder.
    # For now, we trust the input but verify existence.
    
    if tool_update.current_worker_id:
         worker = db.query(models.Worker).filter(models.Worker.id == tool_update.current_worker_id, models.Worker.company_id == current_user.company_id).first()
         if not worker:
            raise HTTPException(status_code=400, detail="Invalid Worker ID")
            
    if tool_update.current_sector_id:
         sector = db.query(models.Sector).filter(models.Sector.id == tool_update.current_sector_id, models.Sector.company_id == current_user.company_id).first()
         if not sector:
            raise HTTPException(status_code=400, detail="Invalid Sector ID")

    for key, value in tool_update.dict().items():
        setattr(db_tool, key, value)

    db.commit()
    db.refresh(db_tool)
    return db_tool

@router.delete("/tools/{tool_id}")
def delete_tool(
    tool_id: int,
    current_user: Annotated[models.User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    db_tool = db.query(models.Tool).filter(models.Tool.id == tool_id, models.Tool.company_id == current_user.company_id).first()
    if not db_tool:
        raise HTTPException(status_code=404, detail="Tool not found")
        
    db.delete(db_tool)
    db.commit()
    return {"status": "success"}

# --- SPARE PARTS CATEGORIES ---
@router.post("/categories", response_model=schemas_archives.SparePartCategoryOut)
def create_category(
    category: schemas_archives.SparePartCategoryCreate,
    current_user: Annotated[models.User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    db_category = models.SparePartCategory(**category.dict(), company_id=current_user.company_id)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

@router.get("/categories", response_model=List[schemas_archives.SparePartCategoryOut])
def read_categories(
    current_user: Annotated[models.User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    return db.query(models.SparePartCategory).filter(models.SparePartCategory.company_id == current_user.company_id).all()

@router.delete("/categories/{category_id}")
def delete_category(
    category_id: int,
    current_user: Annotated[models.User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    db_category = db.query(models.SparePartCategory).filter(models.SparePartCategory.id == category_id, models.SparePartCategory.company_id == current_user.company_id).first()
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")
        
    db.delete(db_category)
    db.commit()
    return {"status": "success"}

# --- SPARE PARTS ---
@router.post("/spare-parts", response_model=schemas_archives.SparePartOut)
def create_spare_part(
    spare_part: schemas_archives.SparePartCreate,
    current_user: Annotated[models.User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    if spare_part.category_id:
        category = db.query(models.SparePartCategory).filter(models.SparePartCategory.id == spare_part.category_id, models.SparePartCategory.company_id == current_user.company_id).first()
        if not category:
             raise HTTPException(status_code=400, detail="Invalid Category ID")

    db_spare_part = models.SparePart(**spare_part.dict(), company_id=current_user.company_id)
    db.add(db_spare_part)
    db.commit()
    db.refresh(db_spare_part)
    return db_spare_part

@router.get("/spare-parts", response_model=List[schemas_archives.SparePartOut])
def read_spare_parts(
    current_user: Annotated[models.User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    return db.query(models.SparePart).filter(models.SparePart.company_id == current_user.company_id).all()

@router.put("/spare-parts/{spare_part_id}", response_model=schemas_archives.SparePartOut)
def update_spare_part(
    spare_part_id: int,
    spare_part_update: schemas_archives.SparePartCreate,
    current_user: Annotated[models.User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    db_spare_part = db.query(models.SparePart).filter(models.SparePart.id == spare_part_id, models.SparePart.company_id == current_user.company_id).first()
    if not db_spare_part:
        raise HTTPException(status_code=404, detail="Spare Part not found")
    
    if spare_part_update.category_id:
        category = db.query(models.SparePartCategory).filter(models.SparePartCategory.id == spare_part_update.category_id, models.SparePartCategory.company_id == current_user.company_id).first()
        if not category:
             raise HTTPException(status_code=400, detail="Invalid Category ID")

    for key, value in spare_part_update.dict().items():
        setattr(db_spare_part, key, value)

    db.commit()
    db.refresh(db_spare_part)
    return db_spare_part

@router.delete("/spare-parts/{spare_part_id}")
def delete_spare_part(
    spare_part_id: int,
    current_user: Annotated[models.User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    db_spare_part = db.query(models.SparePart).filter(models.SparePart.id == spare_part_id, models.SparePart.company_id == current_user.company_id).first()
    if not db_spare_part:
        raise HTTPException(status_code=404, detail="Spare Part not found")
        
    db.delete(db_spare_part)
    db.commit()
    return {"status": "success"}

# --- SUPPLIERS ---
@router.post("/suppliers", response_model=schemas_archives.SupplierOut)
def create_supplier(
    supplier: schemas_archives.SupplierCreate,
    current_user: Annotated[models.User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    # Fetch categories
    categories = []
    if supplier.category_ids:
        categories = db.query(models.SparePartCategory).filter(
            models.SparePartCategory.id.in_(supplier.category_ids),
            models.SparePartCategory.company_id == current_user.company_id
        ).all()
        
        if len(categories) != len(supplier.category_ids):
             raise HTTPException(status_code=400, detail="One or more Category IDs are invalid")

    supplier_data = supplier.dict(exclude={"category_ids"})
    db_supplier = models.Supplier(**supplier_data, company_id=current_user.company_id)
    db_supplier.categories = categories # Assign Many-to-Many
    
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier

@router.get("/suppliers", response_model=List[schemas_archives.SupplierOut])
def read_suppliers(
    current_user: Annotated[models.User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    return db.query(models.Supplier).filter(models.Supplier.company_id == current_user.company_id).all()

@router.put("/suppliers/{supplier_id}", response_model=schemas_archives.SupplierOut)
def update_supplier(
    supplier_id: int,
    supplier_update: schemas_archives.SupplierCreate,
    current_user: Annotated[models.User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    db_supplier = db.query(models.Supplier).filter(models.Supplier.id == supplier_id, models.Supplier.company_id == current_user.company_id).first()
    if not db_supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    # Update categories
    if supplier_update.category_ids is not None:
         categories = db.query(models.SparePartCategory).filter(
            models.SparePartCategory.id.in_(supplier_update.category_ids),
            models.SparePartCategory.company_id == current_user.company_id
        ).all()
         if len(categories) != len(supplier_update.category_ids):
             raise HTTPException(status_code=400, detail="One or more Category IDs are invalid")
         db_supplier.categories = categories

    supplier_data = supplier_update.dict(exclude={"category_ids"})
    for key, value in supplier_data.items():
        setattr(db_supplier, key, value)

    db.commit()
    db.refresh(db_supplier)
    return db_supplier

@router.delete("/suppliers/{supplier_id}")
def delete_supplier(
    supplier_id: int,
    current_user: Annotated[models.User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    db_supplier = db.query(models.Supplier).filter(models.Supplier.id == supplier_id, models.Supplier.company_id == current_user.company_id).first()
    if not db_supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
        
    db.delete(db_supplier)
    db.commit()
    return {"status": "success"}
