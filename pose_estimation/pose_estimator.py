"""
MediaPipe Pose estimator wrapper.

Provides a clean interface for running pose estimation on images/video frames.
"""

import cv2
import numpy as np
import mediapipe as mp

from pose_estimation.config import PoseEstimationConfig, DEFAULT_POSE_CONFIG
from pose_estimation.landmark_definitions import LANDMARK_COUNT, LANDMARK_NAMES


class PoseEstimator:
    """Wraps MediaPipe Pose for single-frame landmark extraction.

    Usage:
        estimator = PoseEstimator()
        landmarks = estimator.estimate(frame)  # frame is BGR numpy array
        # landmarks is list of 33 dicts: {x, y, z, visibility, name}
        estimator.close()
    """

    def __init__(self, config: PoseEstimationConfig | None = None):
        """Initialize the MediaPipe Pose model.

        Args:
            config: PoseEstimationConfig or None to use defaults.
        """
        self.config = config or DEFAULT_POSE_CONFIG
        self._mp_pose = mp.solutions.pose
        self._pose = self._mp_pose.Pose(
            model_complexity=self.config.model_complexity,
            min_detection_confidence=self.config.min_detection_confidence,
            min_tracking_confidence=self.config.min_tracking_confidence,
            static_image_mode=self.config.static_image_mode,
            smooth_landmarks=self.config.smooth_landmarks,
        )

    def estimate(self, image: np.ndarray) -> list[dict] | None:
        """Run pose estimation on a single BGR image frame.

        Args:
            image: BGR numpy array (height, width, 3) as read by OpenCV.

        Returns:
            List of 33 landmark dicts with keys:
                x: float (normalized 0-1, image width ratio)
                y: float (normalized 0-1, image height ratio)
                z: float (relative depth, roughly proportional to hip width)
                visibility: float (0-1, confidence of landmark being visible)
                name: str (human-readable landmark name)
            Or None if no person was detected.
        """
        # MediaPipe expects RGB
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        # Disable writeability for performance
        image_rgb.flags.writeable = False
        results = self._pose.process(image_rgb)
        image_rgb.flags.writeable = True

        if results.pose_landmarks is None:
            return None

        landmarks = []
        for i, lm in enumerate(results.pose_landmarks.landmark):
            landmarks.append({
                "x": round(lm.x, 6),
                "y": round(lm.y, 6),
                "z": round(lm.z, 6),
                "visibility": round(lm.visibility, 6),
                "name": LANDMARK_NAMES.get(i, f"landmark_{i}"),
            })

        return landmarks

    def reset(self) -> None:
        """Reset the underlying MediaPipe Pose instance (e.g., between videos)."""
        self._pose.close()
        self._pose = self._mp_pose.Pose(
            model_complexity=self.config.model_complexity,
            min_detection_confidence=self.config.min_detection_confidence,
            min_tracking_confidence=self.config.min_tracking_confidence,
            static_image_mode=self.config.static_image_mode,
            smooth_landmarks=self.config.smooth_landmarks,
        )

    def close(self) -> None:
        """Release MediaPipe resources."""
        self._pose.close()
