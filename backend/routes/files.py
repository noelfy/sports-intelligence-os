"""
Static file serving endpoints.

Provides access to uploaded videos, processed overlay videos, and keypoint JSON files.
"""

import os

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from backend.services.storage_service import StorageService

router = APIRouter()


@router.get("/files/videos/{analysis_id}/{filename}")
async def get_video_file(analysis_id: str, filename: str):
    """Serve a video file (original or overlay) for an analysis."""
    # Determine which directory based on filename
    if filename == "original.mp4":
        file_path = StorageService.get_upload_path(analysis_id, filename)
    else:
        file_path = StorageService.get_video_path(analysis_id, filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Video file not found")

    return FileResponse(
        file_path,
        media_type="video/mp4",
        headers={"Accept-Ranges": "bytes"},
    )


@router.get("/files/keypoints/{analysis_id}/keypoints.json")
async def get_keypoints_file(analysis_id: str):
    """Serve the keypoint JSON data for an analysis."""
    file_path = StorageService.get_keypoints_path(analysis_id)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Keypoints file not found (processing may not be complete)")

    return FileResponse(
        file_path,
        media_type="application/json",
    )
