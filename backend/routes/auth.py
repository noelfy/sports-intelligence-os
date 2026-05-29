"""
Authentication endpoints.

Handles user registration, login, and profile retrieval.
"""

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from database.models import get_db, User

from backend.schemas.auth import UserCreate, UserLogin, TokenResponse, UserProfile
from backend.services.auth_service import AuthService

router = APIRouter()
security = HTTPBearer()


def _user_to_dict(user: User) -> dict:
    """Convert a User ORM object to a dict for API responses."""
    return {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "created_at": user.created_at.isoformat() if user.created_at else "",
    }


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """Dependency: get the authenticated user from JWT token."""
    user_id = AuthService.decode_token(credentials.credentials)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return user


@router.post("/register", response_model=TokenResponse)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user account."""
    # Check uniqueness
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    existing_username = db.query(User).filter(User.username == user_data.username).first()
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")

    # Create user
    user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=AuthService.hash_password(user_data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Generate token
    token = AuthService.create_access_token(user.id)

    return TokenResponse(
        access_token=token,
        user=_user_to_dict(user),
    )


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Login with email and password."""
    user = db.query(User).filter(User.email == credentials.email).first()
    if user is None or not AuthService.verify_password(
        credentials.password, user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = AuthService.create_access_token(user.id)

    return TokenResponse(
        access_token=token,
        user=_user_to_dict(user),
    )


@router.get("/me", response_model=UserProfile)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get the current authenticated user's profile."""
    return UserProfile(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        created_at=current_user.created_at.isoformat() if current_user.created_at else "",
    )
