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
