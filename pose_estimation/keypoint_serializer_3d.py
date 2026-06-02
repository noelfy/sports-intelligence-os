"""
3D keypoint serializer — world-space landmark format.

Extends the 2D serializer to handle world-space 3D coordinates
from multi-camera triangulation.
"""


def serialize_frame_landmarks_3d(
    frame_index: int,
    landmarks_3d: list[dict],
    timestamp_ms: float,
) -> dict:
    """Serialize 3D landmarks for one frame.

    Args:
        frame_index: Frame number in the synchronized sequence.
        landmarks_3d: List of 33 landmark dicts, each with:
            id, name, x, y, z (world coordinates in mm),
            visibility (0-1), reprojection_error (mm).
        timestamp_ms: Synchronized timestamp in milliseconds.

    Returns:
        Per-frame dict matching existing 2D format but with world-space coords.
    """
    serialized = []
    for lm in landmarks_3d:
        serialized.append({
            "id": lm.get("id", 0),
            "name": lm.get("name", ""),
            "x": round(float(lm.get("x", 0)), 3),
            "y": round(float(lm.get("y", 0)), 3),
            "z": round(float(lm.get("z", 0)), 3),
            "visibility": round(float(lm.get("visibility", 0)), 4),
            "reprojection_error": round(float(lm.get("reprojection_error", 0)), 4),
        })

    detected = len(serialized) >= 12  # at least 12 landmarks = person detected

    return {
        "frame_index": frame_index,
        "timestamp_ms": round(timestamp_ms, 1),
        "landmarks": serialized,
        "detected": detected,
    }


def serialize_all_frames_3d(
    frames_data: list[dict],
    metadata: dict,
) -> dict:
    """Wrap all 3D frames with metadata.

    Args:
        frames_data: List of per-frame dicts from serialize_frame_landmarks_3d.
        metadata: Dict with keys: fps, total_frames, camera_count,
                  calibration_session_id, world_units ("mm").

    Returns:
        Complete keypoints_3d.json structure.
    """
    frames_with_pose = sum(1 for f in frames_data if f.get("detected"))

    return {
        "metadata": {
            **metadata,
            "dimensions": 3,
            "world_units": "mm",
            "frames_processed": len(frames_data),
            "frames_with_pose": frames_with_pose,
            "detection_rate": (
                round(frames_with_pose / len(frames_data), 4)
                if frames_data else 0
            ),
            "landmark_count": 33,
        },
        "frames": frames_data,
    }
