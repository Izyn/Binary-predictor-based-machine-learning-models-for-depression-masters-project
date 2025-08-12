from sqlalchemy import Column, Integer, String
from ..db.session import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)  # allow null for social
    email = Column(String, unique=True, nullable=True)
    google_sub = Column(String, unique=True, nullable=True)
    auth_provider = Column(String, nullable=True)
