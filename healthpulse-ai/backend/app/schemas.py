from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import List, Optional, Dict, Any

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    username: Optional[str] = None

class ReportResponse(BaseModel):
    id: int
    user_id: int
    filename: str
    uploaded_at: datetime
    summary: Optional[str] = None  # Will hold JSON serialized summary string

    class Config:
        from_attributes = True

class ChatMessageCreate(BaseModel):
    message: str

class ChatMessageResponse(BaseModel):
    id: int
    user_id: int
    report_id: int
    sender: str
    message: str
    timestamp: datetime

    class Config:
        from_attributes = True

class ChatQueryRequest(BaseModel):
    message: str
    provider: str  # "ollama", "openai", "gemini", "claude"
    model: str
    api_key: Optional[str] = None
    language: Optional[str] = "English"

class ReportCompareRequest(BaseModel):
    report_ids: List[int]
    provider: str
    model: str
    api_key: Optional[str] = None
    language: Optional[str] = "English"

class SettingsRequest(BaseModel):
    provider: str
    model: str
    api_key: Optional[str] = None

class SettingsResponse(BaseModel):
    status: str
    message: str
