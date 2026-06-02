"""Pydantic schemas for camera calibration."""

from datetime import datetime

from pydantic import BaseModel, Field


class CalibrationSessionCreate(BaseModel):
    """Request to create a new calibration session."""
    camera_count: int = Field(ge=2, le=8, description="Number of cameras to calibrate")
    name: str | None = None


class CalibrationFrameResult(BaseModel):
    """Result after processing a single calibration frame."""
    success: bool
    detected: bool = False
    corner_count: int = 0
    marker_count: int = 0
    message: str = ""
    camera_index: int
    frame_index: int = 0


class CameraParams(BaseModel):
    """Intrinsic + extrinsic parameters for one camera."""
    camera_index: int
    intrinsic_matrix: list[list[float]]
    distortion_coeffs: list[float]
    calibration_success: bool = True


class ExtrinsicParams(BaseModel):
    """Extrinsic pose of one camera relative to origin."""
    camera_index: int
    rotation: list[list[float]]  # 3x3 rotation matrix
    translation: list[float]     # 3x1 translation vector (mm)


class CalibrationResult(BaseModel):
    """Complete calibration result for a session."""
    session_id: str
    success: bool = True
    error: str | None = None
    camera_count: int | None = None
    image_size: list[int] | None = None
    cameras: list[CameraParams] | None = None
    extrinsics: list[ExtrinsicParams] | None = None
    reprojection_error_px: float | None = None
    quality: str | None = None  # excellent | good | acceptable | needs_improvement
    computed_at: str | None = None


class CalibrationSessionSummary(BaseModel):
    """Summary of a calibration session for list views."""
    session_id: str
    name: str
    camera_count: int
    status: str  # collecting | completed | failed
    reprojection_error: float | None = None
    frame_counts: list[int] | None = None
    created_at: str


class CalibrationSessionList(BaseModel):
    """List of calibration sessions."""
    sessions: list[CalibrationSessionSummary]
