from fastapi import APIRouter, Depends, HTTPException, status, Form, Body
from sqlalchemy.orm import Session
from ..db.session import SessionLocal, Base, engine
from ..models.user import User
from ..schemas.user import UserCreate, UserOut
from ..schemas.auth import Token
from ..core.security import hash_password, verify_password, create_access_token

# Google OAuth imports
from google.oauth2 import id_token
from google.auth.transport import requests as grequests
import os, secrets

router = APIRouter()

# Create DB tables at import
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --------------------
# Normal signup
# --------------------
@router.post("/signup", response_model=UserOut)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    exists = db.query(User).filter(User.username == user.username).first()
    if exists:
        raise HTTPException(status_code=400, detail="Username already exists")
    obj = User(username=user.username, hashed_password=hash_password(user.password))
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

# --------------------
# Normal login
# --------------------
@router.post("/login", response_model=Token)
def login(
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db),
):
    u = db.query(User).filter(User.username == username).first()
    if not u or not verify_password(password, u.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token({"sub": u.username, "uid": u.id})
    return {"access_token": token, "token_type": "bearer"}

# --------------------
# Google login
# --------------------
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

@router.post("/google", response_model=Token)
def google_login(payload: dict = Body(...), db: Session = Depends(get_db)):
    token_str = payload.get("id_token")
    if not token_str:
        raise HTTPException(status_code=400, detail="Missing id_token")

    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Server misconfigured: GOOGLE_CLIENT_ID missing")

    try:
        # Verify Google ID token
        info = id_token.verify_oauth2_token(
            token_str,
            grequests.Request(),
            GOOGLE_CLIENT_ID
        )
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Google ID token")

    email = info.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Google account has no email")

    # Create or fetch user
    user = db.query(User).filter(User.username == email).first()
    if not user:
        user = User(username=email, hashed_password=hash_password(secrets.token_hex(16)))
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token({"sub": user.username, "uid": user.id})
    return {"access_token": token, "token_type": "bearer"}
