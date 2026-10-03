from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.config import settings
from sqlalchemy.orm import declarative_base

engine = create_async_engine(settings.DB_URL)

SessionLocal = async_sessionmaker(expire_on_commit=False, bind=engine, class_=AsyncSession)

Base = declarative_base()

async def db_session() -> AsyncSession:
    async with SessionLocal() as db:
        yield db   
 