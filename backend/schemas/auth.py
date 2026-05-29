"""Pydantic schemas for authentication."""

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    """Registration request."""
    email: EmailStr
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=8, max_length=128)


class UserLogin(BaseModel):
    """Login request."""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """JWT token response."""
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserProfile(BaseModel):
    """Public user profile."""
    id: str
    email: str
    username: str
    created_at: str
