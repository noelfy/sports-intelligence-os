"""
Joint angle calculation from 3D landmark positions.

Computes biomechanical joint angles (in degrees) using three connected landmarks.
"""

import numpy as np

from pose_estimation.landmark_definitions import (
    LEFT_SHOULDER, RIGHT_SHOULDER,
    LEFT_ELBOW, RIGHT_ELBOW,
    LEFT_WRIST, RIGHT_WRIST,
    LEFT_HIP, RIGHT_HIP,
    LEFT_KNEE, RIGHT_KNEE,
    LEFT_ANKLE, RIGHT_ANKLE,
)


class JointAnalyzer:
    """Calculates joint angles from 3-point combinations of landmarks.

    The angle is computed as the interior angle at the middle (vertex) point.
    """

    @staticmethod
    def angle_between_three_points(
        a: np.ndarray, b: np.ndarray, c: np.ndarray
    ) -> float:
        """Calculate the angle ABC where B is the vertex.

        Args:
            a: 3D point (x, y, z).
            b: Vertex point (x, y, z).
            c: 3D point (x, y, z).

        Returns:
            Angle in degrees (0-180).
        """
        ba = a - b
        bc = c - b
        cosine = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-8)
        cosine = np.clip(cosine, -1.0, 1.0)
        return float(np.degrees(np.arccos(cosine)))

    @staticmethod
    def _landmark_to_xyz(landmark: dict) -> np.ndarray:
        """Convert a landmark dict {x, y, z} to numpy array."""
        return np.array([landmark["x"], landmark["y"], landmark.get("z", 0)])

    def get_volleyball_angles(self, landmarks: list[dict]) -> dict[str, float]:
        """Extract volleyball-relevant joint angles from 33 MediaPipe landmarks.

        Args:
            landmarks: List of 33 landmark dicts with x, y, z keys.

        Returns:
            Dict mapping angle_name -> degrees.
        """
        pts = [self._landmark_to_xyz(lm) for lm in landmarks]

        angles = {}

        # Right elbow: shoulder - elbow - wrist
        angles["right_elbow"] = self.angle_between_three_points(
            pts[RIGHT_SHOULDER], pts[RIGHT_ELBOW], pts[RIGHT_WRIST]
        )
        # Left elbow
        angles["left_elbow"] = self.angle_between_three_points(
            pts[LEFT_SHOULDER], pts[LEFT_ELBOW], pts[LEFT_WRIST]
        )

        # Right shoulder abduction: elbow - shoulder - hip
        angles["right_shoulder"] = self.angle_between_three_points(
            pts[RIGHT_ELBOW], pts[RIGHT_SHOULDER], pts[RIGHT_HIP]
        )
        # Left shoulder
        angles["left_shoulder"] = self.angle_between_three_points(
            pts[LEFT_ELBOW], pts[LEFT_SHOULDER], pts[LEFT_HIP]
        )

        # Right knee: hip - knee - ankle
        angles["right_knee"] = self.angle_between_three_points(
            pts[RIGHT_HIP], pts[RIGHT_KNEE], pts[RIGHT_ANKLE]
        )
        # Left knee
        angles["left_knee"] = self.angle_between_three_points(
            pts[LEFT_HIP], pts[LEFT_KNEE], pts[LEFT_ANKLE]
        )

        # Right hip: shoulder - hip - knee
        angles["right_hip"] = self.angle_between_three_points(
            pts[RIGHT_SHOULDER], pts[RIGHT_HIP], pts[RIGHT_KNEE]
        )
        # Left hip
        angles["left_hip"] = self.angle_between_three_points(
            pts[LEFT_SHOULDER], pts[LEFT_HIP], pts[LEFT_KNEE]
        )

        # Trunk inclination (from vertical): midpoint shoulders to midpoint hips
        mid_shoulder = (pts[LEFT_SHOULDER] + pts[RIGHT_SHOULDER]) / 2
        mid_hip = (pts[LEFT_HIP] + pts[RIGHT_HIP]) / 2
        vertical = np.array([mid_shoulder[0], mid_shoulder[1] - 1.0, mid_shoulder[2]])
        angles["trunk_inclination"] = self.angle_between_three_points(
            mid_hip, mid_shoulder, vertical
        )

        # Symmetry metrics
        angles["shoulder_symmetry"] = abs(angles["right_shoulder"] - angles["left_shoulder"])
        angles["knee_symmetry"] = abs(angles["right_knee"] - angles["left_knee"])
        angles["elbow_symmetry"] = abs(angles["right_elbow"] - angles["left_elbow"])

        return angles

    def get_all_frame_angles(
        self, frames_data: list[dict]
    ) -> list[dict | None]:
        """Compute joint angles for every valid frame.

        Args:
            frames_data: List of per-frame data dicts.

        Returns:
            List of angle dicts per frame, or None for frames without pose.
        """
        results = []
        for frame in frames_data:
            if not frame.get("detected") or not frame.get("landmarks"):
                results.append(None)
                continue

            try:
                angles = self.get_volleyball_angles(frame["landmarks"])
                results.append(angles)
            except (IndexError, KeyError):
                results.append(None)

        return results
