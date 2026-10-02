import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, JSON, Boolean
from sqlalchemy.dialects.postgresql import UUID
from core.database import Base


class ClusterDB(Base):
    __tablename__ = "clusters"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    provider_name = Column(String, nullable=False)
    cluster_name = Column(String, nullable=False)
    api_server_url = Column(String, nullable=False)  # The URL from cloud cluster or yourself cluster
    token = Column(String, nullable=True)  # The token from cloud cluster or yourself cluster
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
