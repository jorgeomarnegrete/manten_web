from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, date
from uuid import UUID

# User Schemas
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    company_id: Optional[int] = None
    
    class Config:
        orm_mode = True

# Company Schemas
class CompanyBase(BaseModel):
    name: str

class CompanyCreate(CompanyBase):
    admin_email: EmailStr
    admin_password: str

class Company(CompanyBase):
    id: int
    code: str
    status: str
    created_at: datetime
    last_payment_date: Optional[date] = None
    
    class Config:
        orm_mode = True

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    company_id: Optional[int] = None
