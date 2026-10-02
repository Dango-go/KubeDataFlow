import json
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from config import settings

engine = create_async_engine(
    settings.DB_URL,
    json_serializer=lambda obj: json.dumps(obj, default=str)
)

SessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)

class Base(DeclarativeBase):
    pass


async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as db:
        yield db
