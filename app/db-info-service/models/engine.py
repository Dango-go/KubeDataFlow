from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from core.database import Base


class DatabaseEngineEntity(Base):
    __tablename__ = "database_engines"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # Display name e.g., "PostgreSQL"
    engine_type = Column(String, unique=True, index=True, nullable=False)  # System identifier e.g., "postgresql"
    category = Column(String, nullable=False)  # e.g., "Relational SQL", "In-Memory KV"
    icon_url = Column(String, nullable=True)  # URL for frontend logo icon
    description = Column(String, nullable=True)  # Short description for frontend card
    is_active = Column(Boolean, default=True)  # Showcase toggle (Soft hide)

    versions = relationship("DatabaseVersionEntity", back_populates="engine", cascade="all, delete-orphan")
    schemas = relationship("ConfigSchemaEntity", back_populates="engine", cascade="all, delete-orphan")
