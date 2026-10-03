from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=False, future=True)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()

async def db_session():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception as e:
            session.rollback()
            raise e
        else:
            session.commit()
        finally:
            await session.close()       
            
