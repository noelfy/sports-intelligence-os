"""
Movement quality analyzer — exercise-aware biomechanical metrics.

Computes raw biomechanical measurements from time-series keypoint data.
Each exercise category gets its own relevant metrics, reflecting what
actually matters for that movement pattern.
"""

import numpy as np
from scipy import signal

from pose_estimation.landmark_definitions import (
    LEFT_SHOULDER, RIGHT_SHOULDER,
    LEFT_WRIST, RIGHT_WRIST,
    LEFT_HIP, RIGHT_HIP,
    LEFT_KNEE, RIGHT_KNEE,
    LEFT_ANKLE, RIGHT_ANKLE,
    LEFT_ELBOW, RIGHT_ELBOW,
)


def _get_landmark(frame: dict, idx: int) -> np.ndarray | None:
    """Safely extract a 2D landmark position from a frame."""
    if not frame.get("detected") or not frame.get("landmarks"):
        return None
    lms = frame["landmarks"]
    if idx >= len(lms):
        return None
    lm = lms[idx]
    return np.array([lm["x"], lm["y"]])


def _get_landmark_3d(frame: dict, idx: int) -> np.ndarray | None:
    """Safely extract a 3D landmark position from a frame."""
    if not frame.get("detected") or not frame.get("landmarks"):
        return None
    lms = frame["landmarks"]
    if idx >= len(lms):
        return None
    lm = lms[idx]
    return np.array([lm["x"], lm.get("y", 0), lm.get("z", 0)])


def _midpoint(a: np.ndarray | None, b: np.ndarray | None) -> np.ndarray | None:
    """Compute midpoint of two points."""
    if a is None or b is None:
        return None
    return (a + b) / 2


class MovementAnalyzer:
    """Computes exercise-category-aware biomechanical measurements.

    Instead of computing the same 6 generic metrics for every exercise,
    this computes only the metrics that matter for each movement category.
    """

    def __init__(self):
        self._lm = _get_landmark  # default to 2D extraction

    def analyze(self, frames_data: list[dict], category: str = "general",
                primary_joints: list[str] | None = None,
                use_3d: bool = False) -> dict[str, float]:
        """Compute biomechanical measurements for a movement sequence.

        Args:
            frames_data: List of per-frame landmark dicts.
            category: Exercise category (squat, hinge, push, pull, etc.).
            primary_joints: Joint names to focus on for isolation exercises.
            use_3d: If True, use 3D world coordinates for all computations.
        """
        valid_frames = [f for f in frames_data if f.get("detected")]

        if len(valid_frames) < 2:
            return {"error": "insufficient_frames", "frame_count": len(valid_frames)}

        # Select landmark extractor
        self._lm = _get_landmark_3d if use_3d else _get_landmark

        # Universal metrics
        metrics = {
            "frame_count": len(valid_frames),
            "dimensions": 3 if use_3d else 2,
            "balance_std": self._measure_balance(valid_frames),
            "shoulder_symmetry": self._measure_shoulder_symmetry(valid_frames),
        }

        # Category-specific metrics
        if category == "squat":
            metrics.update(self._analyze_squat(valid_frames))
        elif category == "hinge":
            metrics.update(self._analyze_hinge(valid_frames))
        elif category == "push":
            metrics.update(self._analyze_push(valid_frames))
        elif category == "pull":
            metrics.update(self._analyze_pull(valid_frames))
        elif category == "core":
            metrics.update(self._analyze_core(valid_frames))
        elif category == "carry":
            metrics.update(self._analyze_carry(valid_frames))
        elif category == "isolation":
            metrics.update(self._analyze_isolation(valid_frames, primary_joints or []))
        else:
            metrics.update(self._analyze_general(valid_frames))

        # Add 3D-specific metrics if applicable
        if use_3d:
            try:
                from analysis_engine.metrics_3d import ThreeDMetrics
                metrics.update(self._compute_3d_metrics(
                    valid_frames, category, ThreeDMetrics
                ))
            except ImportError:
                pass

        return metrics

    def _compute_3d_metrics(self, frames: list[dict], category: str,
                             metrics_3d) -> dict:
        """Compute additional metrics only available with 3D data."""
        result = {}

        # Extract hip midpoint Y (vertical) trajectory for jump height
        hip_y = []
        left_hip_z = []
        right_hip_z = []
        shoulder_x = []
        hip_x = []
        left_wrist_3d = []
        right_wrist_3d = []

        # Collect key trajectories
        for f in frames:
            lh = _get_landmark_3d(f, LEFT_HIP)
            rh = _get_landmark_3d(f, RIGHT_HIP)
            ls = _get_landmark_3d(f, LEFT_SHOULDER)
            rs = _get_landmark_3d(f, RIGHT_SHOULDER)
            lw = _get_landmark_3d(f, LEFT_WRIST)
            rw = _get_landmark_3d(f, RIGHT_WRIST)

            if lh is not None and rh is not None:
                hip_y.append((lh[1] + rh[1]) / 2)
                left_hip_z.append(lh[2])
                right_hip_z.append(rh[2])
                # For lateral flexion: shoulder and hip X (left-right)
                shoulder_x.append((ls[0] + rs[0]) / 2 if ls is not None and rs is not None else 0)
                hip_x.append((lh[0] + rh[0]) / 2)

            if lw is not None:
                left_wrist_3d.append(lw)
            if rw is not None:
                right_wrist_3d.append(rw)

        # Jump height (squat, hinge, volleyball)
        if category in ("squat", "hinge") and hip_y:
            jh = metrics_3d.jump_height(hip_y, 30.0)
            result["jump_height_cm"] = jh["jump_height_cm"]
            result["flight_time_ms"] = jh["flight_time_ms"]

        # Pelvis rotation
        if left_hip_z and right_hip_z:
            pr = metrics_3d.pelvis_rotation(left_hip_z, right_hip_z)
            result["pelvis_rotation_mean_deg"] = pr["pelvis_rotation_mean_deg"]

        # Lateral flexion
        if shoulder_x and hip_x:
            lf = metrics_3d.lateral_flexion(shoulder_x, hip_x)
            result["lateral_flexion_mean_deg"] = lf["lateral_flexion_mean_deg"]

        # Wrist velocity (for throwing/striking sports)
        if left_wrist_3d or right_wrist_3d:
            dominant = right_wrist_3d if right_wrist_3d else left_wrist_3d
            if len(dominant) > 5:
                vel = metrics_3d.movement_velocity_3d(
                    np.array(dominant), 30.0
                )
                result["wrist_peak_velocity_ms"] = vel["peak_velocity_ms"]

        return result

    # ═══════════════════════════════════════════════════════════════
    # UNIVERSAL
    # ═══════════════════════════════════════════════════════════════

    def _measure_balance(self, frames: list[dict]) -> float:
        com_x = []
        for f in frames:
            lh = self._lm(f, LEFT_HIP)
            rh = self._lm(f, RIGHT_HIP)
            if lh is not None and rh is not None:
                com_x.append((lh[0] + rh[0]) / 2)
        if len(com_x) < 2:
            return 0.0
        return round(float(np.std(com_x)), 4)

    def _measure_shoulder_symmetry(self, frames: list[dict]) -> float:
        diffs = []
        for f in frames:
            ls = self._lm(f, LEFT_SHOULDER)
            rs = self._lm(f, RIGHT_SHOULDER)
            if ls is not None and rs is not None:
                span = abs(ls[0] - rs[0]) + 1e-8
                diffs.append(abs(ls[1] - rs[1]) / span)
        if not diffs:
            return 0.0
        return round(float(np.mean(diffs)), 4)

    # ═══════════════════════════════════════════════════════════════
    # SQUAT
    # ═══════════════════════════════════════════════════════════════

    def _analyze_squat(self, frames: list[dict]) -> dict:
        left_knee_angles, right_knee_angles = [], []
        left_hip_angles, right_hip_angles = [], []
        trunk_angles, knee_valgus_series, ankle_x_series = [], [], []

        for f in frames:
            la = self._lm(f, LEFT_ANKLE)
            lk = self._lm(f, LEFT_KNEE)
            lh = self._lm(f, LEFT_HIP)
            ls = self._lm(f, LEFT_SHOULDER)
            ra = self._lm(f, RIGHT_ANKLE)
            rk = self._lm(f, RIGHT_KNEE)
            rh = self._lm(f, RIGHT_HIP)
            rs = self._lm(f, RIGHT_SHOULDER)

            if all(x is not None for x in [lh, lk, la]):
                left_knee_angles.append(self._joint_angle(lh, lk, la))
            if all(x is not None for x in [rh, rk, ra]):
                right_knee_angles.append(self._joint_angle(rh, rk, ra))
            if all(x is not None for x in [ls, lh, lk]):
                left_hip_angles.append(self._joint_angle(ls, lh, lk))
            if all(x is not None for x in [rs, rh, rk]):
                right_hip_angles.append(self._joint_angle(rs, rh, rk))

            ms = _midpoint(ls, rs)
            mh = _midpoint(lh, rh)
            if ms is not None and mh is not None:
                trunk_vec = ms - mh
                angle = abs(np.degrees(np.arctan2(trunk_vec[0], -trunk_vec[1])))
                trunk_angles.append(angle)

            if all(x is not None for x in [la, lk, lh]):
                knee_valgus_series.append(lk[0] - (la[0] + lh[0]) / 2)
            if all(x is not None for x in [ra, rk, rh]):
                knee_valgus_series.append((ra[0] + rh[0]) / 2 - rk[0])

            if la is not None:
                ankle_x_series.append(la[0])

        result = {}
        if left_knee_angles and right_knee_angles:
            all_knee = left_knee_angles + right_knee_angles
            result["knee_angle_min"] = round(float(np.min(all_knee)), 1)
            result["knee_angle_mean"] = round(float(np.mean(all_knee)), 1)
            min_knee = result["knee_angle_min"]
            if min_knee < 60:
                result["depth_quality"] = "deep"
            elif min_knee < 85:
                result["depth_quality"] = "parallel"
            elif min_knee < 100:
                result["depth_quality"] = "above_parallel"
            else:
                result["depth_quality"] = "shallow"

        if left_hip_angles and right_hip_angles:
            all_hip = left_hip_angles + right_hip_angles
            result["hip_angle_min"] = round(float(np.min(all_hip)), 1)
            result["hip_angle_mean"] = round(float(np.mean(all_hip)), 1)

        if trunk_angles:
            result["trunk_angle_mean"] = round(float(np.mean(trunk_angles)), 1)
            result["trunk_angle_max"] = round(float(np.max(trunk_angles)), 1)
            result["trunk_angle_min"] = round(float(np.min(trunk_angles)), 1)

        if knee_valgus_series:
            avg_v = np.mean(np.abs(knee_valgus_series))
            max_v = np.max(np.abs(knee_valgus_series))
            result["knee_valgus_avg"] = round(float(avg_v), 4)
            result["knee_valgus_max"] = round(float(max_v), 4)
            if max_v > 0.06:
                result["knee_valgus_severity"] = "significant"
            elif max_v > 0.03:
                result["knee_valgus_severity"] = "moderate"
            else:
                result["knee_valgus_severity"] = "minimal"

        if left_knee_angles and right_knee_angles:
            result["knee_asymmetry"] = round(
                abs(np.mean(left_knee_angles) - np.mean(right_knee_angles)), 1)

        if ankle_x_series and len(ankle_x_series) > 5:
            result["weight_stability"] = round(float(np.std(ankle_x_series)), 4)

        return result

    # ═══════════════════════════════════════════════════════════════
    # HINGE
    # ═══════════════════════════════════════════════════════════════

    def _analyze_hinge(self, frames: list[dict]) -> dict:
        hip_angles, trunk_angles, knee_angles = [], [], []
        wrist_hip_distances, shoulder_hip_distances = [], []

        for f in frames:
            ls = self._lm(f, LEFT_SHOULDER)
            rs = self._lm(f, RIGHT_SHOULDER)
            lh = self._lm(f, LEFT_HIP)
            rh = self._lm(f, RIGHT_HIP)
            lk = self._lm(f, LEFT_KNEE)
            rk = self._lm(f, RIGHT_KNEE)
            lw = self._lm(f, LEFT_WRIST)
            rw = self._lm(f, RIGHT_WRIST)
            la = self._lm(f, LEFT_ANKLE)
            ra = self._lm(f, RIGHT_ANKLE)

            ms = _midpoint(ls, rs)
            mh = _midpoint(lh, rh)
            mk = _midpoint(lk, rk)
            mw = _midpoint(lw, rw)

            if ms is not None and mh is not None and mk is not None:
                hip_angles.append(self._joint_angle(ms, mh, mk))
            if ms is not None and mh is not None:
                trunk_vec = ms - mh
                angle = abs(np.degrees(np.arctan2(trunk_vec[0], -trunk_vec[1])))
                trunk_angles.append(angle)
            if all(x is not None for x in [lh, lk, la]):
                knee_angles.append(self._joint_angle(lh, lk, la))
            if all(x is not None for x in [rh, rk, ra]):
                knee_angles.append(self._joint_angle(rh, rk, ra))
            if mw is not None and mh is not None:
                wrist_hip_distances.append(abs(mw[0] - mh[0]))
            if ms is not None and mh is not None:
                shoulder_hip_distances.append(np.linalg.norm(ms - mh))

        result = {}
        if hip_angles:
            result["hip_angle_min"] = round(float(np.min(hip_angles)), 1)
            result["hip_angle_mean"] = round(float(np.mean(hip_angles)), 1)
            result["hip_angle_range"] = round(float(np.max(hip_angles) - np.min(hip_angles)), 1)
        if trunk_angles:
            result["trunk_angle_max"] = round(float(np.max(trunk_angles)), 1)
            result["trunk_angle_mean"] = round(float(np.mean(trunk_angles)), 1)
        if knee_angles:
            result["knee_angle_mean"] = round(float(np.mean(knee_angles)), 1)
            result["knee_bend_consistency"] = round(float(np.std(knee_angles)), 1)
            knee_range = np.max(knee_angles) - np.min(knee_angles)
            result["knee_angle_range"] = round(float(knee_range), 1)
            if knee_range < 15:
                result["knee_stability"] = "excellent"
            elif knee_range < 30:
                result["knee_stability"] = "good"
            else:
                result["knee_stability"] = "poor"
        if wrist_hip_distances:
            result["bar_body_distance"] = round(float(np.mean(wrist_hip_distances)), 4)
            avg_dist = result["bar_body_distance"]
            if avg_dist < 0.04:
                result["bar_proximity"] = "excellent"
            elif avg_dist < 0.08:
                result["bar_proximity"] = "good"
            else:
                result["bar_proximity"] = "poor"
        if shoulder_hip_distances and len(shoulder_hip_distances) > 2:
            result["shoulder_hip_variation"] = round(float(np.std(shoulder_hip_distances)), 4)

        return result

    # ═══════════════════════════════════════════════════════════════
    # PUSH
    # ═══════════════════════════════════════════════════════════════

    def _analyze_push(self, frames: list[dict]) -> dict:
        elbow_angles, shoulder_angles = [], []
        wrist_x_series, elbow_flare_series = [], []

        for f in frames:
            ls = self._lm(f, LEFT_SHOULDER)
            rs = self._lm(f, RIGHT_SHOULDER)
            le = self._lm(f, LEFT_ELBOW)
            re = self._lm(f, RIGHT_ELBOW)
            lw = self._lm(f, LEFT_WRIST)
            rw = self._lm(f, RIGHT_WRIST)
            lh = self._lm(f, LEFT_HIP)
            rh = self._lm(f, RIGHT_HIP)

            if all(x is not None for x in [ls, le, lw]):
                elbow_angles.append(self._joint_angle(ls, le, lw))
            if all(x is not None for x in [rs, re, rw]):
                elbow_angles.append(self._joint_angle(rs, re, rw))
            if all(x is not None for x in [le, ls, lh]):
                shoulder_angles.append(self._joint_angle(le, ls, lh))
            if all(x is not None for x in [re, rs, rh]):
                shoulder_angles.append(self._joint_angle(re, rs, rh))
            if lw is not None:
                wrist_x_series.append(lw[0])
            if rw is not None:
                wrist_x_series.append(rw[0])
            if le is not None and ls is not None:
                elbow_flare_series.append(abs(le[0] - ls[0]))
            if re is not None and rs is not None:
                elbow_flare_series.append(abs(re[0] - rs[0]))

        result = {}
        if elbow_angles:
            result["elbow_angle_min"] = round(float(np.min(elbow_angles)), 1)
            result["elbow_angle_max"] = round(float(np.max(elbow_angles)), 1)
            result["elbow_angle_range"] = round(float(np.max(elbow_angles) - np.min(elbow_angles)), 1)
        if shoulder_angles:
            result["shoulder_abduction_mean"] = round(float(np.mean(shoulder_angles)), 1)
            avg_abd = result["shoulder_abduction_mean"]
            if avg_abd > 80:
                result["elbow_flare_risk"] = "high"
            elif avg_abd > 60:
                result["elbow_flare_risk"] = "moderate"
            else:
                result["elbow_flare_risk"] = "low"
        if wrist_x_series and len(wrist_x_series) > 5:
            result["bar_path_std"] = round(float(np.std(wrist_x_series)), 4)
            std_val = result["bar_path_std"]
            if std_val < 0.02:
                result["bar_path_quality"] = "excellent"
            elif std_val < 0.05:
                result["bar_path_quality"] = "good"
            else:
                result["bar_path_quality"] = "needs_work"
        if elbow_flare_series and len(elbow_flare_series) > 3:
            result["elbow_flare_consistency"] = round(float(np.std(elbow_flare_series)), 4)
        if elbow_angles:
            max_elbow = max(elbow_angles)
            result["lockout_max_angle"] = round(float(max_elbow), 1)
            if max_elbow > 160:
                result["lockout_quality"] = "full"
            elif max_elbow > 140:
                result["lockout_quality"] = "partial"
            else:
                result["lockout_quality"] = "incomplete"

        return result

    # ═══════════════════════════════════════════════════════════════
    # PULL
    # ═══════════════════════════════════════════════════════════════

    def _analyze_pull(self, frames: list[dict]) -> dict:
        elbow_angles, shoulder_angles = [], []
        body_swing_series, wrist_y_series = [], []

        for f in frames:
            ls = self._lm(f, LEFT_SHOULDER)
            rs = self._lm(f, RIGHT_SHOULDER)
            le = self._lm(f, LEFT_ELBOW)
            re = self._lm(f, RIGHT_ELBOW)
            lw = self._lm(f, LEFT_WRIST)
            rw = self._lm(f, RIGHT_WRIST)
            lh = self._lm(f, LEFT_HIP)
            rh = self._lm(f, RIGHT_HIP)

            if all(x is not None for x in [ls, le, lw]):
                elbow_angles.append(self._joint_angle(ls, le, lw))
            if all(x is not None for x in [rs, re, rw]):
                elbow_angles.append(self._joint_angle(rs, re, rw))
            if all(x is not None for x in [le, ls, lh]):
                shoulder_angles.append(self._joint_angle(le, ls, lh))
            mh = _midpoint(lh, rh)
            if mh is not None:
                body_swing_series.append(mh[0])
            mw = _midpoint(lw, rw)
            if mw is not None:
                wrist_y_series.append(mw[1])

        result = {}
        if elbow_angles:
            result["elbow_angle_max"] = round(float(np.max(elbow_angles)), 1)
            result["elbow_angle_min"] = round(float(np.min(elbow_angles)), 1)
            result["elbow_rom"] = round(float(np.max(elbow_angles) - np.min(elbow_angles)), 1)
        if shoulder_angles:
            result["shoulder_extension_max"] = round(float(np.max(shoulder_angles)), 1)
        if body_swing_series and len(body_swing_series) > 5:
            swing_std = float(np.std(body_swing_series))
            result["body_swing_std"] = round(swing_std, 4)
            if swing_std < 0.02:
                result["body_stability"] = "excellent"
            elif swing_std < 0.05:
                result["body_stability"] = "moderate"
            else:
                result["body_stability"] = "excessive_swing"
        if wrist_y_series and len(wrist_y_series) > 3:
            result["wrist_y_rom"] = round(float(np.max(wrist_y_series) - np.min(wrist_y_series)), 4)
        if shoulder_angles:
            result["scapular_retraction_range"] = round(
                float(np.max(shoulder_angles) - np.min(shoulder_angles)), 1)

        return result

    # ═══════════════════════════════════════════════════════════════
    # CORE
    # ═══════════════════════════════════════════════════════════════

    def _analyze_core(self, frames: list[dict]) -> dict:
        hip_y_series, shoulder_hip_angles, trunk_angles = [], [], []
        for f in frames:
            ls = self._lm(f, LEFT_SHOULDER)
            rs = self._lm(f, RIGHT_SHOULDER)
            lh = self._lm(f, LEFT_HIP)
            rh = self._lm(f, RIGHT_HIP)
            lk = self._lm(f, LEFT_KNEE)
            rk = self._lm(f, RIGHT_KNEE)
            mh = _midpoint(lh, rh)
            if mh is not None:
                hip_y_series.append(mh[1])
            ms = _midpoint(ls, rs)
            mk = _midpoint(lk, rk)
            if ms is not None and mh is not None and mk is not None:
                shoulder_hip_angles.append(self._joint_angle(ms, mh, mk))
            if ms is not None and mh is not None:
                trunk_vec = ms - mh
                angle = abs(np.degrees(np.arctan2(trunk_vec[0], -trunk_vec[1])))
                trunk_angles.append(angle)

        result = {}
        if hip_y_series and len(hip_y_series) > 5:
            hip_sag = float(np.std(hip_y_series))
            result["hip_sag_std"] = round(hip_sag, 4)
            if hip_sag < 0.02:
                result["core_stability"] = "excellent"
            elif hip_sag < 0.05:
                result["core_stability"] = "good"
            else:
                result["core_stability"] = "needs_work"
        if shoulder_hip_angles:
            result["body_line_angle"] = round(float(np.mean(shoulder_hip_angles)), 1)
            body_line = result["body_line_angle"]
            if body_line > 170:
                result["body_line_quality"] = "excellent"
            elif body_line > 155:
                result["body_line_quality"] = "good"
            else:
                result["body_line_quality"] = "poor"
        if trunk_angles:
            result["trunk_angle_mean"] = round(float(np.mean(trunk_angles)), 1)
            result["trunk_angle_std"] = round(float(np.std(trunk_angles)), 1)

        return result

    # ═══════════════════════════════════════════════════════════════
    # CARRY
    # ═══════════════════════════════════════════════════════════════

    def _analyze_carry(self, frames: list[dict]) -> dict:
        shoulder_y_series, hip_x_series, trunk_angles = [], [], []
        for f in frames:
            ls = self._lm(f, LEFT_SHOULDER)
            rs = self._lm(f, RIGHT_SHOULDER)
            lh = self._lm(f, LEFT_HIP)
            rh = self._lm(f, RIGHT_HIP)
            if ls is not None:
                shoulder_y_series.append(ls[1])
            if rs is not None:
                shoulder_y_series.append(rs[1])
            mh = _midpoint(lh, rh)
            if mh is not None:
                hip_x_series.append(mh[0])
            ms = _midpoint(ls, rs)
            if ms is not None and mh is not None:
                trunk_vec = ms - mh
                angle = abs(np.degrees(np.arctan2(trunk_vec[0], -trunk_vec[1])))
                trunk_angles.append(angle)

        result = {}
        if shoulder_y_series and len(shoulder_y_series) > 5:
            result["lateral_lean_std"] = round(float(np.std(shoulder_y_series)), 4)
        if hip_x_series and len(hip_x_series) > 5:
            result["walking_stability"] = round(float(np.std(hip_x_series)), 4)
        if trunk_angles:
            result["trunk_lean_mean"] = round(float(np.mean(trunk_angles)), 1)
            lean = result["trunk_lean_mean"]
            if lean < 10:
                result["posture_quality"] = "excellent"
            elif lean < 20:
                result["posture_quality"] = "good"
            else:
                result["posture_quality"] = "needs_work"

        return result

    # ═══════════════════════════════════════════════════════════════
    # ISOLATION
    # ═══════════════════════════════════════════════════════════════

    def _analyze_isolation(self, frames: list[dict], primary_joints: list[str]) -> dict:
        elbow_angles, shoulder_angles, body_sway = [], [], []
        for f in frames:
            le = self._lm(f, LEFT_ELBOW)
            re = self._lm(f, RIGHT_ELBOW)
            ls = self._lm(f, LEFT_SHOULDER)
            rs = self._lm(f, RIGHT_SHOULDER)
            lw = self._lm(f, LEFT_WRIST)
            rw = self._lm(f, RIGHT_WRIST)
            lh = self._lm(f, LEFT_HIP)
            rh = self._lm(f, RIGHT_HIP)
            if all(x is not None for x in [ls, le, lw]):
                elbow_angles.append(self._joint_angle(ls, le, lw))
            if all(x is not None for x in [rs, re, rw]):
                elbow_angles.append(self._joint_angle(rs, re, rw))
            if all(x is not None for x in [le, ls, lh]):
                shoulder_angles.append(self._joint_angle(le, ls, lh))
            mh = _midpoint(lh, rh)
            if mh is not None:
                body_sway.append(mh[0])

        result = {}
        if elbow_angles:
            result["elbow_angle_min"] = round(float(np.min(elbow_angles)), 1)
            result["elbow_angle_max"] = round(float(np.max(elbow_angles)), 1)
            result["elbow_rom"] = round(float(np.max(elbow_angles) - np.min(elbow_angles)), 1)
        if body_sway and len(body_sway) > 5:
            sway_std = float(np.std(body_sway))
            result["body_momentum_std"] = round(sway_std, 4)
            if sway_std < 0.01:
                result["isolation_quality"] = "excellent"
            elif sway_std < 0.03:
                result["isolation_quality"] = "good"
            else:
                result["isolation_quality"] = "poor"

        return result

    # ═══════════════════════════════════════════════════════════════
    # GENERAL (fallback)
    # ═══════════════════════════════════════════════════════════════

    def _analyze_general(self, frames: list[dict]) -> dict:
        trunk_angles, com_x, diffs = [], [], []
        for f in frames:
            ls = self._lm(f, LEFT_SHOULDER)
            rs = self._lm(f, RIGHT_SHOULDER)
            lh = self._lm(f, LEFT_HIP)
            rh = self._lm(f, RIGHT_HIP)
            ms = _midpoint(ls, rs)
            mh = _midpoint(lh, rh)
            if ms is not None and mh is not None:
                trunk_vec = ms - mh
                angle = abs(np.degrees(np.arctan2(trunk_vec[0], -trunk_vec[1])))
                trunk_angles.append(angle)
            if ls is not None and rs is not None:
                span = abs(ls[0] - rs[0]) + 1e-8
                diffs.append(abs(ls[1] - rs[1]) / span)
            if mh is not None:
                com_x.append(mh[0])

        result = {}
        if trunk_angles:
            result["trunk_angle_mean"] = round(float(np.mean(trunk_angles)), 1)
        if diffs:
            result["shoulder_diff_mean"] = round(float(np.mean(diffs)), 4)
        if com_x and len(com_x) > 1:
            result["com_x_std"] = round(float(np.std(com_x)), 4)
        return result

    # ═══════════════════════════════════════════════════════════════
    # UTILITY
    # ═══════════════════════════════════════════════════════════════

    @staticmethod
    def _joint_angle(a: np.ndarray, b: np.ndarray, c: np.ndarray) -> float:
        """Angle ABC where B is the vertex. Returns degrees (0-180)."""
        ba = a - b
        bc = c - b
        cosine = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-8)
        cosine = np.clip(cosine, -1.0, 1.0)
        return float(np.degrees(np.arccos(cosine)))
