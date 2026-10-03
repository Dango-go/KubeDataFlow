import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, JSON, Boolean
from sqlalchemy.dialects.postgresql import UUID
from core.database import Base


class ManifestsAndCRDs(Base):
    __tablename__ = "manifests_and_crds"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    manifests = Column(JSON, nullable=False)
    crds = Column(JSON, nullable=False)
    api_server_url = Column(String, nullable=False) 
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
