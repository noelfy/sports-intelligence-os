"""
Analysis result endpoints.

Retrieve individual results and paginated result lists.
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from math import ceil

from database.models import get_db, Analysis

from backend.config import settings
from backend.schemas.upload import AnalysisResult, AnalysisSummary, PaginatedResults

router = APIRouter()


def _build_result(analysis: Analysis) -> AnalysisResult:
    """Build a full AnalysisResult from a DB record."""
    return AnalysisResult(
        analysis_id=analysis.id,
        status=analysis.status,
        video_url=f"/api/files/videos/{analysis.id}/original.mp4",
        overlay_url=f"/api/files/videos/{analysis.id}/overlay.mp4",
        keypoints_url=f"/api/files/keypoints/{analysis.id}/keypoints.json",
        metadata={
            "video_filename": analysis.video_filename,
            "total_frames": analysis.total_frames,
            "frames_with_pose": analysis.frames_with_pose,
            "video_duration_ms": analysis.video_duration_ms,
        },
        feedback=analysis.feedback,
        created_at=analysis.created_at,
        completed_at=analysis.completed_at,
    )


@router.get("/results/{analysis_id}", response_model=AnalysisResult)
async def get_result(analysis_id: str, db: Session = Depends(get_db)):
    """Get the full analysis result for a specific analysis ID."""
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if analysis is None:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return _build_result(analysis)


@router.get("/results", response_model=PaginatedResults)
async def list_results(
    page: int = 1,
    limit: int = 20,
    status: str | None = None,
    db: Session = Depends(get_db),
):
    """List all analysis results (paginated).

    Query params:
        page: Page number (default 1).
        limit: Items per page (default 20).
        status: Filter by status (processing, completed, failed).
    """
    query = db.query(Analysis)

    if status:
        query = query.filter(Analysis.status == status)

    total = query.count()
    pages = max(1, ceil(total / limit))
    offset = (page - 1) * limit

    analyses = (
        query.order_by(Analysis.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    items = [
        AnalysisSummary(
            analysis_id=a.id,
            sport_type=a.sport_type,
            status=a.status,
            video_filename=a.video_filename,
            overall_score=a.overall_score,
            created_at=a.created_at,
        )
        for a in analyses
    ]

    return PaginatedResults(
        items=items,
        total=total,
        page=page,
        pages=pages,
    )
