from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class SubmissionOut(BaseModel):
    id: int
    created_at: datetime
    risk_score: float

    # echo the key fields (add more if you want)
    age: int
    marital_status: str
    education_level: str
    number_of_children: int
    employment_status: str
    income: float

    class Config:
        from_attributes = True  # pydantic v2 equivalent of orm_mode
