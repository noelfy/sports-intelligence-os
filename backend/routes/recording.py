"""
Multi-camera recording routes.

Endpoints for discovering cameras, starting/stopping recordings,
and checking status.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.services.recording_service import RecordingService

router = APIRouter()
recording_service = RecordingService()


class StartRecordingRequest(BaseModel):
    camera_ids: list[int] = Field(..., min_length=1, max_length=8)
    exercise_id: str = "general"
    calibration_session_id: str | None = None
    fps: int = 30
    width: int = 1280
    height: int = 720


@router.get("/recording/cameras")
async def discover_cameras():
    """Detect available USB cameras connected to this machine."""
    return await recording_service.discover_cameras()


@router.post("/recording/start")
async def start_recording(body: StartRecordingRequest):
    """Start synchronized multi-camera recording.

    Returns immediately with an analysis_id. Recording runs in background
    threads. Call POST /recording/{id}/stop to end recording.
    """
    if len(body.camera_ids) < 1:
        raise HTTPException(status_code=400, detail="At least 1 camera required")

    result = await recording_service.start_recording(
        camera_ids=body.camera_ids,
        exercise_id=body.exercise_id,
        calibration_session_id=body.calibration_session_id,
        fps=body.fps,
        width=body.width,
        height=body.height,
    )

    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Unknown error"))

    return result


@router.post("/recording/{analysis_id}/stop")
async def stop_recording(analysis_id: str):
    """Stop an active multi-camera recording.

    Stops all camera threads, finalizes video files, and returns
    recording metadata including video paths.
    """
    result = await recording_service.stop_recording(analysis_id)
    if not result.get("success"):
        raise HTTPException(status_code=404, detail=result.get("error", "Recording not found"))
    return result


@router.get("/recording/{analysis_id}/status")
async def get_recording_status(analysis_id: str):
    """Check the status of a recording session."""
    return await recording_service.get_status(analysis_id)
