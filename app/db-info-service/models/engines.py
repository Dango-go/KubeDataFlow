from sqlalchemy import Column, Integer, String, Boolean
from core.database import Base


class DatabaseEngineEntity(Base):
    __tablename__ = "database_engines"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False) # db name
    engine_type = Column(String, unique=True, index=True, nullable=False) 
    category = Column(String, nullable=False)
    icon_url = Column(String, nullable=True)
    description = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
