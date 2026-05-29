"""
History and progress tracking endpoints.

Provides user-specific analysis history and progress metrics.
"""

from math import ceil

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.models import get_db, Analysis, User

from backend.routes.auth import get_current_user
from backend.schemas.upload import AnalysisResult

router = APIRouter()


@router.get("/history")
async def get_history(
    page: int = 1,
    limit: int = 20,
    sport: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the authenticated user's analysis history.

    Returns paginated results with optional sport filter.
    """
    query = db.query(Analysis).filter(Analysis.user_id == current_user.id)

    if sport:
        query = query.filter(Analysis.sport_type == sport)

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
        {
            "analysis_id": a.id,
            "sport_type": a.sport_type,
            "status": a.status,
            "video_filename": a.video_filename,
            "overall_score": a.overall_score,
            "metrics": a.metrics,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        }
        for a in analyses
    ]

    return {
        "items": items,
        "total": total,
        "page": page,
        "pages": pages,
    }


@router.get("/history/progress")
async def get_progress(
    sport: str = "volleyball",
    metric: str = "overall_score",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get progress trend data for a specific sport and metric.

    Returns time-series data points and a trend indicator.
    """
    analyses = (
        db.query(Analysis)
        .filter(
            Analysis.user_id == current_user.id,
            Analysis.sport_type == sport,
            Analysis.status == "completed",
            Analysis.metrics.isnot(None),
        )
        .order_by(Analysis.created_at.asc())
        .all()
    )

    data_points = []
    for a in analyses:
        if a.metrics:
            value = a.metrics.get(metric, None) if metric != "overall_score" else a.overall_score
            if value is not None:
                data_points.append({
                    "date": a.created_at.isoformat() if a.created_at else "",
                    "score": value,
                })

    # Simple trend: compare first vs last
    trend = "stable"
    if len(data_points) >= 2:
        first = data_points[0]["score"]
        last = data_points[-1]["score"]
        diff = last - first
        if diff > 5:
            trend = "improving"
        elif diff < -5:
            trend = "declining"

    return {
        "sport": sport,
        "metric": metric,
        "data": data_points,
        "trend": trend,
        "total_analyses": len(data_points),
    }
