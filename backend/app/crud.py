from sqlalchemy.orm import Session
from . import models, schemas, utils
import uuid

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_company_with_admin(db: Session, company: schemas.CompanyCreate):
    # 1. Create Company
    company_code = str(uuid.uuid4()) # Generate unique code
    db_company = models.Company(
        name=company.name,
        code=company_code,
        status=models.CompanyStatus.ACTIVE
    )
    db.add(db_company)
    db.commit()
    db.refresh(db_company)
    
    # 2. Create Admin User
    hashed_password = utils.get_password_hash(company.admin_password)
    db_user = models.User(
        email=company.admin_email,
        hashed_password=hashed_password,
        company_id=db_company.id,
        is_active=True
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_company, db_user
