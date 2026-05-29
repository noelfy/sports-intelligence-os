"""
Authentication service — password hashing and JWT token management.
"""

from datetime import datetime, timedelta, timezone

from jose import jwt, JWTError
from passlib.context import CryptContext

from backend.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    """Handles password hashing and JWT token operations."""

    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a plaintext password with bcrypt."""
        return pwd_context.hash(password)

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a plaintext password against a bcrypt hash."""
        return pwd_context.verify(plain_password, hashed_password)

    @staticmethod
    def create_access_token(user_id: str) -> str:
        """Create a JWT access token for the given user ID.

        Args:
            user_id: UUID string of the user.

        Returns:
            Encoded JWT string.
        """
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
        to_encode = {
            "sub": user_id,
            "exp": expire,
        }
        return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    @staticmethod
    def decode_token(token: str) -> str | None:
        """Decode a JWT token and return the user ID.

        Args:
            token: JWT string.

        Returns:
            User ID string if valid, None if invalid or expired.
        """
        try:
            payload = jwt.decode(
                token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
            )
            return payload.get("sub")
        except JWTError:
            return None
