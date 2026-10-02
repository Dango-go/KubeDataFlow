import logging
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.cloud_validator import ValidationFactory
from app.repository.provider_repository import ProviderRepository

logger = logging.getLogger(__name__)


class provider_usecase:
    def __init__ (self, db_session: AsyncSession, json_data: Dict[str, Any], vault_client: Any = None):
        self.db_session = db_session
        self.data = json_data

        self.user_id: int = int(self.data.get("user_id") or 1)
        self.alias: str = str(self.data.get("alias") or "")
        self.provider_type: str = (self.data.get("provider_type") or "").strip().lower()
        self.credentials: dict = self.data.get("credentials") or {}

    async def add_provider_creds(self) -> Tuple[bool, str]:
        if not self.data or not self.alias or not self.credentials:
            return False, "Invalid payload: missing alias or credentials"
 
        # Check if provider credentials already exist
        try:
            existing_provider = await ProviderRepository.check(
                db = self.db_session,
                user_id = self.user_id,
                alias = self.alias
            )
        except Exception as e:
            logger.error(f"Error checking existing provider in DB: {e}", exc_info=True)
            return False, f"Database check error: {str(e)}"

        # Validation creds in cloud provider
        try:
            validator = await ValidationFactory.validating_creds(
                provider_type = self.provider_type,
                credentials = self.credentials
            )
            if not validator:
                logger.error(f"Cloud provider authentication failed for alias '{self.alias}'")
                return False, "Cloud provider authentication failed. Check key validity."

        except Exception as e:
            logger.error(f"Cloud validation error for '{self.alias}': {e}", exc_info=True)
            return False, f"Cloud validation error: {str(e)}"

        # Save or update in provider database directly
        try:
            if existing_provider:
                existing_provider.provider_type = self.provider_type
                existing_provider.credentials_status = "active"
                existing_provider.credentials = self.credentials
                await self.db_session.commit()
                await self.db_session.refresh(existing_provider)
                return True, "Credentials updated successfully"
            else:
                provider = await ProviderRepository.create_provider_creds(
                    db = self.db_session,
                    user_id = self.user_id,
                    alias = self.alias,
                    provider_type = self.provider_type,
                    credentials_status = "active",
                    credentials = self.credentials
                )

                if not provider:
                    return False, "Failed to save provider metadata in DB"
                return True, "Success"

        except Exception as e:
            logger.error(f"Database insertion error for '{self.alias}': {e}", exc_info=True)
            return False, f"Database error: {str(e)}"

        
    # get provider credentials directly from DB by alias
    async def get_provider_credentials(self) -> Optional[Dict[str, Any]]:
        if not self.alias:
            return None
        
        try:
            provider = await ProviderRepository.check(
                db = self.db_session,
                user_id = self.user_id,
                alias = self.alias
            )
            if provider and provider.credentials:
                return provider.credentials
            return None

        except Exception as e:
            logger.error(f"Error getting credentials for '{self.alias}': {e}")
            return None

 
    # Return list of all providers for a given user_id. (name, status, provider type)
    async def list_providers(self):
        if not self.data:
            return []

        try:
            providers_object = await ProviderRepository.get_all_accounts_by_user(
                db = self.db_session,
                user_id = self.user_id
            )
            return providers_object

        except Exception as e:
            logger.error(f"Error listing providers for user {self.user_id}: {e}")
            return []

    async def delete_provider(self):
        if not self.data:
            return False

        try:
            # Delete from provider database
            deleted = await ProviderRepository.delete_account(
                db = self.db_session,
                user_id = self.user_id,
                alias = self.alias
            )
            return deleted

        except Exception as e:
            logger.error(f"Error deleting provider '{self.alias}': {e}")
            return False