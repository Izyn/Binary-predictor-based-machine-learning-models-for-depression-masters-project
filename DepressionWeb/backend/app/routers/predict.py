# backend/app/routers/predict.py
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, Field
from typing import Literal, Optional, List
import os, joblib
import pandas as pd
import numpy as np

from ..db.session import SessionLocal, Base, engine
from ..models.submission import Submission
from ..schemas.submission import SubmissionOut

router = APIRouter()

# ---------- Load artifacts once ----------
APP_DIR = os.path.dirname(os.path.dirname(__file__))        # .../app
MODELS_DIR = os.path.join(APP_DIR, "models")
MODEL_PATH = os.path.join(MODELS_DIR, "model.pkl")
FEATURES_PATH = os.path.join(MODELS_DIR, "features.pkl")

try:
    model = joblib.load(MODEL_PATH)
    FEATURES = joblib.load(FEATURES_PATH)
except Exception as e:
    raise RuntimeError(f"Failed to load model artifacts: {e}")

# Create tables (ensures predictions table exists)
Base.metadata.create_all(bind=engine)

# ---------- DB session ----------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ---------- Optional user extraction from JWT (best‑effort, safe if missing) ----------
def extract_user_id(authorization: Optional[str], db) -> Optional[int]:
    """
    If you used the auth router that issues JWT with claim 'uid',
    this extracts it to link predictions to users. If anything fails, returns None.
    """
    if not authorization or not authorization.lower().startswith("bearer "):
        return None
    token = authorization.split(" ", 1)[1]
    try:
        # use same secret + algorithm as in your core.security
        from ..core.security import SECRET_KEY, ALGORITHM
        from jose import jwt
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        uid = payload.get("uid")
        return int(uid) if uid is not None else None
    except Exception:
        return None

# ---------- UI schema (matches your form) ----------
Marital = Literal["Single","Married","Divorced","Widowed"]
Edu = Literal["High school","Associate Degree","Bachelor's Degree","Master's Degree","PhD"]
Smoke = Literal["Smoker","Former","Non-smoker"]
PA = Literal["Sedentary","Moderate","Active"]
Emp = Literal["Employed","Unemployed"]
Alcohol = Literal["Low","Moderate","High"]
Diet = Literal["Healthy","Moderate","Unhealthy"]
Sleep = Literal["Good","Fair","Poor"]
YesNo = Literal["Yes","No"]

class PredictUI(BaseModel):
    age: int = Field(..., ge=0, le=120)
    marital_status: Marital
    education_level: Edu
    number_of_children: int = Field(..., ge=0)
    smoking_status: Smoke
    physical_activity_level: PA
    employment_status: Emp
    income: float = Field(..., ge=0)
    alcohol_consumption: Alcohol
    dietary_habits: Diet
    sleep_patterns: Sleep
    history_of_mental_illness: YesNo
    history_of_substance_abuse: YesNo
    family_history_of_depression: YesNo
    chronic_medical_conditions: YesNo

# ---------- Mapping helpers: UI -> model's 10 features ----------
def _edu_onehot(edu: str) -> dict:
    cols = {
        "Education Level_High School": 0,
        "Education Level_Bachelor's Degree": 0,
        "Education Level_Master's Degree": 0,
        "Education Level_PhD": 0,
    }
    mapping = {
        "High school": "Education Level_High School",
        "Bachelor's Degree": "Education Level_Bachelor's Degree",
        "Master's Degree": "Education Level_Master's Degree",
        "PhD": "Education Level_PhD",
        "Associate Degree": "Education Level_High School",
    }
    col = mapping.get(edu)
    if col in cols:
        cols[col] = 1
    return cols

def _employment_numeric(emp: str) -> int:
    return 1 if emp == "Employed" else 0

def _score_social_support(marital_status: str, children: int) -> float:
    base = {
        "Married": 3.8,
        "Widowed": 2.8,
        "Single": 3.2,
        "Divorced": 2.6,
    }[marital_status]
    val = base + min(children, 3) * 0.2
    return float(np.clip(val, 1.0, 5.0))

def _score_family_personal_health(sleep: str, activity: str, diet: str, chronic: str) -> float:
    s = {"Good": 4.5, "Fair": 3.2, "Poor": 2.2}[sleep]
    a = {"Active": 4.2, "Moderate": 3.4, "Sedentary": 2.4}[activity]
    d = {"Healthy": 4.3, "Moderate": 3.2, "Unhealthy": 2.2}[diet]
    c = 0.0 if chronic == "No" else -0.8
    val = (s + a + d)/3.0 + c
    return float(np.clip(val, 1.0, 5.0))

def _score_personal_burden(emp: str, income: float, alcohol: str,
                           substance: str, mental: str, children: int) -> float:
    e = 1.0 if emp == "Unemployed" else 0.0
    inc = 1.0 if income < 20000 else (0.5 if income < 40000 else 0.2)
    alc = {"Low": 0.2, "Moderate": 0.5, "High": 1.0}[alcohol]
    sub = 1.0 if substance == "Yes" else 0.0
    men = 0.8 if mental == "Yes" else 0.0
    kid = min(children, 4) * 0.15
    raw = 2.0 + e + inc + alc + sub + men + kid
    return float(np.clip(raw, 1.0, 5.0))

def ui_to_feature_df(p: PredictUI) -> pd.DataFrame:
    row = {f: 0 for f in FEATURES}
    row["Age"] = p.age
    row["Income"] = float(p.income)
    row["Employment Status"] = _employment_numeric(p.employment_status)
    row.update(_edu_onehot(p.education_level))
    row["Social_Support"] = _score_social_support(p.marital_status, p.number_of_children)
    row["family_personal_health"] = _score_family_personal_health(
        p.sleep_patterns, p.physical_activity_level, p.dietary_habits, p.chronic_medical_conditions
    )
    row["personal_burden"] = _score_personal_burden(
        p.employment_status, p.income, p.alcohol_consumption,
        p.history_of_substance_abuse, p.history_of_mental_illness, p.number_of_children
    )
    return pd.DataFrame([row], columns=FEATURES)

# ---------- API ----------
@router.post("/predict", response_model=SubmissionOut)
def predict(
    payload: PredictUI,
    db = Depends(get_db),
    authorization: Optional[str] = Header(default=None, alias="Authorization")
):
    try:
        # 1) Inference
        X = ui_to_feature_df(payload)
        y = model.predict(X)[0]
        risk = float(y) if isinstance(y, (float, np.floating)) else y

        # 2) Persist to DB
        user_id = extract_user_id(authorization, db)
        rec = Submission(
            user_id=user_id,
            risk_score=risk,
            age=payload.age,
            marital_status=payload.marital_status,
            education_level=payload.education_level,
            number_of_children=payload.number_of_children,
            smoking_status=payload.smoking_status,
            physical_activity_level=payload.physical_activity_level,
            employment_status=payload.employment_status,
            income=float(payload.income),
            alcohol_consumption=payload.alcohol_consumption,
            dietary_habits=payload.dietary_habits,
            sleep_patterns=payload.sleep_patterns,
            history_of_mental_illness=payload.history_of_mental_illness,
            history_of_substance_abuse=payload.history_of_substance_abuse,
            family_history_of_depression=payload.family_history_of_depression,
            chronic_medical_conditions=payload.chronic_medical_conditions,
        )
        db.add(rec)
        db.commit()
        db.refresh(rec)

        # 3) Return a clean object (SubmissionOut)
        return rec

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Inference failed: {e}")

@router.get("/predict/history", response_model=List[SubmissionOut])
def history(
    limit: int = 20,
    db = Depends(get_db),
    authorization: Optional[str] = Header(default=None, alias="Authorization")
):
    """
    Returns latest predictions. If user is logged in, returns only their rows,
    otherwise returns latest across all users.
    """
    q = db.query(Submission).order_by(Submission.created_at.desc()).limit(limit)
    uid = extract_user_id(authorization, db)
    if uid is not None:
        q = q.filter(Submission.user_id == uid)
    rows = q.all()
    return rows
