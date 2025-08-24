from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from ..db.session import Base

class Submission(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    # Optional link to users.id (won't error if you don't use it)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Form fields (store as text/number exactly as sent)
    age = Column(Integer, nullable=False)
    marital_status = Column(String, nullable=False)
    education_level = Column(String, nullable=False)
    number_of_children = Column(Integer, nullable=False)
    smoking_status = Column(String, nullable=False)
    physical_activity_level = Column(String, nullable=False)
    employment_status = Column(String, nullable=False)
    income = Column(Float, nullable=False)
    alcohol_consumption = Column(String, nullable=False)
    dietary_habits = Column(String, nullable=False)
    sleep_patterns = Column(String, nullable=False)
    history_of_mental_illness = Column(String, nullable=False)
    history_of_substance_abuse = Column(String, nullable=False)
    family_history_of_depression = Column(String, nullable=False)
    chronic_medical_conditions = Column(String, nullable=False)

    # Model output
    risk_score = Column(Float, nullable=False)

    # If you have a User model, you can uncomment this:
    # user = relationship("User", backref="predictions")
