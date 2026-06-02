"""
Static file serving endpoints.

Provides access to uploaded videos, processed overlay videos, and keypoint JSON files.
"""

import json
import os

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, JSONResponse

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


@router.get("/files/keypoints/{analysis_id}/compact.json")
async def get_compact_keypoints(analysis_id: str):
    """Serve keypoints in a lightweight format optimized for browser overlay rendering.

    Returns only (x, y) coords for detected frames, indexed by frame_index.
    Much smaller than the full keypoints.json (no names, z, visibility per landmark).

    NOTE: Must be defined BEFORE the generic /{filename} route to take priority.
    """
    file_path = StorageService.get_keypoints_path(analysis_id)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Keypoints file not found")

    with open(file_path, encoding="utf-8") as f:
        data = json.load(f)

    # Compact format: {"meta": {...}, "frames": {"0": [[x,y],...], "5": [[x,y],...]}}
    compact_frames = {}
    for frame in data.get("frames", []):
        if frame.get("detected"):
            # Only store x, y (first 2 coords) for each landmark
            pts = [[lm["x"], lm["y"]] for lm in frame["landmarks"]]
            compact_frames[str(frame["frame_index"])] = pts

    return JSONResponse({
        "meta": {
            "width": data["metadata"]["width"],
            "height": data["metadata"]["height"],
            "fps": data["metadata"]["video_fps"],
            "total_frames": data["metadata"]["total_frames"],
        },
        "frames": compact_frames,
    })


@router.get("/files/keypoints/{analysis_id}/{filename}")
async def get_keypoints_file(analysis_id: str, filename: str):
    """Serve a keypoint JSON file (keypoints.json or keypoints_3d.json)."""
    output_dir = os.path.join("data", "output", analysis_id)
    file_path = os.path.join(output_dir, filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"Keypoints file '{filename}' not found")

    return FileResponse(
        file_path,
        media_type="application/json",
    )
