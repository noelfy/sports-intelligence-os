"""
Volleyball-specific movement analysis rules.

Defines key joints, metric weights, and phase detection for volleyball.
"""

import numpy as np

from analysis_engine.rules.base import BaseSportRule
from pose_estimation.landmark_definitions import (
    LEFT_SHOULDER, RIGHT_SHOULDER,
    LEFT_ELBOW, RIGHT_ELBOW,
    LEFT_WRIST, RIGHT_WRIST,
    LEFT_HIP, RIGHT_HIP,
    LEFT_KNEE, RIGHT_KNEE,
    LEFT_ANKLE, RIGHT_ANKLE,
)


class VolleyballRule(BaseSportRule):
    """Volleyball-specific analysis configuration."""

    sport_name = "volleyball"

    def get_key_joints(self) -> list[str]:
        return [
            "right_shoulder", "left_shoulder",
            "right_elbow", "left_elbow",
            "right_wrist", "left_wrist",
            "right_hip", "left_hip",
            "right_knee", "left_knee",
            "right_ankle", "left_ankle",
        ]

    def get_metric_weights(self) -> dict[str, float]:
        # Volleyball emphasizes timing and coordination for setter/spiker movements
        return {
            "balance": 0.15,
            "posture": 0.20,
            "timing": 0.25,
            "efficiency": 0.20,
            "coordination": 0.20,
        }

    def detect_phases(self, frames_data: list[dict]) -> list[dict]:
        """Detect volleyball movement phases: preparation, jump, contact, follow-through.

        Uses wrist height (contact point) and knee angle (jump preparation) to identify phases.
        """
        if len(frames_data) < 10:
            return []

        # Extract key metrics over time
        wrist_heights = []
        knee_angles = []
        for frame in frames_data:
            if not frame.get("detected") or not frame.get("landmarks"):
                wrist_heights.append(None)
                knee_angles.append(None)
                continue

            lms = frame["landmarks"]
            # Wrist height (use y-coordinate; lower y = higher in image = higher jump)
            right_wrist_y = lms[RIGHT_WRIST]["y"] if len(lms) > RIGHT_WRIST else None
            wrist_heights.append(right_wrist_y)

            # Right knee angle (approximation: hip-to-knee vs knee-to-ankle distance ratio)
            if len(lms) > max(RIGHT_HIP, RIGHT_KNEE, RIGHT_ANKLE):
                hip = np.array([lms[RIGHT_HIP]["x"], lms[RIGHT_HIP]["y"]])
                knee = np.array([lms[RIGHT_KNEE]["x"], lms[RIGHT_KNEE]["y"]])
                ankle = np.array([lms[RIGHT_ANKLE]["x"], lms[RIGHT_ANKLE]["y"]])
                # Approximate knee angle using vector dot product
                v1 = hip - knee
                v2 = ankle - knee
                cos_angle = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2) + 1e-8)
                knee_angles.append(np.clip(cos_angle, -1, 1))
            else:
                knee_angles.append(None)

        # Detect phases
        phases = []
        valid_wrist = [(i, h) for i, h in enumerate(wrist_heights) if h is not None]

        if len(valid_wrist) < 10:
            return phases

        # Find the peak (lowest y = highest wrist = contact point)
        peak_frame, peak_height = min(valid_wrist, key=lambda x: x[1])

        # Find preparation: 20-30% before peak, where knee bends
        prep_start = max(0, int(peak_frame * 0.7))
        prep_end = peak_frame

        # Follow-through: after peak
        follow_start = peak_frame
        follow_end = min(len(frames_data) - 1, peak_frame + int(peak_frame * 0.3))

        phases = [
            {
                "name": "preparation",
                "start_frame": prep_start,
                "end_frame": prep_end,
                "description": "Jump preparation and loading phase",
            },
            {
                "name": "contact",
                "start_frame": peak_frame - 3,
                "end_frame": peak_frame + 3,
                "description": "Ball contact / peak reach",
            },
            {
                "name": "follow_through",
                "start_frame": follow_start,
                "end_frame": follow_end,
                "description": "Landing and follow-through",
            },
        ]

        return phases
