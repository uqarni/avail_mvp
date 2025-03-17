from pydantic import BaseModel
from sqlalchemy import Column, DateTime, Integer, String, func
from app.clients.db.postgres_client import Base


class SampleModels(Base):
    __tablename__ = "samples"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class ChatRequest(BaseModel):
    message: str
