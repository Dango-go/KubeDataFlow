from sqlalchemy import Column, Integer, JSON, ForeignKey
from sqlalchemy.orm import relationship
from core.database import Base


class ConfigSchemaEntity(Base):
    __tablename__ = "schema"

    id = Column(Integer, primary_key=True, index=True)
    engine_id = Column(Integer, ForeignKey("database_engines.id"), nullable=False)
    json_schema = Column(JSON, nullable=False)  # Draft-7 JSON Schema for frontend form rendering

    engine = relationship("DatabaseEngineEntity", back_populates="schemas")
