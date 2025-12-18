from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import Annotated, List
from datetime import datetime

from .. import models, schemas
from ..database import get_db
from ..dependencies import get_current_active_user

router = APIRouter(
    prefix="/dashboard",
    tags=["dashboard"],
    responses={404: {"description": "Not found"}},
)

@router.get("/stats")
async def get_dashboard_stats(
    current_user: Annotated[models.User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    if not current_user.company_id:
        return {
            "counts": {"pending": 0, "in_progress": 0, "paused": 0},
            "recent_activity": [],
            "yearly_stats": {"corrective": 0, "preventive": 0, "total": 0}
        }
    
    # 1. Counts by Status
    # We want specific statuses: PENDIENTE, EN_PROGRESO, PAUSADA. 
    # Or maybe user wants active ones. Let's return these specific ones as requested.
    
    pending_count = db.query(models.WorkOrder).filter(
        models.WorkOrder.company_id == current_user.company_id,
        models.WorkOrder.status == models.WorkOrderStatus.PENDIENTE
    ).count()
    
    in_progress_count = db.query(models.WorkOrder).filter(
        models.WorkOrder.company_id == current_user.company_id,
        models.WorkOrder.status == models.WorkOrderStatus.EN_PROGRESO
    ).count()
    
    paused_count = db.query(models.WorkOrder).filter(
        models.WorkOrder.company_id == current_user.company_id,
        models.WorkOrder.status == models.WorkOrderStatus.PAUSADA
    ).count()
    
    # 2. Recent Activity
    # Last 5 work orders modified or created
    recent_orders = db.query(models.WorkOrder).filter(
        models.WorkOrder.company_id == current_user.company_id
    ).order_by(models.WorkOrder.created_at.desc()).limit(5).all()
    
    # We might need a specific schema for this small list to avoid circular recursion if not careful,
    # but reusing WorkOrder schema is fine if handled correctly.
    
    # 3. Yearly Stats (Current Year)
    current_year = datetime.now().year
    
    yearly_corrective = db.query(models.WorkOrder).filter(
        models.WorkOrder.company_id == current_user.company_id,
        extract('year', models.WorkOrder.created_at) == current_year,
        models.WorkOrder.type == models.WorkOrderType.CORRECTIVO
    ).count()
    
    yearly_preventive = db.query(models.WorkOrder).filter(
        models.WorkOrder.company_id == current_user.company_id,
        extract('year', models.WorkOrder.created_at) == current_year,
        models.WorkOrder.type == models.WorkOrderType.PREVENTIVO
    ).count()
    
    return {
        "counts": {
            "pending": pending_count,
            "in_progress": in_progress_count,
            "paused": paused_count
        },
        "recent_activity": recent_orders,
        "yearly_stats": {
            "corrective": yearly_corrective,
            "preventive": yearly_preventive,
            "total": yearly_corrective + yearly_preventive
        }
    }
