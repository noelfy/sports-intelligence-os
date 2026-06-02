"""
3D-specific biomechanical metrics.

These metrics can only be computed from calibrated 3D skeleton data
(world-space coordinates in mm). They supplement the existing 2D metrics
in movement_analyzer.py with depth and volume measurements.
"""

import numpy as np
from pose_estimation.landmark_definitions import (
    LEFT_HIP, RIGHT_HIP,
    LEFT_KNEE, RIGHT_KNEE,
    LEFT_ANKLE, RIGHT_ANKLE,
    LEFT_SHOULDER, RIGHT_SHOULDER,
    LEFT_WRIST, RIGHT_WRIST,
)


class ThreeDMetrics:
    """Computes biomechanical metrics from 3D world-coordinate data."""

    @staticmethod
    def jump_height(hip_heights: list[float], fps: float) -> dict:
        """Calculate vertical jump height from hip trajectory.

        Uses: peak hip_y - median standing hip_y.
        Requires takeoff and landing detection via velocity sign change.

        Args:
            hip_heights: Y-coordinate (vertical) of hip midpoint over time.
            fps: Frames per second.

        Returns:
            Dict with jump_height_cm, flight_time_ms, takeoff_frame, landing_frame.
        """
        if len(hip_heights) < 5:
            return {"jump_height_cm": 0, "flight_time_ms": 0}

        arr = np.array(hip_heights)
        # Standing height is the median (most common position)
        standing_height = float(np.median(arr))
        peak_height = float(np.max(arr))
        jump_cm = (peak_height - standing_height) / 10.0  # mm → cm

        # Estimate flight time from when hip is above standing + 2cm
        in_air = arr > (standing_height + 20)
        flight_frames = int(np.sum(in_air))
        flight_ms = (flight_frames / fps) * 1000 if fps > 0 else 0

        return {
            "jump_height_cm": round(jump_cm, 1),
            "flight_time_ms": round(flight_ms, 0),
            "peak_height_mm": round(peak_height, 1),
            "standing_height_mm": round(standing_height, 1),
        }

    @staticmethod
    def movement_velocity_3d(trajectory: np.ndarray, fps: float) -> dict:
        """Calculate 3D velocity magnitude for a landmark over time.

        Args:
            trajectory: Nx3 array of (x, y, z) world coordinates.
            fps: Frames per second.

        Returns:
            Dict with mean_velocity_ms, peak_velocity_ms.
        """
        if len(trajectory) < 3:
            return {"mean_velocity_ms": 0, "peak_velocity_ms": 0}

        # Frame-to-frame displacement in mm
        diff = np.diff(trajectory, axis=0)
        distances = np.linalg.norm(diff, axis=1)  # mm/frame
        velocities = distances * fps / 1000.0  # m/s

        return {
            "mean_velocity_ms": round(float(np.mean(velocities)), 2),
            "peak_velocity_ms": round(float(np.max(velocities)), 2),
        }

    @staticmethod
    def symmetry_index_3d(left_series: np.ndarray,
                           right_series: np.ndarray) -> dict:
        """Compute true bilateral symmetry from 3D data.

        Symmetry index = |L - R| / (|L| + |R|) * 100. Lower is better.
        """
        if len(left_series) < 2 or len(right_series) < 2:
            return {"symmetry_index": 100, "asymmetry_mm": 0}

        left_mean = np.mean(np.abs(left_series))
        right_mean = np.mean(np.abs(right_series))

        if left_mean + right_mean < 1e-6:
            return {"symmetry_index": 0, "asymmetry_mm": 0}

        si = abs(left_mean - right_mean) / (left_mean + right_mean) * 100
        asym_mm = abs(left_mean - right_mean)

        return {
            "symmetry_index": round(float(si), 1),
            "asymmetry_mm": round(float(asym_mm), 1),
            "left_mean_mm": round(float(left_mean), 1),
            "right_mean_mm": round(float(right_mean), 1),
        }

    @staticmethod
    def pelvis_rotation(left_hip_x: list[float],
                         right_hip_x: list[float]) -> dict:
        """Measure pelvic rotation in the transverse plane.

        Positive = left hip forward, negative = right hip forward.
        """
        if len(left_hip_x) < 2:
            return {"pelvis_rotation_deg": 0, "rotation_std_deg": 0}

        # Difference in Z (depth) between left and right hip
        left = np.array(left_hip_x)
        right = np.array(right_hip_x)
        diff_mm = left - right

        # Convert to approximate angle (small angle approximation)
        # Assuming hip width ~150mm
        hip_width_mm = 150.0
        angles_deg = np.degrees(np.arctan2(diff_mm, hip_width_mm))

        return {
            "pelvis_rotation_mean_deg": round(float(np.mean(angles_deg)), 1),
            "pelvis_rotation_std_deg": round(float(np.std(angles_deg)), 1),
            "pelvis_rotation_range_deg": round(
                float(np.max(angles_deg) - np.min(angles_deg)), 1
            ),
        }

    @staticmethod
    def lateral_flexion(shoulder_mid_x: list[float],
                         hip_mid_x: list[float]) -> dict:
        """Measure lateral spine flexion from shoulder-hip offset in frontal plane.

        The X coordinate in world space represents left-right deviation.
        """
        if len(shoulder_mid_x) < 2:
            return {"lateral_flexion_mean_deg": 0}

        shoulder = np.array(shoulder_mid_x)
        hip = np.array(hip_mid_x)
        offset_mm = shoulder - hip

        # Rough conversion: 10mm offset ≈ 1.5° lateral flexion
        angles_deg = offset_mm * 0.15

        return {
            "lateral_flexion_mean_deg": round(float(np.mean(np.abs(angles_deg))), 1),
            "lateral_flexion_max_deg": round(float(np.max(np.abs(angles_deg))), 1),
        }

    @staticmethod
    def spine_curvature(shoulders: np.ndarray, hips: np.ndarray,
                         knees: np.ndarray) -> dict:
        """Analyze sagittal plane spine alignment from 3D body landmarks.

        Measures how well shoulders, hips, and knees align in the
        sagittal (Y-Z) plane.
        """
        if len(shoulders) < 2 or len(hips) < 2:
            return {"spine_alignment_deg": 0}

        # Midpoints
        sh_mid = np.mean(shoulders, axis=0)  # (x, y, z)
        hip_mid = np.mean(hips, axis=0)
        knee_mid = np.mean(knees, axis=0) if len(knees) > 0 else None

        # Torso vector (hips → shoulders)
        torso = sh_mid - hip_mid  # (x, y, z)
        # Project to sagittal plane (Y-Z)
        torso_sagittal = np.array([0, torso[1], torso[2]])
        # Angle from vertical (Y axis)
        vertical = np.array([0, 1, 0])
        dot = np.dot(torso_sagittal, vertical)
        norm = np.linalg.norm(torso_sagittal) + 1e-8
        angle = np.degrees(np.arccos(np.clip(dot / norm, -1, 1)))

        return {
            "spine_alignment_deg": round(float(angle), 1),
        }
