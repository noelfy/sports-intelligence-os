"""Pydantic schemas for upload and analysis results."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class UploadResponse(BaseModel):
    """Response returned immediately after video upload."""
    analysis_id: str
    status: str = "processing"
    message: str
    created_at: datetime


class FeedbackResult(BaseModel):
    """Structured AI feedback."""
    overall_score: float
    summary: str
    metrics: dict[str, float]
    strengths: list[str]
    improvements: list[str]
    detailed_feedback: str


class AnalysisResult(BaseModel):
    """Complete analysis result after processing."""
    analysis_id: str
    status: str
    video_url: str
    overlay_url: str
    keypoints_url: str
    metadata: dict[str, Any]
    feedback: dict[str, Any] | None = None
    created_at: datetime | None = None
    completed_at: datetime | None = None


class AnalysisSummary(BaseModel):
    """Summary of an analysis for list views."""
    analysis_id: str
    sport_type: str
    status: str
    video_filename: str
    overall_score: float | None = None
    created_at: datetime | None = None


class PaginatedResults(BaseModel):
    """Paginated list of analysis summaries."""
    items: list[AnalysisSummary]
    total: int
    page: int
    pages: int
