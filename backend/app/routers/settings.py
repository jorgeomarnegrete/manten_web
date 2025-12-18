from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import Annotated
import os
import shutil
from pathlib import Path

from .. import models, schemas, crud
from ..database import get_db
from ..dependencies import get_current_active_user

router = APIRouter(
    prefix="/settings",
    tags=["settings"],
    responses={404: {"description": "Not found"}},
)

UPLOAD_DIR = "static/uploads"

@router.get("/general", response_model=schemas.Company)
async def get_company_settings(
    current_user: Annotated[models.User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    if not current_user.company_id:
        raise HTTPException(status_code=404, detail="Company not found for user")
    
    company = db.query(models.Company).filter(models.Company.id == current_user.company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    return company

@router.put("/general", response_model=schemas.Company)
async def update_company_settings(
    settings_update: schemas.CompanyUpdate,
    current_user: Annotated[models.User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    if not current_user.company_id:
        raise HTTPException(status_code=404, detail="Company not found for user")
        
    company = db.query(models.Company).filter(models.Company.id == current_user.company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    update_data = settings_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(company, key, value)
        
    db.commit()
    db.refresh(company)
    return company

@router.post("/logo")
async def upload_logo(
    current_user: Annotated[models.User, Depends(get_current_active_user)],
    db: Session = Depends(get_db),
    file: UploadFile = File(...)
):
    if not current_user.company_id:
        raise HTTPException(status_code=404, detail="Company not found for user")
        
    company = db.query(models.Company).filter(models.Company.id == current_user.company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    # Create upload dir if not exists
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    
    # Generate filename (company_id_filename)
    file_extension = Path(file.filename).suffix
    filename = f"company_{company.id}_logo{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Update DB URL (assuming static mount at /static)
    logo_url = f"/static/uploads/{filename}"
    company.logo_url = logo_url
    db.commit()
    
    return {"logo_url": logo_url}
