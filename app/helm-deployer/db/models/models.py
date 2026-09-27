import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, JSON, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID
from core.database import Base


class HelmChartDB(Base):
    __tablename__ = "helm_charts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    provider_name = Column(String, nullable=False)
    cluster_name = Column(String, nullable=False)
    chart_name = Column(String, nullable=False)
    release_name = Column(String, nullable=False)
    release_version = Column(String, nullable=False)
    namespace = Column(String, nullable=False)
    custom_yaml_files = Column(JSON, nullable=True, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
