"""
Configuration for the pose estimation pipeline.
"""

from dataclasses import dataclass, field


@dataclass
class PoseEstimationConfig:
    """Configuration for MediaPipe Pose estimation.

    Attributes:
        model_complexity: 0 (fastest), 1, or 2 (most accurate).
        min_detection_confidence: Minimum confidence for person detection [0.0, 1.0].
        min_tracking_confidence: Minimum confidence for landmark tracking [0.0, 1.0].
        static_image_mode: If False, uses temporal tracking for video (better
            for video). Set True for standalone images.
        output_fps: Output video FPS. None to use source FPS.
        smooth_landmarks: Apply temporal smoothing to reduce jitter.
    """

    model_complexity: int = 2
    min_detection_confidence: float = 0.5
    min_tracking_confidence: float = 0.5
    static_image_mode: bool = False
    output_fps: int | None = None
    smooth_landmarks: bool = True


@dataclass
class SkeletonStyleConfig:
    """Visual style configuration for skeleton rendering.

    Attributes:
        landmark_radius: Radius of landmark circles in pixels.
        line_thickness: Thickness of connection lines in pixels.
        landmark_color: BGR color tuple for body landmarks.
        hand_foot_color: BGR color tuple for hand/foot landmarks.
        connection_color: BGR color tuple for connection lines.
        overlay_alpha: Alpha blending factor for overlay (0.0 to 1.0).
    """

    landmark_radius: int = 4
    line_thickness: int = 2
    landmark_color: tuple[int, int, int] = (255, 255, 0)  # Cyan
    hand_foot_color: tuple[int, int, int] = (255, 0, 255)  # Magenta
    connection_color: tuple[int, int, int] = (0, 255, 0)  # Green
    overlay_alpha: float = 0.6


# Default configs
DEFAULT_POSE_CONFIG = PoseEstimationConfig()
DEFAULT_SKELETON_STYLE = SkeletonStyleConfig()
