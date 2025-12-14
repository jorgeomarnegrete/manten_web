from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"Hello": "World"}

from .database import engine, Base
# Base.metadata.create_all(bind=engine) # Uncomment to create tables on startup
