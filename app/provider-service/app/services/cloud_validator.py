import logging
from app.api.v1.schemas import ProviderRequest
import aioboto3
from abc import ABC, abstractmethod
from botocore.exceptions import ClientError, NoCredentialsError
from google.oauth2 import service_account
from google.auth.exceptions import GoogleAuthError
from google.auth.transport.requests import Request
import httpx
 

logger = logging.getLogger(__name__)


class CloudValidator(ABC):
    @abstractmethod
    async def validate(self, credentials: dict) -> bool:
        pass

# Health check for each cloud provider client credentials  

class AWSValidator(CloudValidator):
    async def validate(self, credentials: dict) -> bool:
        access_key = credentials.get("aws_access_key_id")
        secret_key = credentials.get("aws_secret_access_key")
        region = credentials.get("aws_region") or "us-east-1"

        session = aioboto3.Session(
            aws_access_key_id = access_key,
            aws_secret_access_key = secret_key,
            region_name = region
        )

        try:
            async with session.client("sts") as sts_client:
                await sts_client.get_caller_identity()
                return True
        except (ClientError, NoCredentialsError) as e:
            logger.error(f"AWS validation failed: {e}")
            return False

        return True

class GCPValidator(CloudValidator):
    async def validate(self, credentials: dict) -> bool:

        try:
            final_creds = service_account.Credentials.from_service_account_info(
                credentials, 
                scopes=["https://www.googleapis.com/auth/cloud-platform"]
            )

            final_creds.refresh(Request())

            return True

        except (GoogleAuthError, ValueError, Exception) as e:
            logger.error(f"GCP validation failed: {e}")
            return False



class AzureValidator(CloudValidator):
    async def validate(self, credentials: dict) -> bool:
        tenant_id = credentials.get("tenant_id") # 
        client_id = credentials.get("client_id")
        client_secret = credentials.get("client_secret")
        subscription_id = credentials.get("subscription_id")

        if not all([tenant_id, client_id, client_secret, subscription_id]):
            logger.error("Azure validation failed: missing credentials fields")
            return False

        token_url = f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token"

        payload = {
        "grant_type": "client_credentials",
        "client_id": client_id,
        "client_secret": client_secret,
        "scope": "https://management.azure.com/.default"
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url=token_url, data=payload, timeout=10.0)
                if response.status_code == 200:
                    return True
                logger.error(f"Azure token endpoint returned {response.status_code}: {response.text}")
                return False

        except httpx.RequestError as e:
            logger.error(f"Azure HTTP request failed: {e}")
            return False
                

class DOValidator(CloudValidator):
    async def validate(self, credentials: dict) -> bool:
        pat_token = credentials.get("token")

        if not pat_token:
            logger.error("DigitalOcean validation failed: missing token")
            return False

        url = "https://api.digitalocean.com/v2/account"

        headers = {
            "Authorization": f"Bearer {pat_token}"
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url=url, headers=headers, timeout=10.0)
                if response.status_code == 200:
                    return True
                logger.error(f"DO API returned {response.status_code}: {response.text}")
                return False

        except httpx.RequestError as e:
            logger.error(f"DO HTTP request failed: {e}")
            return False


class ValidationFactory:
    validators = {
        "aws": AWSValidator(),
        "gcp": GCPValidator(),
        "azure": AzureValidator(),
        "do": DOValidator(),
    }

    @classmethod
    async def validating_creds(cls, provider_type: str, credentials: dict) -> bool:
        clean_provider = (provider_type or "").strip().lower()
        validator = cls.validators.get(clean_provider)
        if not validator:
            logger.error(f"Unsupported provider type: '{provider_type}'")
            raise ValueError(f"Unsupported provider type: {provider_type}")
        return await validator.validate(credentials)



