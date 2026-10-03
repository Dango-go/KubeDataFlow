from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from core.config import settings

engine = create_async_engine(settings.SQLALCHEMY_DATABASE_URI, echo=True, future=True)
# Create AsyncSession objects
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# def to create a new session for each request
async def get_db():
    async with AsyncSessionLocal() as session: # create a new session named session
        yield session  # Router 