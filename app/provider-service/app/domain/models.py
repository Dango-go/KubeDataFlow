from dataclasses import dataclass
from app.core.db import Base
from sqlalchemy import Column, Integer, String, JSON



class Provider_DB(Base):
    __tablename__ = "provider_db"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, primary_key=False) # Not unique in table, but unique for every user in platform
    alias = Column(String, nullable=False)
    provider_type = Column(String, nullable=False)
    credentials_status = Column(String, nullable=False)
    credentials = Column(JSON, nullable=True)

    
