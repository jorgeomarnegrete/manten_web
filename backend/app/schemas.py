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

# Plan & Subscription Schemas
class PlanBase(BaseModel):
    name: str
    price: float
    currency: str
    interval: str

class Plan(PlanBase):
    id: int
    mp_preapproval_plan_id: str
    
    class Config:
        orm_mode = True

class SubscriptionBase(BaseModel):
    status: str
    current_period_end: Optional[datetime] = None

class Subscription(SubscriptionBase):
    id: int
    company_id: int
    plan_id: int
    plan: Plan
    
    class Config:
        orm_mode = True

# --- Preventive Maintenance Schemas ---

class PreventiveTaskBase(BaseModel):
    description: str
    estimated_time: Optional[int] = None

class PreventiveTaskCreate(PreventiveTaskBase):
    pass

class PreventiveTask(PreventiveTaskBase):
    id: int
    plan_id: int

    class Config:
        orm_mode = True

class PreventivePlanBase(BaseModel):
    name: str
    frequency_type: str # using str to avoid enum complexity in pydantic validation simple cases
    frequency_value: int = 1
    is_active: bool = True
    asset_id: int

class PreventivePlanCreate(PreventivePlanBase):
    tasks: List[PreventiveTaskCreate] = []

class PreventivePlan(PreventivePlanBase):
    id: int
    company_id: int
    last_run: Optional[date] = None
    next_run: Optional[date] = None
    tasks: List[PreventiveTask] = []

    class Config:
        orm_mode = True

# --- Work Order Schemas ---

class WorkOrderBase(BaseModel):
    title: Optional[str] = None # Maybe ticket_number is generated
    description: str
    observations: Optional[str] = None
    priority: str = "MEDIA"
    status: str = "PENDIENTE"
    type: str = "CORRECTIVO"
    asset_id: Optional[int] = None
    sector_id: Optional[int] = None
    assigned_to_id: Optional[int] = None

class WorkOrderCreate(WorkOrderBase):
    requested_by_id: int

class WorkOrder(WorkOrderBase):
    id: int
    ticket_number: str
    company_id: int
    requested_by_id: Optional[int] = None
    created_at: datetime
    assigned_at: Optional[datetime] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    plan_id: Optional[int] = None
    asset: Optional["Asset"] = None # Avoid circular import issues if any, or strict order

    class Config:
        orm_mode = True

from .schemas_archives import Asset
WorkOrder.update_forward_refs()

