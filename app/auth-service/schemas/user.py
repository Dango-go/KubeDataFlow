from pydantic import BaseModel, EmailStr, ConfigDict
import uuid

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr
    is_active: bool

class Token(BaseModel):
    access_token: str
    token_type: str