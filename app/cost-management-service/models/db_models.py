import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, Integer, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from core.database import Base


class CostRecordDB(Base):
    __tablename__ = "cost_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    instance_id = Column(String, nullable=False, index=True)
    instance_name = Column(String, nullable=False)
    engine_type = Column(String, nullable=False)
    provider = Column(String, nullable=False)
    cluster_name = Column(String, nullable=False)
    namespace = Column(String, nullable=False)
    
    cpu_cores = Column(Float, nullable=False, default=1.0)
    ram_gb = Column(Float, nullable=False, default=2.0)
    storage_gb = Column(Float, nullable=False, default=20.0)
    backup_storage_gb = Column(Float, nullable=False, default=10.0)
    
    hourly_cost = Column(Float, nullable=False)
    daily_cost = Column(Float, nullable=False)
    monthly_cost = Column(Float, nullable=False)

    date = Column(DateTime, default=datetime.utcnow, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class PricingRateDB(Base):
    __tablename__ = "pricing_rates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    provider_name = Column(String, nullable=False, unique=True, index=True) # e.g. aws, gcp, azure, digitalocean, on-premise
    provider_multiplier = Column(Float, nullable=False, default=1.0)
    cpu_hourly_rate = Column(Float, nullable=False)
    ram_gb_hourly_rate = Column(Float, nullable=False)
    storage_gb_hourly_rate = Column(Float, nullable=False)
    backup_gb_hourly_rate = Column(Float, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
