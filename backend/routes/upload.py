"""
Video upload endpoint.

Accepts multipart video upload, saves to disk, creates DB record,
and triggers background processing.
"""

import uuid
import os
from datetime import datetime, timezone

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks, Depends
from sqlalchemy.orm import Session

from database.models import get_db, Analysis

from backend.config import settings
from backend.schemas.upload import UploadResponse, MultiUploadResponse
from backend.services.storage_service import StorageService

router = APIRouter()

# Lazy-initialized services (heavy deps: MediaPipe, OpenCV, NumPy, SciPy, OpenAI)
_pose_service = None
_analysis_service = None
_feedback_service = None


def _get_pose_service():
    global _pose_service
    if _pose_service is None:
        from backend.services.pose_service import PoseService
        _pose_service = PoseService()
    return _pose_service


def _get_analysis_service():
    global _analysis_service
    if _analysis_service is None:
        from backend.services.analysis_service import AnalysisService
        _analysis_service = AnalysisService()
    return _analysis_service


def _get_feedback_service():
    global _feedback_service
    if _feedback_service is None:
        from backend.services.feedback_service import FeedbackService
        _feedback_service = FeedbackService()
    return _feedback_service


def _check_video_available():
    """Return (available: bool, error_message: str)."""
    try:
        _get_pose_service()
        return True, ""
    except ImportError as e:
        return False, f"Video processing unavailable on this server. Missing: {e}. Run locally for full functionality."


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


def _create_3d_keypoints_from_single_camera(analysis_id: str) -> str:
    """Convert single-camera MediaPipe keypoints to keypoints_3d.json format.

    MediaPipe Pose outputs (x, y) in normalized image coords [0-1] and
    z in meters (world landmark depth relative to hip midpoint).

    The Viewer3D component expects millimeter-scale world coordinates
    (camera at ~1500mm distance, joint radius = 8mm), so we convert:
      - x: (x_norm - 0.5) * 2000  → center around 0, scale to mm
      - y: (1.0 - y_norm) * 2000  → flip Y (image-Y↓ → 3D-Y↑), scale to mm
      - z: -z_world * 1000        → meters→mm, negate (MediaPipe -Z = toward camera → +Z)

    Returns the path to the created keypoints_3d.json file.
    """
    import json as _json
    kp_path = os.path.join("data", "output", analysis_id, "keypoints.json")
    if not os.path.exists(kp_path):
        raise FileNotFoundError(f"Keypoints file not found: {kp_path}")

    with open(kp_path, encoding="utf-8") as f:
        data = _json.load(f)

    SCALE_XY = 2000.0   # mm — approximate world width/height
    SCALE_Z = 1000.0    # meters → mm

    frames_3d = []
    for frame in data.get("frames", []):
        landmarks_3d = []
        for lm in frame.get("landmarks", []):
            # Convert normalized image coords → mm world coords
            x_mm = (lm.get("x", 0.5) - 0.5) * SCALE_XY
            y_mm = (1.0 - lm.get("y", 0.5)) * SCALE_XY   # flip Y
            z_mm = -lm.get("z", 0.0) * SCALE_Z            # meters→mm, negate
            landmarks_3d.append({
                "id": lm.get("id", 0),
                "name": lm.get("name", ""),
                "x": round(x_mm, 3),
                "y": round(y_mm, 3),
                "z": round(z_mm, 3),
                "visibility": lm.get("visibility", 0),
                "reprojection_error": 0.0,
            })
        frames_3d.append({
            "frame_index": frame.get("frame_index", 0),
            "timestamp_ms": frame.get("timestamp_ms", 0),
            "landmarks": landmarks_3d,
            "detected": len(landmarks_3d) >= 12,
        })

    frames_with_pose = sum(1 for f in frames_3d if f["detected"])
    total_frames = len(frames_3d)
    metadata_2d = data.get("metadata", {})
    fps = metadata_2d.get("video_fps", 30)

    output_3d = {
        "metadata": {
            "video_fps": fps,
            "total_frames": total_frames,
            "camera_count": 1,
            "calibration_session_id": None,
            "world_units": "mm",
            "dimensions": 3,
            "frames_processed": total_frames,
            "frames_with_pose": frames_with_pose,
            "detection_rate": round(frames_with_pose / max(total_frames, 1), 4),
            "triangulation_rate": 1.0,
            "landmark_count": 33,
        },
        "frames": frames_3d,
    }

    output_path = os.path.join("data", "output", analysis_id, "keypoints_3d.json")
    with open(output_path, "w", encoding="utf-8") as f:
        _json.dump(output_3d, f, indent=2, ensure_ascii=False)

    return output_path


def _scale_3d_keypoints_to_mm(analysis_id: str) -> None:
    """Convert normalized 3D keypoints to millimeter-scale world coords.

    Used after triangulation with identity projection matrices (no-calibration
    mode), which produces coordinates in the same normalized [0-1] space as
    the 2D input. Real calibration produces metric output — skip in that case.

    Modifies keypoints_3d.json in-place.
    """
    import json as _json
    kp_3d_path = os.path.join("data", "output", analysis_id, "keypoints_3d.json")
    if not os.path.exists(kp_3d_path):
        return

    with open(kp_3d_path, encoding="utf-8") as f:
        data = _json.load(f)

    meta = data.get("metadata", {})
    if meta.get("world_units") == "mm":
        return  # already in mm

    SCALE_XY = 2000.0
    SCALE_Z = 1000.0

    for frame in data.get("frames", []):
        for lm in frame.get("landmarks", []):
            lm["x"] = round((lm.get("x", 0.5) - 0.5) * SCALE_XY, 3)
            lm["y"] = round((1.0 - lm.get("y", 0.5)) * SCALE_XY, 3)
            lm["z"] = round(-lm.get("z", 0.0) * SCALE_Z, 3)

    meta["world_units"] = "mm"
    data["metadata"] = meta

    with open(kp_3d_path, "w", encoding="utf-8") as f:
        _json.dump(data, f, indent=2, ensure_ascii=False)


async def _process_video_background(analysis_id: str, file_bytes: bytes, filename: str):
    """Background task: save file, run pose estimation, analysis, and feedback.

    Supports both single-camera (2D) and multi-camera (3D) pipelines.
    For 3D: requires calibration_session_id set on the analysis record.
    """
    db = next(get_db())
    analysis = None
    try:
        # Save uploaded file (single camera) or load from recording dir (multi)
        is_multi = False
        analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()

        if analysis and analysis.capture_mode == "multi_camera":
            is_multi = True
            # Videos are already saved by RecordingService
            # Load recording metadata
            import json as _json
            rec_meta_path = os.path.join("data", "recordings", analysis_id, "meta.json")
            if os.path.exists(rec_meta_path):
                with open(rec_meta_path, encoding="utf-8") as f:
                    rec_meta = _json.load(f)
            else:
                rec_meta = {}
        else:
            StorageService.save_upload(analysis_id, file_bytes, filename)

        if analysis:
            analysis.status = "processing"
            db.commit()

        if is_multi and analysis.calibration_session_id:
            # ═══════════════════════════════════════════════════
            # 3D MULTI-CAMERA PIPELINE
            # ═══════════════════════════════════════════════════
            camera_count = analysis.camera_count or 2
            video_paths = [
                os.path.join("data", "recordings", analysis_id, f"cam_{i}.mp4")
                for i in range(camera_count)
            ]

            # Step 1: Pose estimation on each camera
            pose_result = await _get_pose_service().process_multi_camera(
                analysis_id, video_paths
            )

            # Step 2: 3D triangulation
            from backend.services.triangulation_service import TriangulationService
            tri_service = TriangulationService()
            tri_result = await tri_service.triangulate(
                analysis_id, analysis.calibration_session_id
            )

            # Step 3: 3D movement analysis
            exercise_id = analysis.sport_type if analysis.sport_type != "general" else None
            analysis_result = await _get_analysis_service().analyze_3d(
                analysis_id, sport=exercise_id or "general"
            )

            if analysis:
                analysis.overall_score = analysis_result.get("overall_score")
                analysis.metrics = analysis_result.get("metrics")
                analysis.joint_analysis = analysis_result.get("joint_angles_keyframe")
                analysis.frames_with_pose = analysis_result.get("total_frames_analyzed")
                analysis.is_3d = True

        else:
            # ═══════════════════════════════════════════════════
            # SINGLE-CAMERA PIPELINE (monocular 3D)
            # MediaPipe Pose natively outputs (x, y, z) — we
            # leverage this for monocular 3D analysis.
            # ═══════════════════════════════════════════════════
            pose_result = await _get_pose_service().process_video(analysis_id)

            if analysis:
                analysis.total_frames = pose_result.get("metadata", {}).get("total_frames")
                analysis.video_duration_ms = pose_result.get("metadata", {}).get("video_duration_ms")

            # Convert MediaPipe keypoints to 3D format for analyze_3d
            _create_3d_keypoints_from_single_camera(analysis_id)

            exercise_id = analysis.sport_type if analysis and analysis.sport_type != "general" else None
            analysis_result = await _get_analysis_service().analyze_3d(
                analysis_id, sport=exercise_id or "general"
            )

            if analysis:
                analysis.overall_score = analysis_result.get("overall_score")
                analysis.metrics = analysis_result.get("metrics")
                analysis.joint_analysis = analysis_result.get("joint_angles_keyframe")
                analysis.frames_with_pose = analysis_result.get("total_frames_analyzed")
                analysis.is_3d = True

        # Step 4 (shared): AI feedback generation
        exercise_id = analysis.sport_type if analysis and analysis.sport_type != "general" else None
        feedback_result = await _get_feedback_service().generate(analysis_id, exercise_id=exercise_id)

        if analysis:
            analysis.feedback = feedback_result
            analysis.status = "completed"
            analysis.completed_at = datetime.now(timezone.utc)

        db.commit()

    except Exception as e:
        if analysis:
            analysis.status = "failed"
            analysis.error_message = str(e)
            db.commit()
    finally:
        db.close()


async def _process_multi_upload_background(
    analysis_id: str,
    video_data: list[tuple[bytes, str]],
    calibration_session_id: str | None,
    exercise_id: str | None,
):
    """Background task: save multi-camera videos, run 3D pipeline.

    Pipeline: pose estimation per camera → 3D triangulation → 3D analysis → AI feedback.
    Works with or without calibration (identity-matrix fallback for basic 3D).
    """
    db = next(get_db())
    analysis = None
    try:
        # Save all uploaded videos as cam_{i}.mp4
        upload_dir = os.path.join("data", "uploads", analysis_id)
        os.makedirs(upload_dir, exist_ok=True)
        video_paths = []
        for i, (file_bytes, filename) in enumerate(video_data):
            cam_path = os.path.join(upload_dir, f"cam_{i}.mp4")
            with open(cam_path, "wb") as f:
                f.write(file_bytes)
            video_paths.append(cam_path)

        analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
        if analysis:
            analysis.status = "processing"
            db.commit()

        camera_count = len(video_paths)

        if camera_count == 1:
            # ── Single camera: monocular 3D (MediaPipe native z) ──
            # process_video expects the file at data/uploads/{id}/original.mp4
            cam0_path = video_paths[0]
            orig_path = os.path.join(upload_dir, "original.mp4")
            if cam0_path != orig_path:
                import shutil as _shutil
                _shutil.copy2(cam0_path, orig_path)
            await _get_pose_service().process_video(analysis_id)
            _create_3d_keypoints_from_single_camera(analysis_id)
        else:
            # ── Multi-camera: triangulated 3D ──
            # Step 1: Pose estimation on each camera video
            pose_result = await _get_pose_service().process_multi_camera(
                analysis_id, video_paths
            )

            # Step 2: 3D triangulation
            from backend.services.triangulation_service import TriangulationService
            tri_service = TriangulationService()
            if calibration_session_id:
                tri_result = await tri_service.triangulate(
                    analysis_id, calibration_session_id
                )
            else:
                tri_result = await tri_service.triangulate(
                    analysis_id, "no_calibration", camera_count=camera_count
                )
                # Identity-matrix DLT produces normalized coords → scale to mm
                _scale_3d_keypoints_to_mm(analysis_id)

        # Step 3: 3D movement analysis
        effective_exercise = exercise_id or (
            analysis.sport_type if analysis and analysis.sport_type != "general" else None
        )
        analysis_result = await analysis_service.analyze_3d(
            analysis_id, sport=effective_exercise or "general"
        )

        if analysis:
            analysis.overall_score = analysis_result.get("overall_score")
            analysis.metrics = analysis_result.get("metrics")
            analysis.joint_analysis = analysis_result.get("joint_angles_keyframe")
            analysis.frames_with_pose = analysis_result.get("total_frames_analyzed")
            analysis.is_3d = True

        # Step 4: AI feedback generation
        feedback_result = await _get_feedback_service().generate(
            analysis_id, exercise_id=effective_exercise
        )

        if analysis:
            analysis.feedback = feedback_result
            analysis.status = "completed"
            analysis.completed_at = datetime.now(timezone.utc)

        db.commit()

    except Exception as e:
        if analysis:
            analysis.status = "failed"
            analysis.error_message = str(e)
            db.commit()
    finally:
        db.close()


@router.post("/upload/multi", response_model=MultiUploadResponse)
async def upload_multi_videos(
    videos: list[UploadFile],
    calibration_session_id: str = Form(None),
    exercise_id: str = Form(None),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
):
    available, err = _check_video_available()
    if not available:
        raise HTTPException(status_code=503, detail=err)

    # Validate camera count (1 = monocular 3D, 2-4 = triangulated 3D)
    if len(videos) > settings.MAX_CAMERAS:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum {settings.MAX_CAMERAS} cameras supported. Got {len(videos)}.",
        )

    # Validate each video
    for i, video in enumerate(videos):
        _validate_video(video)

    # Validate calibration session if provided
    if calibration_session_id:
        calib_path = os.path.join(
            settings.CALIBRATION_DIR, calibration_session_id, "session.json"
        )
        if not os.path.exists(calib_path):
            raise HTTPException(
                status_code=404,
                detail=f"Calibration session {calibration_session_id} not found",
            )

    analysis_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc)

    # Read all video bytes (with size validation)
    video_data: list[tuple[bytes, str]] = []
    for video in videos:
        file_bytes = await video.read()
        size_mb = len(file_bytes) / (1024 * 1024)
        if size_mb > settings.MAX_UPLOAD_SIZE_MB:
            raise HTTPException(
                status_code=400,
                detail=f"File '{video.filename}' too large ({size_mb:.1f}MB). "
                       f"Max: {settings.MAX_UPLOAD_SIZE_MB}MB",
            )
        video_data.append((file_bytes, video.filename or f"cam_{len(video_data)}.mp4"))

    # Create DB record
    first_filename = videos[0].filename or "multi_camera"
    analysis = Analysis(
        id=analysis_id,
        video_filename=first_filename,
        status="pending",
        sport_type=exercise_id or "general",
        capture_mode="multi_camera",
        calibration_session_id=calibration_session_id,
        camera_count=len(videos),
        created_at=created_at,
    )
    db.add(analysis)
    db.commit()

    # Trigger background processing
    background_tasks.add_task(
        _process_multi_upload_background,
        analysis_id,
        video_data,
        calibration_session_id,
        exercise_id,
    )

    return MultiUploadResponse(
        analysis_id=analysis_id,
        status="pending",
        camera_count=len(videos),
        message=f"{len(videos)} videos uploaded. 3D analysis is being processed.",
        created_at=created_at,
    )


@router.post("/upload", response_model=UploadResponse)
async def upload_video(
    video: UploadFile = File(...),
    exercise_id: str = Form(None),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
):
    """Upload an exercise video for movement analysis.

    Accepts mp4/mov files up to 500MB. Returns immediately with an analysis_id.
    Processing happens in the background — poll GET /api/results/{id} for status.

    Optional exercise_id enables exercise-specific feedback (e.g. "barbell-squats").
    """
    available, err = _check_video_available()
    if not available:
        raise HTTPException(status_code=503, detail=err)

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

    # Create DB record — store exercise_id in sport_type field (reused for fitness)
    analysis = Analysis(
        id=analysis_id,
        video_filename=video.filename,
        status="pending",
        sport_type=exercise_id or "general",
        created_at=created_at,
    )
    db.add(analysis)
    db.commit()

    # Trigger background processing with exercise context
    background_tasks.add_task(
        _process_video_background, analysis_id, file_bytes, video.filename
    )

    return UploadResponse(
        analysis_id=analysis_id,
        status="pending",
        message="Video uploaded. Analysis is being processed.",
        created_at=created_at,
    )
