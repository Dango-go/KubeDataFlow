import logging
from kubernetes_asyncio import client
from typing import Optional
import os
import base64
import tempfile

logger = logging.getLogger(__name__)


class K8sClientFactory:

    @staticmethod
    def create_client(
        api_server_url: str, 
        auth_token: str,
        verify_ssl: bool = False,
        ssl_ca_cert: Optional[str] = None,
    ) -> client.ApiClient:
        clean_token = (auth_token or "").strip()
        if clean_token.lower().startswith("bearer "):
            clean_token = clean_token[7:].strip()

        configuration = client.Configuration()
        configuration.host = api_server_url.rstrip("/")
        # In kubernetes_asyncio, Configuration.auth_settings() specifically checks 'BearerToken'
        configuration.api_key = {
            "BearerToken": clean_token,
            "authorization": clean_token,
        }
        configuration.api_key_prefix = {
            "BearerToken": "Bearer",
            "authorization": "Bearer",
        }
        configuration.verify_ssl = verify_ssl
        if ssl_ca_cert and verify_ssl:
            if os.path.exists(ssl_ca_cert):
                configuration.ssl_ca_cert = ssl_ca_cert
            else:
                try:
                    ca_data = ssl_ca_cert
                    if not ca_data.startswith("-----BEGIN"):
                        try:
                            ca_data = base64.b64decode(ssl_ca_cert).decode("utf-8")
                        except Exception as e:
                            logger.error(f"Invalid base64 CA cert: {e}")
                            raise ValueError("Invalid base64 CA cert")
                    
                    # Create, write and close the file
                    tmp_ca = tempfile.NamedTemporaryFile(delete=False, mode="w", suffix=".crt")
                    tmp_ca.write(ca_data)
                    tmp_ca.flush()

                    configuration.ssl_ca_cert = tmp_ca.name
                except Exception as e:
                    logger.warning("Failed to parse ca_cert data into temp file: %s", e)
                    configuration.verify_ssl = False
                        
        return client.ApiClient(configuration=configuration)