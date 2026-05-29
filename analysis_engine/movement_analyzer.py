"""
Movement quality analyzer.

Computes five biomechanical metrics from time-series keypoint data:
- Balance: Center of mass stability
- Posture: Shoulder symmetry and trunk alignment
- Timing: Movement phase rhythm consistency
- Efficiency: Movement smoothness (jerk minimization)
- Coordination: Multi-joint synchronization
"""

import numpy as np
from scipy import signal

from pose_estimation.landmark_definitions import (
    LEFT_SHOULDER, RIGHT_SHOULDER,
    LEFT_WRIST, RIGHT_WRIST,
    LEFT_HIP, RIGHT_HIP,
    LEFT_KNEE, RIGHT_KNEE,
    LEFT_ELBOW, RIGHT_ELBOW,
)


def _get_landmark(frame: dict, idx: int) -> np.ndarray | None:
    """Safely extract a landmark position from a frame."""
    if not frame.get("detected") or not frame.get("landmarks"):
        return None
    lms = frame["landmarks"]
    if idx >= len(lms):
        return None
    lm = lms[idx]
    return np.array([lm["x"], lm["y"]])


class MovementAnalyzer:
    """Computes movement quality metrics from pose keypoint sequences."""

    def analyze(self, frames_data: list[dict]) -> dict[str, float]:
        """Compute all five quality metrics for a movement sequence.

        Args:
            frames_data: List of per-frame data dicts with landmarks.

        Returns:
            Dict with keys: balance, posture, timing, efficiency, coordination.
            Each value is a score from 0-100 (higher = better).
        """
        # Filter to frames with detected poses
        valid_frames = [f for f in frames_data if f.get("detected")]

        if len(valid_frames) < 2:
            return {
                "balance": 50,
                "posture": 50,
                "timing": 50,
                "efficiency": 50,
                "coordination": 50,
            }

        metrics = {
            "balance": self._compute_balance(valid_frames),
            "posture": self._compute_posture(valid_frames),
            "timing": self._compute_timing(valid_frames),
            "efficiency": self._compute_efficiency(valid_frames),
            "coordination": self._compute_coordination(valid_frames),
        }

        # Clamp all values to 0-100
        return {k: max(0.0, min(100.0, round(v, 1))) for k, v in metrics.items()}

    def _compute_balance(self, frames: list[dict]) -> float:
        """Balance score based on center-of-mass lateral stability.

        Lower std of CoM x-position = more stable = higher score.
        """
        com_x_positions = []
        for f in frames:
            left_hip = _get_landmark(f, LEFT_HIP)
            right_hip = _get_landmark(f, RIGHT_HIP)
            if left_hip is not None and right_hip is not None:
                com_x = (left_hip[0] + right_hip[0]) / 2
                com_x_positions.append(com_x)

        if len(com_x_positions) < 2:
            return 50.0

        std_x = float(np.std(com_x_positions))
        # Normalize: typical std range is 0-0.1 for stable movements
        score = 100 * (1.0 - min(std_x / 0.08, 1.0))
        return score

    def _compute_posture(self, frames: list[dict]) -> float:
        """Posture score based on shoulder symmetry and trunk alignment."""
        shoulder_sym_scores = []
        trunk_scores = []

        for f in frames:
            left_shoulder = _get_landmark(f, LEFT_SHOULDER)
            right_shoulder = _get_landmark(f, RIGHT_SHOULDER)
            left_hip = _get_landmark(f, LEFT_HIP)
            right_hip = _get_landmark(f, RIGHT_HIP)

            if all(x is not None for x in [left_shoulder, right_shoulder, left_hip, right_hip]):
                # Shoulder height symmetry
                shoulder_diff = abs(left_shoulder[1] - right_shoulder[1])
                shoulder_span = abs(left_shoulder[0] - right_shoulder[0]) + 1e-8
                shoulder_sym = 1.0 - min(shoulder_diff / (shoulder_span * 0.1), 1.0)
                shoulder_sym_scores.append(shoulder_sym)

                # Trunk inclination from vertical
                mid_shoulder = (left_shoulder + right_shoulder) / 2
                mid_hip = (left_hip + right_hip) / 2
                trunk_vector = mid_shoulder - mid_hip
                trunk_angle = abs(np.degrees(np.arctan2(
                    trunk_vector[0], -trunk_vector[1]
                )))
                trunk_score = max(0, 1.0 - trunk_angle / 30.0)
                trunk_scores.append(trunk_score)

        if not shoulder_sym_scores:
            return 50.0

        avg_sym = np.mean(shoulder_sym_scores)
        avg_trunk = np.mean(trunk_scores) if trunk_scores else 0.5
        return 100 * (0.5 * avg_sym + 0.5 * avg_trunk)

    def _compute_timing(self, frames: list[dict]) -> float:
        """Timing score based on consistency of movement rhythm.

        Measures how smoothly the wrist trajectory changes over time.
        """
        right_wrist_y = []
        for f in frames:
            rw = _get_landmark(f, RIGHT_WRIST)
            if rw is not None:
                right_wrist_y.append(rw[1])

        if len(right_wrist_y) < 5:
            return 50.0

        # Compute velocity profile
        velocities = np.diff(right_wrist_y)
        if len(velocities) < 2:
            return 50.0

        # Timing is good when velocity changes are smooth (low acceleration variance)
        accelerations = np.diff(velocities)
        accel_std = float(np.std(accelerations))
        accel_range = float(np.max(np.abs(accelerations))) + 1e-8

        # Coefficient of variation of acceleration
        cv = accel_std / accel_range if accel_range > 0 else 0
        score = 100 * (1.0 - min(cv / 0.5, 1.0))
        return score

    def _compute_efficiency(self, frames: list[dict]) -> float:
        """Efficiency score based on movement smoothness (jerk).

        Lower jerk (3rd derivative of position) = smoother = more efficient.
        """
        right_wrist_x, right_wrist_y = [], []
        for f in frames:
            rw = _get_landmark(f, RIGHT_WRIST)
            if rw is not None:
                right_wrist_x.append(rw[0])
                right_wrist_y.append(rw[1])

        min_len = 10
        if len(right_wrist_x) < min_len:
            return 50.0

        # Apply Savitzky-Golay filter to smooth, then compute 3rd derivative
        try:
            if len(right_wrist_x) >= 11:
                filtered_x = signal.savgol_filter(right_wrist_x, 11, 3)
                filtered_y = signal.savgol_filter(right_wrist_y, 11, 3)
            else:
                filtered_x = right_wrist_x
                filtered_y = right_wrist_y

            # Jerk = third derivative magnitude
            jerk_x = np.abs(np.diff(filtered_x, n=3))
            jerk_y = np.abs(np.diff(filtered_y, n=3))
            jerk_mag = np.sqrt(jerk_x**2 + jerk_y**2)
            avg_jerk = float(np.mean(jerk_mag))

            # Score: exponentially decay with increasing jerk
            # Typical jerk range: 0.001 to 0.5 for normalized coordinates
            score = 100 * np.exp(-avg_jerk * 15)
            return score

        except (ValueError, np.linalg.LinAlgError):
            return 50.0

    def _compute_coordination(self, frames: list[dict]) -> float:
        """Coordination score based on arm-leg synchronization.

        Cross-correlates elbow and knee angle series.
        """
        elbow_series = []
        knee_series = []

        for f in frames:
            left_elbow = _get_landmark(f, LEFT_ELBOW)
            right_elbow = _get_landmark(f, RIGHT_ELBOW)
            left_wrist = _get_landmark(f, LEFT_WRIST)
            right_wrist = _get_landmark(f, RIGHT_WRIST)
            left_hip = _get_landmark(f, LEFT_HIP)
            right_hip = _get_landmark(f, RIGHT_HIP)
            left_knee = _get_landmark(f, LEFT_KNEE)
            right_knee = _get_landmark(f, RIGHT_KNEE)

            if all(x is not None for x in [right_elbow, right_wrist, right_hip, right_knee]):
                # Elbow extension (wrist-elbow distance as proportion of shoulder-elbow distance)
                elbow_ext = np.linalg.norm(right_elbow - right_wrist)
                elbow_series.append(elbow_ext)

                # Knee angle proxy: hip-knee vs knee-ankle
                knee_angle_proxy = abs(right_hip[1] - right_knee[1])
                knee_series.append(knee_angle_proxy)

        if len(elbow_series) < 5 or len(knee_series) < 5:
            return 50.0

        # Ensure same length
        min_len = min(len(elbow_series), len(knee_series))
        elbow_series = elbow_series[:min_len]
        knee_series = knee_series[:min_len]

        # Cross-correlation at zero lag
        correlation = np.corrcoef(elbow_series, knee_series)[0, 1]

        if np.isnan(correlation):
            return 50.0

        # Absolute correlation: how well coordinated the movements are
        score = 100 * abs(correlation)
        return score
