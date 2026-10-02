from sqlalchemy import String, Float, DateTime, Text, Integer
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from typing import Optional
import uuid

from core.database import Base


class DatabaseInstanceDB(Base):
    __tablename__ = "provisioning_db"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    engine_type: Mapped[str] = mapped_column(String, nullable=False)  # postgresql, redis, clickhouse, etc.
    version: Mapped[str] = mapped_column(String, nullable=False)
    cluster_id: Mapped[str] = mapped_column(String, nullable=False)
    cluster_name: Mapped[str] = mapped_column(String, nullable=False, default="default-prod")
    namespace: Mapped[str] = mapped_column(String, nullable=False, default="databases")
    
    #Cpu, Ram, Disk In GiB  
    cpu: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    ram: Mapped[float] = mapped_column(Float, nullable=False, default=2.0)   
    disk: Mapped[float] = mapped_column(Float, nullable=False, default=20.0)   
    
    # Status of the database instance 
    status: Mapped[str] = mapped_column(String, nullable=False, default="Running")   
    
    # DB networking info
    host: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    port: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    connection_string: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    # Chart of DB  
    chart_name: Mapped[str] = mapped_column(String, nullable=False)
    values_yaml: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Timestamp
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class DeploymentLogDB(Base):
    __tablename__ = "deployment_logs"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    database_id: Mapped[str] = mapped_column(String(36), nullable=False)
    operation: Mapped[str] = mapped_column(String, nullable=False)  # scale, config, stop, start, delete
    status: Mapped[str] = mapped_column(String, nullable=False)  # Success, Failed, Pending
    details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
