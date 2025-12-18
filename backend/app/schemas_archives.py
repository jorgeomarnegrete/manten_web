from pydantic import BaseModel
from typing import Optional, List
from datetime import date
from enum import Enum

# --- Existing User/Company Schemas (Assuming they are imported or here) ---
# For briefness, I'm appending the new ones.

# --- Enums ---
class ToolStatus(str, Enum):
    AVAILABLE = "AVAILABLE"
    IN_USE = "IN_USE"
    BROKEN = "BROKEN"
    LOST = "LOST"

class AssetStatus(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    MAINTENANCE = "MAINTENANCE"

# --- SECTORS ---
class SectorBase(BaseModel):
    name: str
    description: Optional[str] = None

class SectorCreate(SectorBase):
    pass

class Sector(SectorBase):
    id: int
    company_id: int

    class Config:
        orm_mode = True

# --- WORKERS ---
class WorkerBase(BaseModel):
    first_name: str
    last_name: str
    rut_dni: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    job_title: Optional[str] = None
    sector_id: Optional[int] = None

class WorkerCreate(WorkerBase):
    pass

class Worker(WorkerBase):
    id: int
    company_id: int
    is_active: bool

    class Config:
        orm_mode = True

# --- ASSETS ---
class AssetBase(BaseModel):
    name: str
    sector_id: int # Mandatory
    brand: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None
    purchase_date: Optional[date] = None
    status: AssetStatus = AssetStatus.ACTIVE

class AssetCreate(AssetBase):
    pass

class Asset(AssetBase):
    id: int
    company_id: int

    class Config:
        orm_mode = True

# --- TOOLS ---
class ToolBase(BaseModel):
    name: str
    code: Optional[str] = None
    brand: Optional[str] = None
    status: ToolStatus = ToolStatus.AVAILABLE
    current_worker_id: Optional[int] = None
    current_sector_id: Optional[int] = None

class ToolCreate(ToolBase):
    pass

class Tool(ToolBase):
    id: int
    company_id: int

    class Config:
        orm_mode = True

# --- SPARE PARTS ---
class SparePartCategoryBase(BaseModel):
    name: str
    description: Optional[str] = None

class SparePartCategoryCreate(SparePartCategoryBase):
    pass

class SparePartCategoryOut(SparePartCategoryBase):
    id: int
    company_id: int

    class Config:
        orm_mode = True

class SparePartBase(BaseModel):
    name: str
    internal_code: Optional[str] = None
    cost: float = 0.0
    currency: str = "ARS"
    stock: int = 0
    category_id: Optional[int] = None

class SparePartCreate(SparePartBase):
    pass

class SparePartOut(SparePartBase):
    id: int
    company_id: int
    category: Optional[SparePartCategoryOut] = None

    class Config:
        orm_mode = True

# --- SUPPLIERS ---
class SupplierBase(BaseModel):
    name: str
    address: Optional[str] = None
    city: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None

class SupplierCreate(SupplierBase):
    category_ids: List[int] = []

class SupplierOut(SupplierBase):
    id: int
    company_id: int
    categories: List[SparePartCategoryOut] = []

    class Config:
        orm_mode = True
