**Azure**
{
  "grant_type": "client_credentials",
  "client_id": "<client_id>",
  "client_secret": "<secret_key>",
  "scope": "https://management.azure.com/.default"
}

**GCP**
{
  "type": "service_account",
  "project_id": "my-awesome-project-123",
  "private_key_id": "123456789abcdef...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC3...\n-----END PRIVATE KEY-----\n",
  "client_email": "my-service-account@my-awesome-project-123.iam.gserviceaccount.com",
  "client_id": "112233445566778899001",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}

