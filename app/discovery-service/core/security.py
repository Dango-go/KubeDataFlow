from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

# HTTPAuthorizationCredentials - credentials.scheme (BEARER), credentials.credentials (token)
# HTTPAuthorizationCredentials - class. Return object with 2 fields

async def verify_jwt(credentials: HTTPAuthorizationCredentials = Security(security)) -> str:
    token = credentials.credentials
    if not token:
        raise HTTPException(status_code=401, detail="Invalid token")
    return token
