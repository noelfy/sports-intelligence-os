"""
Video upload endpoint.

Accepts multipart video upload, saves to disk, creates DB record,
and triggers background processing.
"""

import uuid
import os
from datetime import datetime, timezone

from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Depends
from sqlalchemy.orm import Session

from database.models import get_db, Analysis

from backend.config import settings
from backend.schemas.upload import UploadResponse
from backend.services.storage_service import StorageService
from backend.services.pose_service import PoseService
from backend.services.analysis_service import AnalysisService
from backend.services.feedback_service import FeedbackService

router = APIRouter()

pose_service = PoseService()
analysis_service = AnalysisService()
feedback_service = FeedbackService()


def _validate_video(file: UploadFile) -> None:
    """Validate video file extension and size."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in settings.ALLOWED_VIDEO_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{ext}'. Allowed: {', '.join(settings.ALLOWED_VIDEO_EXTENSIONS)}",
        )


async def _process_video_background(analysis_id: str, file_bytes: bytes, filename: str):
    """Background task: save file, run pose estimation, analysis, and feedback."""
    db = next(get_db())
    analysis = None
    try:
        # Save uploaded file
        StorageService.save_upload(analysis_id, file_bytes, filename)

        # Get analysis record
        analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
        if analysis:
            analysis.status = "processing"
            db.commit()

        # Step 1: Pose estimation
        pose_result = await pose_service.process_video(analysis_id)

        # Update with pose metadata
        if analysis:
            analysis.total_frames = pose_result.get("metadata", {}).get("total_frames")
            analysis.video_duration_ms = pose_result.get("metadata", {}).get("video_duration_ms")

        # Step 2: Movement analysis
        analysis_result = await analysis_service.analyze(analysis_id)

        if analysis:
            analysis.overall_score = analysis_result.get("overall_score")
            analysis.metrics = analysis_result.get("metrics")
            analysis.joint_analysis = analysis_result.get("joint_angles_keyframe")
            analysis.frames_with_pose = analysis_result.get("total_frames_analyzed")

        # Step 3: AI feedback generation
        feedback_result = await feedback_service.generate(analysis_id)

        if analysis:
            analysis.feedback = feedback_result
            analysis.status = "completed"
            analysis.completed_at = datetime.now(timezone.utc)

        db.commit()

    except Exception as e:
        # Update DB with error
        if analysis:
            analysis.status = "failed"
            analysis.error_message = str(e)
            db.commit()
    finally:
        db.close()


@router.post("/upload", response_model=UploadResponse)
async def upload_video(
    video: UploadFile = File(...),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
):
    """Upload a sports video for movement analysis.

    Accepts mp4/mov files up to 500MB. Returns immediately with an analysis_id.
    Processing happens in the background — poll GET /api/results/{id} for status.
    """
    _validate_video(video)

    analysis_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc)

    # Read file content
    file_bytes = await video.read()

    # Validate size
    size_mb = len(file_bytes) / (1024 * 1024)
    if size_mb > settings.MAX_UPLOAD_SIZE_MB:
        raise HTTPException(
            status_code=400,
            detail=f"File too large ({size_mb:.1f}MB). Max: {settings.MAX_UPLOAD_SIZE_MB}MB",
        )

    # Create DB record
    analysis = Analysis(
        id=analysis_id,
        video_filename=video.filename,
        status="pending",
        created_at=created_at,
    )
    db.add(analysis)
    db.commit()

    # Trigger background processing
    background_tasks.add_task(
        _process_video_background, analysis_id, file_bytes, video.filename
    )

    return UploadResponse(
        analysis_id=analysis_id,
        status="pending",
        message="Video uploaded. Analysis is being processed.",
        created_at=created_at,
    )
