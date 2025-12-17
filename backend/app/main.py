from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Annotated
from jose import JWTError, jwt

from .database import engine, Base, get_db
from . import models, schemas, crud, utils
from .dependencies import get_current_user, get_current_active_user
from .routers import payments, archives, preventive_plans, work_orders

# Create tables automatically (dev only)
Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(payments.router)
app.include_router(archives.router)
app.include_router(preventive_plans.router)
app.include_router(work_orders.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not utils.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=utils.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = utils.create_access_token(
        data={"sub": user.email, "company_id": user.company_id},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=schemas.User)
async def read_users_me(current_user: Annotated[models.User, Depends(get_current_active_user)]):
    return current_user

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.post("/register", response_model=schemas.Company)
def register_company(company: schemas.CompanyCreate, db: Session = Depends(get_db)):
    # Verificar si el email ya esta registrado (check simplificado)
    db_user = crud.get_user_by_email(db, email=company.admin_email)
    if db_user:
        raise HTTPException(status_code=400, detail="El correo electrónico ya está registrado")
    
    db_company, db_user = crud.create_company_with_admin(db=db, company=company)
    return db_company
