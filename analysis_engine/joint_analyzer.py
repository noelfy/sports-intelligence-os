"""
Joint angle calculator — exercise-aware biomechanical angles.

Computes joint angles (in degrees) from 3D landmark positions,
with exercise-specific angle sets for each movement category.
"""

import numpy as np

from pose_estimation.landmark_definitions import (
    LEFT_SHOULDER, RIGHT_SHOULDER,
    LEFT_ELBOW, RIGHT_ELBOW,
    LEFT_WRIST, RIGHT_WRIST,
    LEFT_HIP, RIGHT_HIP,
    LEFT_KNEE, RIGHT_KNEE,
    LEFT_ANKLE, RIGHT_ANKLE,
    LEFT_EAR, RIGHT_EAR,
)


class JointAnalyzer:
    """Calculates joint angles — with exercise-specific angle sets."""

    @staticmethod
    def angle_between_three_points(
        a: np.ndarray, b: np.ndarray, c: np.ndarray
    ) -> float:
        """Angle ABC where B is the vertex. Returns degrees (0-180)."""
        ba = a - b
        bc = c - b
        cosine = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-8)
        cosine = np.clip(cosine, -1.0, 1.0)
        return float(np.degrees(np.arccos(cosine)))

    @staticmethod
    def _lm_to_xyz(landmark: dict) -> np.ndarray:
        """Convert landmark dict to numpy array."""
        return np.array([landmark["x"], landmark["y"], landmark.get("z", 0)])

    def get_joint_angles(self, landmarks: list[dict],
                         exercise_category: str = "general",
                         primary_joints: list[str] | None = None) -> dict[str, float]:
        """Get all relevant joint angles for a frame, based on exercise category.

        Args:
            landmarks: List of 33 MediaPipe landmark dicts.
            exercise_category: squat, hinge, push, pull, core, carry, isolation.
            primary_joints: Specific joints to focus on (from exercise context).

        Returns:
            Dict of angle_name -> degrees for all relevant joints.
        """
        pts = [self._lm_to_xyz(lm) for lm in landmarks]
        angles = {}

        # ── Universal angles (always computed) ──
        # Knees
        angles["right_knee"] = self.angle_between_three_points(
            pts[RIGHT_HIP], pts[RIGHT_KNEE], pts[RIGHT_ANKLE])
        angles["left_knee"] = self.angle_between_three_points(
            pts[LEFT_HIP], pts[LEFT_KNEE], pts[LEFT_ANKLE])

        # Hips
        angles["right_hip"] = self.angle_between_three_points(
            pts[RIGHT_SHOULDER], pts[RIGHT_HIP], pts[RIGHT_KNEE])
        angles["left_hip"] = self.angle_between_three_points(
            pts[LEFT_SHOULDER], pts[LEFT_HIP], pts[LEFT_KNEE])

        # Elbows
        angles["right_elbow"] = self.angle_between_three_points(
            pts[RIGHT_SHOULDER], pts[RIGHT_ELBOW], pts[RIGHT_WRIST])
        angles["left_elbow"] = self.angle_between_three_points(
            pts[LEFT_SHOULDER], pts[LEFT_ELBOW], pts[LEFT_WRIST])

        # Shoulders
        angles["right_shoulder"] = self.angle_between_three_points(
            pts[RIGHT_ELBOW], pts[RIGHT_SHOULDER], pts[RIGHT_HIP])
        angles["left_shoulder"] = self.angle_between_three_points(
            pts[LEFT_ELBOW], pts[LEFT_SHOULDER], pts[LEFT_HIP])

        # Trunk inclination from vertical
        mid_shoulder = (pts[LEFT_SHOULDER] + pts[RIGHT_SHOULDER]) / 2
        mid_hip = (pts[LEFT_HIP] + pts[RIGHT_HIP]) / 2
        vertical = np.array([mid_shoulder[0], mid_shoulder[1] - 1.0, mid_shoulder[2]])
        angles["trunk_inclination"] = self.angle_between_three_points(
            mid_hip, mid_shoulder, vertical)

        # Symmetry
        angles["knee_symmetry"] = abs(angles["right_knee"] - angles["left_knee"])
        angles["hip_symmetry"] = abs(angles["right_hip"] - angles["left_hip"])
        angles["elbow_symmetry"] = abs(angles["right_elbow"] - angles["left_elbow"])
        angles["shoulder_symmetry"] = abs(angles["right_shoulder"] - angles["left_shoulder"])

        # ── Category-specific angles ──
        if exercise_category == "squat":
            angles.update(self._squat_angles(pts))
        elif exercise_category == "hinge":
            angles.update(self._hinge_angles(pts))
        elif exercise_category == "push":
            angles.update(self._push_angles(pts))
        elif exercise_category == "pull":
            angles.update(self._pull_angles(pts))
        elif exercise_category == "core":
            angles.update(self._core_angles(pts))
        elif exercise_category == "carry":
            angles.update(self._carry_angles(pts))

        return angles

    # ── Category-specific angle sets ──

    def _squat_angles(self, pts: list[np.ndarray]) -> dict:
        """Squat-specific angles: knee tracking, ankle mobility, hip depth."""
        mid_shoulder = (pts[LEFT_SHOULDER] + pts[RIGHT_SHOULDER]) / 2
        mid_hip = (pts[LEFT_HIP] + pts[RIGHT_HIP]) / 2

        angles = {}

        # Knee valgus proxy: angle between ankle-knee line and vertical
        for side, la_idx, lk_idx in [("right", RIGHT_ANKLE, RIGHT_KNEE),
                                       ("left", LEFT_ANKLE, LEFT_KNEE)]:
            ankle = pts[la_idx]
            knee = pts[lk_idx]
            shin_vec = knee - ankle
            # Vertical line at ankle x-position
            vert = np.array([ankle[0], ankle[1] - 1.0, ankle[2]])
            angles[f"{side}_knee_tracking"] = self.angle_between_three_points(
                vert, ankle, knee)

        # Ankle dorsiflexion (knee over toe): hip-knee-ankle + knee-ankle-toe approximation
        for side, lh_idx, lk_idx, la_idx in [
            ("right", RIGHT_HIP, RIGHT_KNEE, RIGHT_ANKLE),
            ("left", LEFT_HIP, LEFT_KNEE, LEFT_ANKLE)]:
            angles[f"{side}_ankle_dorsiflexion"] = self.angle_between_three_points(
                pts[lh_idx], pts[lk_idx], pts[la_idx])

        # Hip depth: angle between trunk and thigh
        angles["hip_depth_right"] = self.angle_between_three_points(
            mid_shoulder, mid_hip, pts[RIGHT_KNEE])
        angles["hip_depth_left"] = self.angle_between_three_points(
            mid_shoulder, mid_hip, pts[LEFT_KNEE])

        return angles

    def _hinge_angles(self, pts: list[np.ndarray]) -> dict:
        """Hinge-specific angles: back flatness, hip hinge quality."""
        mid_shoulder = (pts[LEFT_SHOULDER] + pts[RIGHT_SHOULDER]) / 2
        mid_hip = (pts[LEFT_HIP] + pts[RIGHT_HIP]) / 2
        mid_wrist = (pts[LEFT_WRIST] + pts[RIGHT_WRIST]) / 2
        mid_knee = (pts[LEFT_KNEE] + pts[RIGHT_KNEE]) / 2
        mid_ankle = (pts[LEFT_ANKLE] + pts[RIGHT_ANKLE]) / 2

        angles = {}

        # Hip hinge angle: shoulder-hip-knee (smaller = deeper hinge)
        angles["hip_hinge_angle"] = self.angle_between_three_points(
            mid_shoulder, mid_hip, mid_knee)

        # Spine angle: shoulder-hip relative to vertical (for back flatness)
        # Compare mid-shoulder to mid-hip vector vs vertical
        trunk_vec = mid_shoulder - mid_hip
        vertical = np.array([trunk_vec[0], -1.0, trunk_vec[2]])
        angles["spine_angle_from_vertical"] = self.angle_between_three_points(
            mid_hip, mid_shoulder,
            np.array([mid_shoulder[0], mid_shoulder[1] - 1.0, mid_shoulder[2]]))

        # Bar-to-body distance proxy: wrist-hip horizontal offset
        angles["bar_hip_horizontal_offset"] = abs(mid_wrist[0] - mid_hip[0])

        # Knee bend (should stay nearly constant in pure hinge)
        angles["hinge_knee_angle"] = self.angle_between_three_points(
            mid_hip, mid_knee, mid_ankle)

        return angles

    def _push_angles(self, pts: list[np.ndarray]) -> dict:
        """Push-specific angles: elbow flare, bar path, lockout."""
        angles = {}

        # Elbow flare: horizontal abduction at shoulder
        for side, le_idx, ls_idx, lh_idx in [
            ("right", RIGHT_ELBOW, RIGHT_SHOULDER, RIGHT_HIP),
            ("left", LEFT_ELBOW, LEFT_SHOULDER, LEFT_HIP)]:
            # How far elbow is from the torso line (shoulder-hip)
            shoulder = pts[ls_idx]
            elbow = pts[le_idx]
            hip = pts[lh_idx]
            # Elbow abduction: deviation from sagittal plane
            angles[f"{side}_elbow_abduction"] = self.angle_between_three_points(
                elbow, shoulder, hip)

        # Wrist alignment: for bench/OHP, wrist should be stacked over elbow
        for side, ls_idx, le_idx, lw_idx in [
            ("right", RIGHT_SHOULDER, RIGHT_ELBOW, RIGHT_WRIST),
            ("left", LEFT_SHOULDER, LEFT_ELBOW, LEFT_WRIST)]:
            angles[f"{side}_wrist_alignment"] = self.angle_between_three_points(
                pts[ls_idx], pts[le_idx], pts[lw_idx])

        return angles

    def _pull_angles(self, pts: list[np.ndarray]) -> dict:
        """Pull-specific angles: scapular retraction, elbow drive."""
        angles = {}

        # Scapular retraction: shoulder position relative to spine
        mid_shoulder = (pts[LEFT_SHOULDER] + pts[RIGHT_SHOULDER]) / 2
        mid_hip = (pts[LEFT_HIP] + pts[RIGHT_HIP]) / 2

        for side, ls_idx in [("right", RIGHT_SHOULDER), ("left", LEFT_SHOULDER)]:
            # How retracted the shoulder is (distance from midline)
            angles[f"{side}_scapular_position"] = abs(pts[ls_idx][0] - mid_shoulder[0])

        # Elbow drive: elbow position relative to torso during pull
        for side, le_idx, ls_idx in [("right", RIGHT_ELBOW, RIGHT_SHOULDER),
                                       ("left", LEFT_ELBOW, LEFT_SHOULDER)]:
            angles[f"{side}_elbow_drive"] = self.angle_between_three_points(
                pts[le_idx], pts[ls_idx], mid_hip)

        return angles

    def _core_angles(self, pts: list[np.ndarray]) -> dict:
        """Core-specific angles: body line straightness."""
        mid_shoulder = (pts[LEFT_SHOULDER] + pts[RIGHT_SHOULDER]) / 2
        mid_hip = (pts[LEFT_HIP] + pts[RIGHT_HIP]) / 2
        mid_knee = (pts[LEFT_KNEE] + pts[RIGHT_KNEE]) / 2
        mid_ankle = (pts[LEFT_ANKLE] + pts[RIGHT_ANKLE]) / 2

        angles = {}

        # Body line: shoulder-hip-knee (180° = perfect plank line)
        angles["body_line_shoulder_hip_knee"] = self.angle_between_three_points(
            mid_shoulder, mid_hip, mid_knee)

        # Hip-ankle alignment: hip-knee-ankle
        angles["body_line_hip_knee_ankle"] = self.angle_between_three_points(
            mid_hip, mid_knee, mid_ankle)

        # Full body line: shoulder-hip-ankle
        angles["full_body_line"] = self.angle_between_three_points(
            mid_shoulder, mid_hip, mid_ankle)

        return angles

    def _carry_angles(self, pts: list[np.ndarray]) -> dict:
        """Carry-specific angles: lateral symmetry, shoulder pack."""
        angles = {}

        # Shoulder pack: are shoulders elevated (shrugged) or packed down?
        for side, ls_idx, le_idx in [("right", RIGHT_SHOULDER, RIGHT_ELBOW),
                                       ("left", LEFT_SHOULDER, LEFT_ELBOW)]:
            # Shoulder elevation: vertical position relative to ear
            angles[f"{side}_shoulder_elevation"] = abs(
                pts[ls_idx][1] - pts[LEFT_EAR if side == "left" else RIGHT_EAR][1])

        return angles

    def get_all_frame_angles(
        self, frames_data: list[dict],
        exercise_category: str = "general",
        primary_joints: list[str] | None = None,
    ) -> list[dict | None]:
        """Compute joint angles for every detected frame.

        Args:
            frames_data: List of per-frame data dicts.
            exercise_category: Category for exercise-specific angles.
            primary_joints: Focus joints from exercise context.

        Returns:
            List of angle dicts per frame, or None for frames without pose.
        """
        results = []
        for frame in frames_data:
            if not frame.get("detected") or not frame.get("landmarks"):
                results.append(None)
                continue
            try:
                angles = self.get_joint_angles(
                    frame["landmarks"],
                    exercise_category=exercise_category,
                    primary_joints=primary_joints,
                )
                results.append(angles)
            except (IndexError, KeyError):
                results.append(None)
        return results
