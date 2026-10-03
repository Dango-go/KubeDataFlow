import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
from core.database import Base


class ClusterEntity(Base):
    __tablename__ = "discovery_db"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Integer, nullable=False, index=True)
    provider_type = Column(String, nullable=False)
    provider_alias = Column(String, nullable=False)
    cluster_name = Column(String, nullable=False)
    region = Column(String, nullable=False)
    k8s_version = Column(String, nullable=True)
    status = Column(String, nullable=False, default="active")
    endpoint = Column(String, nullable=True)
    ca_cert = Column(String, nullable=True)
    token = Column(String, nullable=True)
    raw_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
