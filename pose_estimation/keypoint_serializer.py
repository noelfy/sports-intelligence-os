"""
Serializes MediaPipe pose landmarks to JSON-serializable format.

Handles both per-frame and full-video serialization with metadata.
"""

from datetime import datetime, timezone
from typing import Any


def serialize_frame_landmarks(
    frame_index: int,
    landmarks: list[dict] | None,
    timestamp_ms: float,
) -> dict[str, Any]:
    """Serialize a single frame's landmarks with metadata.

    Args:
        frame_index: Zero-based frame number in the video.
        landmarks: List of 33 landmark dicts from PoseEstimator, or None.
        timestamp_ms: Timestamp of the frame in milliseconds from video start.

    Returns:
        Dict with frame_index, timestamp_ms, landmarks array, and detected flag.
    """
    if landmarks is None:
        return {
            "frame_index": frame_index,
            "timestamp_ms": round(timestamp_ms, 2),
            "landmarks": [],
            "detected": False,
        }

    return {
        "frame_index": frame_index,
        "timestamp_ms": round(timestamp_ms, 2),
        "landmarks": [
            {
                "id": i,
                "name": lm["name"],
                "x": lm["x"],
                "y": lm["y"],
                "z": lm["z"],
                "visibility": lm["visibility"],
            }
            for i, lm in enumerate(landmarks)
        ],
        "detected": True,
    }


def serialize_all_frames(
    frames_data: list[dict],
    video_metadata: dict[str, Any],
    model_info: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Serialize all frame data and video metadata into the final keypoint format.

    Args:
        frames_data: List of per-frame dicts from serialize_frame_landmarks.
        video_metadata: Dict with keys:
            video_filename, video_fps, video_duration_ms, total_frames,
            width, height.
        model_info: Optional dict with model name, version, etc.

    Returns:
        Complete keypoint data structure ready for JSON serialization.
    """
    frames_with_pose = sum(1 for f in frames_data if f["detected"])
    total_frames = len(frames_data)

    return {
        "metadata": {
            "video_filename": video_metadata.get("video_filename", "unknown"),
            "video_fps": video_metadata.get("video_fps", 0),
            "video_duration_ms": video_metadata.get("video_duration_ms", 0),
            "total_frames": total_frames,
            "frames_processed": total_frames,
            "frames_with_pose": frames_with_pose,
            "detection_rate": round(frames_with_pose / max(total_frames, 1), 4),
            "width": video_metadata.get("width", 0),
            "height": video_metadata.get("height", 0),
            "model": model_info or {
                "name": "mediapipe_pose",
                "landmark_count": 33,
            },
            "processed_at": datetime.now(timezone.utc).isoformat(),
        },
        "frames": frames_data,
    }
