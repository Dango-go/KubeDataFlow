from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from core.database import Base


class DatabaseVersionEntity(Base):
    __tablename__ = "database_versions"

    id = Column(Integer, primary_key=True, index=True)
    engine_id = Column(Integer, ForeignKey("database_engines.id"), nullable=False) # match with selectinload(DatabaseEngineEntity.versions)
    version = Column(String, nullable=False)  # e.g., "16", "15"
    helm_repo_url = Column(String, nullable=False)  # e.g., "https://charts.bitnami.com/bitnami"
    chart_name = Column(String, nullable=False)  # e.g., "postgresql"
    chart_version = Column(String, nullable=False)  # e.g., "13.1.5"
    is_default = Column(Boolean, default=False)
    is_deprecated = Column(Boolean, default=False)

    engine = relationship("DatabaseEngineEntity", back_populates="versions")
