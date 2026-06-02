"""
Database models and SQLAlchemy setup.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Column, String, Float, DateTime, ForeignKey, JSON,
    Boolean, Text, Integer, create_engine,
)
from sqlalchemy.orm import DeclarativeBase, relationship, sessionmaker

from backend.config import settings


class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass


class User(Base):
    """User account for history and progress tracking."""

    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    analyses = relationship("Analysis", back_populates="user", cascade="all, delete-orphan")


class Analysis(Base):
    """A single video analysis session."""

    __tablename__ = "analyses"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    sport_type = Column(String(50), default="volleyball", nullable=False)
    status = Column(String(20), default="processing", nullable=False)
    # processing | completed | failed

    # Capture mode: "single_camera" (default) or "multi_camera"
    capture_mode = Column(String(20), default="single_camera", nullable=False)
    calibration_session_id = Column(String(36), nullable=True)
    camera_count = Column(Integer, nullable=True)
    is_3d = Column(Boolean, default=False)

    # Video info
    video_filename = Column(String(500), nullable=False)
    video_duration_ms = Column(Float, nullable=True)
    total_frames = Column(Integer, nullable=True)
    frames_with_pose = Column(Integer, nullable=True)

    # Analysis results
    overall_score = Column(Float, nullable=True)
    metrics = Column(JSON, nullable=True)
    # {balance, posture, timing, efficiency, coordination}
    feedback = Column(JSON, nullable=True)
    # AI-generated feedback JSON
    joint_analysis = Column(JSON, nullable=True)

    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="analyses")
    keypoint_frames = relationship(
        "KeypointFrame", back_populates="analysis", cascade="all, delete-orphan"
    )


class KeypointFrame(Base):
    """Per-frame keypoint data for detailed replay."""

    __tablename__ = "keypoint_frames"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    analysis_id = Column(
        String(36), ForeignKey("analyses.id"), nullable=False, index=True
    )
    frame_index = Column(Integer, nullable=False)
    timestamp_ms = Column(Float, nullable=False)
    detected = Column(Boolean, default=False)
    landmarks = Column(JSON, nullable=True)  # Array of 33 landmark dicts
    angles = Column(JSON, nullable=True)  # Computed joint angles

    analysis = relationship("Analysis", back_populates="keypoint_frames")


class CalibrationSession(Base):
    """Multi-camera calibration session — stores calibration parameters."""

    __tablename__ = "calibration_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    name = Column(String(200), nullable=True)
    camera_count = Column(Integer, nullable=False)
    status = Column(String(20), default="collecting", nullable=False)
    # collecting | calibrating | completed | failed
    reprojection_error = Column(Float, nullable=True)
    calibration_data = Column(JSON, nullable=True)  # intrinsics + extrinsics
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


# --- Database Engine and Session ---

_engine = None
_SessionLocal = None


def get_engine():
    """Get or create the SQLAlchemy engine."""
    global _engine
    if _engine is None:
        connect_args = {}
        if "sqlite" in settings.DATABASE_URL:
            connect_args["check_same_thread"] = False
        _engine = create_engine(
            settings.DATABASE_URL,
            echo=settings.DEBUG,
            connect_args=connect_args,
        )
    return _engine


def get_session():
    """Get a new database session."""
    global _SessionLocal
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=get_engine())
    return _SessionLocal()


def init_db():
    """Create all database tables."""
    Base.metadata.create_all(bind=get_engine())


def get_db():
    """Dependency injection: yield a database session."""
    db = get_session()
    try:
        yield db
    finally:
        db.close()
