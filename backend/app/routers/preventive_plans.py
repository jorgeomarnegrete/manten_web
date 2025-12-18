from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Annotated
from datetime import date, timedelta, datetime
import uuid

from .. import models, schemas, crud
from ..database import get_db
from ..dependencies import get_current_active_user

router = APIRouter(
    prefix="/preventive-plans",
    tags=["preventive-plans"],
)

def calculate_next_run(last_run: date, frequency_type: str, frequency_value: int) -> date:
    if frequency_type == "DIARIA":
        return last_run + timedelta(days=frequency_value)
    elif frequency_type == "SEMANAL":
        return last_run + timedelta(weeks=frequency_value)
    elif frequency_type == "MENSUAL":
        # Rough estimation: 30 days * value
        return last_run + timedelta(days=30 * frequency_value)
    elif frequency_type == "ANUAL":
        return last_run + timedelta(days=365 * frequency_value)
    return last_run + timedelta(days=frequency_value)

    return last_run + timedelta(days=frequency_value)

@router.post("", response_model=schemas.PreventivePlan)
def create_plan(
    plan: schemas.PreventivePlanCreate,
    current_user: Annotated[models.User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    # Calculate next_run immediately if not provided (though typically starts from now or user input)
    # PlanCreate doesn't have next_run input usually, but we can default to today + frequency
    # We'll set last_run to None (never run) and next_run to today or tomorrow?
    # Let's assume next_run = today for immediate effect, or let user edit it.
    # For now, let's default next_run to TODAY so it triggers immediately if active.
    
    db_plan = models.PreventivePlan(
        company_id=current_user.company_id,
        asset_id=plan.asset_id,
        name=plan.name,
        frequency_type=plan.frequency_type,
        frequency_value=plan.frequency_value,
        is_active=plan.is_active,
        next_run=date.today() # valid start
    )
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)

    # Add tasks
    for task_data in plan.tasks:
        db_task = models.PreventiveTask(
            plan_id=db_plan.id,
            description=task_data.description,
            estimated_time=task_data.estimated_time
        )
        db.add(db_task)
    
    db.commit()
    db.refresh(db_plan)
    return db_plan

@router.get("", response_model=List[schemas.PreventivePlan])
def read_plans(
    current_user: Annotated[models.User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)  
):
    return db.query(models.PreventivePlan).filter(models.PreventivePlan.company_id == current_user.company_id).all()

@router.post("/check-and-run")
def check_and_run_plans(
    current_user: Annotated[models.User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    """
    Checks all active plans for the company.
    If next_run <= today, generates a WorkOrder and updates the plan.
    """
    plans = db.query(models.PreventivePlan).filter(
        models.PreventivePlan.company_id == current_user.company_id,
        models.PreventivePlan.is_active == True,
        models.PreventivePlan.next_run <= date.today()
    ).all()

    generated_count = 0

    for plan in plans:
        # Generate OT
        # Create ticket number
        ticket_number = f"PM-{plan.id}-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        # Consolidate tasks into description
        task_list = "\n".join([f"- [ ] {t.description}" for t in plan.tasks])
        description = f"Mantenimiento Preventivo según Plan: {plan.name}\n\nTareas:\n{task_list}"

        work_order = models.WorkOrder(
            company_id=current_user.company_id,
            asset_id=plan.asset_id,
            plan_id=plan.id, # Link back
            ticket_number=ticket_number,
            type=models.WorkOrderType.PREVENTIVO,
            status=models.WorkOrderStatus.PENDIENTE,
            priority="MEDIA",
            description=description,
            requested_by_id=current_user.id # System triggered but by user action? Or maybe None?
            # assigned_to_id is None initially
        )
        db.add(work_order)

        # Update Plan
        plan.last_run = date.today()
        plan.next_run = calculate_next_run(date.today(), plan.frequency_type, plan.frequency_value)
        
        generated_count += 1
    
    db.commit()
    return {"status": "success", "generated_count": generated_count}

@router.delete("/{plan_id}")
def delete_plan(
    plan_id: int,
    current_user: Annotated[models.User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    plan = db.query(models.PreventivePlan).filter(models.PreventivePlan.id == plan_id, models.PreventivePlan.company_id == current_user.company_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    db.delete(plan)
    db.commit()
    return {"status": "success"}
