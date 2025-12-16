from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Date, Enum, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from .database import Base

class CompanyStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    DELETED_PENDING = "DELETED_PENDING"

class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    code = Column(String, unique=True, index=True) # For registration/invites
    status = Column(Enum(CompanyStatus), default=CompanyStatus.ACTIVE)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_payment_date = Column(Date, nullable=True) # Null enables trial or initial state
    
    users = relationship("User", back_populates="company")
    payments = relationship("Payment", back_populates="company")
    subscription = relationship("Subscription", back_populates="company", uselist=False)

    # Archives Module
    sectors = relationship("Sector", back_populates="company")
    workers = relationship("Worker", back_populates="company")
    assets = relationship("Asset", back_populates="company")
    tools = relationship("Tool", back_populates="company")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True) # Nullable only for superadmins
    company = relationship("Company", back_populates="users")

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    amount = Column(Numeric(10, 2))
    payment_date = Column(DateTime(timezone=True), server_default=func.now())
    payment_method = Column(String) # e.g., "stripe", "mercadopago"
    transaction_id = Column(String, unique=True)
    
    company = relationship("Company", back_populates="payments")

class Plan(Base):
    __tablename__ = "plans"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True) # e.g., "Basic", "Pro"
    mp_preapproval_plan_id = Column(String, unique=True) # Mercado Pago Preapproval Plan ID
    price = Column(Numeric(10, 2))
    currency = Column(String, default="ARS") # Changed to ARS for MP/Region context
    interval = Column(String, default="month") # "month", "year"

    subscriptions = relationship("Subscription", back_populates="plan")

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), unique=True) # One active sub per company
    plan_id = Column(Integer, ForeignKey("plans.id"))
    mp_preapproval_id = Column(String, unique=True, index=True) # Mercado Pago Subscription ID
    status = Column(String) # "authorized", "paused", "cancelled"
    current_period_end = Column(DateTime)

    company = relationship("Company", back_populates="subscription")
    plan = relationship("Plan", back_populates="subscriptions")


# --- Archives Module Models ---

class Sector(Base):
    __tablename__ = "sectors"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    name = Column(String, index=True)
    description = Column(String, nullable=True)

    company = relationship("Company", back_populates="sectors")
    assets = relationship("Asset", back_populates="sector")
    workers = relationship("Worker", back_populates="sector") # Default sector for worker
    tools = relationship("Tool", back_populates="sector") # Tools assigned to sector

class Worker(Base):
    __tablename__ = "workers"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    sector_id = Column(Integer, ForeignKey("sectors.id"), nullable=True) # Primary/Default sector
    
    first_name = Column(String, index=True)
    last_name = Column(String, index=True)
    rut_dni = Column(String, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    job_title = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)

    company = relationship("Company", back_populates="workers")
    sector = relationship("Sector", back_populates="workers")
    tools = relationship("Tool", back_populates="worker")

class Asset(Base): # Maquinas
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    sector_id = Column(Integer, ForeignKey("sectors.id"), nullable=False) # Mandatory as requested

    name = Column(String, index=True)
    brand = Column(String, nullable=True)
    model = Column(String, nullable=True)
    serial_number = Column(String, nullable=True)
    purchase_date = Column(Date, nullable=True)
    status = Column(String, default="ACTIVE") # ACTIVE, INACTIVE, MAINTENANCE

    company = relationship("Company", back_populates="assets")
    sector = relationship("Sector", back_populates="assets")

class Tool(Base):
    __tablename__ = "tools"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    
    name = Column(String, index=True)
    code = Column(String, nullable=True) # SKU/Internal Code
    brand = Column(String, nullable=True)
    status = Column(String, default="AVAILABLE") # AVAILABLE, IN_USE, BROKEN, LOST

    # Assignment Logic: Can be held by Worker OR Sector
    current_worker_id = Column(Integer, ForeignKey("workers.id"), nullable=True)
    current_sector_id = Column(Integer, ForeignKey("sectors.id"), nullable=True)

    company = relationship("Company", back_populates="tools")
    worker = relationship("Worker", back_populates="tools")
    sector = relationship("Sector", back_populates="tools")
