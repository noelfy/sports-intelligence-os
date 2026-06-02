"""
Camera calibration routes.

Endpoints for multi-camera calibration using ChArUco boards.
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form

from backend.schemas.calibration import (
    CalibrationSessionCreate,
    CalibrationSessionSummary,
    CalibrationSessionList,
    CalibrationFrameResult,
    CalibrationResult,
    CameraParams,
    ExtrinsicParams,
)

router = APIRouter()
_calibration_service = None


def _get_calibration_service():
    global _calibration_service
    if _calibration_service is None:
        from backend.services.calibration_service import CalibrationService
        _calibration_service = CalibrationService()
    return _calibration_service


@router.post("/calibration/sessions", response_model=CalibrationSessionSummary)
async def create_calibration_session(body: CalibrationSessionCreate):
    """Create a new calibration session for multi-camera setup."""
    result = await _get_calibration_service().create_session(
        camera_count=body.camera_count,
        name=body.name,
    )
    return result


@router.post("/calibration/sessions/{session_id}/frames",
             response_model=CalibrationFrameResult)
async def upload_calibration_frame(
    session_id: str,
    image: UploadFile = File(...),
    camera_index: int = Form(...),
):
    """Upload one calibration frame from one camera.

    The image should show the ChArUco board clearly from the camera's
    perspective. Upload frames from ALL cameras showing the SAME board
    position to enable extrinsic calibration.
    """
    # Validate session exists
    session = await _get_calibration_service().get_session(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Calibration session not found")

    if camera_index < 0 or camera_index >= session["camera_count"]:
        raise HTTPException(
            status_code=400,
            detail=f"Camera index {camera_index} out of range "
                   f"(0-{session['camera_count'] - 1})",
        )

    image_bytes = await image.read()
    if len(image_bytes) > 10 * 1024 * 1024:  # 10MB max
        raise HTTPException(status_code=400, detail="Image too large (max 10MB)")

    result = await _get_calibration_service().process_frame(
        session_id, camera_index, image_bytes
    )
    return result


@router.post("/calibration/sessions/{session_id}/compute",
             response_model=CalibrationResult)
async def compute_calibration(session_id: str):
    """Run calibration computation on collected frames.

    Computes per-camera intrinsics and extrinsics. Requires at least
    5 frames per camera with the ChArUco board detected.
    """
    session = await _get_calibration_service().get_session(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Calibration session not found")

    result = await _get_calibration_service().compute_calibration(session_id)
    return result


@router.get("/calibration/sessions/{session_id}",
            response_model=CalibrationResult)
async def get_calibration(session_id: str):
    """Get calibration results for a session."""
    session = await _get_calibration_service().get_session(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Calibration session not found")

    # Check if calibration has been computed
    import os, json
    calib_path = os.path.join("data", "calibration", session_id, "calibration.json")
    if os.path.exists(calib_path):
        with open(calib_path, encoding="utf-8") as f:
            data = json.load(f)
        return {"success": True, **data}

    return {
        "success": True,
        "session_id": session_id,
        "camera_count": session["camera_count"],
    }


@router.get("/calibration/sessions", response_model=CalibrationSessionList)
async def list_calibration_sessions():
    """List all calibration sessions."""
    sessions = await _get_calibration_service().list_sessions()
    return {"sessions": sessions}
