# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from .routers import auth
from .routers import predict
from .db.session import Base, engine  

load_dotenv()

app = FastAPI(title="Auth API", version="0.1.0")


raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")

origins = [o.strip() for o in raw_origins.split(",") if o.strip()]

if "http://127.0.0.1:5173" not in origins:
    origins.append("http://127.0.0.1:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup() -> None:
    """
    Create tables if they don't exist.
    Safe to call on each boot; no Alembic migrations in use.
    """
    Base.metadata.create_all(bind=engine)

@app.get("/health")
def health():
    return {"status": "ok"}

# Routers
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(predict.router, tags=["predict"])
