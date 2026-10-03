from app.domain.models import Provider_DB
from sqlalchemy.future import select
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

class ProviderRepository:
    def __init__(self, db_session: AsyncSession):
        self.db = db_session


    @staticmethod
    async def create_provider_creds(
        db: AsyncSession, 
        user_id: int, 
        alias: str, 
        provider_type: str,
        credentials_status: str,
        credentials: Optional[dict] = None
    ):
        """Create provider credentials."""
        db_item = Provider_DB(
            user_id=user_id,
            alias=alias,
            provider_type=provider_type,
            credentials_status=credentials_status,
            credentials=credentials
        )

        db.add(db_item)
        await db.commit()
        await db.refresh(db_item)

        return db_item

    @staticmethod
    async def check(db: AsyncSession, user_id: int, alias: str) -> Optional[Provider_DB]:
        """Check if provider credentials exist."""
        result = await db.execute(
            select(Provider_DB).where(
                Provider_DB.user_id == user_id,
                Provider_DB.alias == alias
            )
        )
        # scalars() - delete the system info (row). first() - return first object in list of rows.
        return result.scalars().first()
 

    @staticmethod
    async def get_all_accounts_by_user(db: AsyncSession, user_id: int):
        """
        Return all cloud accounts for a given user_id.
        """
        result = await db.execute(
            select(Provider_DB).filter(Provider_DB.user_id == user_id)
        )
        return result.scalars().all()

    @staticmethod
    async def delete_account(db: AsyncSession, user_id: int, alias: str):
        """
        Delete a cloud account for a given user_id and alias.
        """
        result = await ProviderRepository.check(db, user_id, alias)
        if not result:
            return False
        
        await db.delete(result)
        await db.commit()
        return True


    