"""
Analysis service — bridges FastAPI to the analysis engine.

Runs exercise-aware movement analysis on keypoint data with
category-specific metrics, observations, and joint angles.
"""

import json
import os
import asyncio
import numpy as np

from analysis_engine.joint_analyzer import JointAnalyzer
from analysis_engine.movement_analyzer import MovementAnalyzer
from analysis_engine.quality_evaluator import ObservationExtractor


class AnalysisService:
    """Runs exercise-aware movement analysis on processed keypoint data."""

    def __init__(self, sport: str = "general"):
        self.sport = sport
        self.joint_analyzer = JointAnalyzer()
        self.movement_analyzer = MovementAnalyzer()
        self.observation_extractor = ObservationExtractor(sport=sport)

    async def analyze(self, analysis_id: str, sport: str | None = None) -> dict:
        """Analyze movement with exercise-specific biomechanics.

        Args:
            analysis_id: Unique analysis ID.
            sport: Exercise ID (e.g., "barbell-squats", "power-clean").

        Returns:
            Dict with observations, focus_areas, joint_angles, and metrics.
        """
        effective_sport = sport or self.sport

        # Load exercise context for category-specific analysis
        exercise_context = self._load_exercise_context(effective_sport)

        keypoints_path = os.path.join("data", "output", analysis_id, "keypoints.json")

        if not os.path.exists(keypoints_path):
            raise FileNotFoundError(f"Keypoints file not found: {keypoints_path}")

        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None, self._run_analysis, keypoints_path, exercise_context
        )
        return result

    async def analyze_3d(self, analysis_id: str, sport: str | None = None) -> dict:
        """Run 3D movement analysis on triangulated keypoint data.

        Loads keypoints_3d.json (world-space coordinates) and runs
        MovementAnalyzer in 3D mode for richer biomechanical metrics.
        """
        effective_sport = sport or self.sport
        exercise_context = self._load_exercise_context(effective_sport)

        keypoints_path = os.path.join("data", "output", analysis_id, "keypoints_3d.json")

        if not os.path.exists(keypoints_path):
            raise FileNotFoundError(f"3D keypoints file not found: {keypoints_path}")

        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None, self._run_analysis_3d, keypoints_path, exercise_context
        )
        return result

    def _load_exercise_context(self, exercise_id: str) -> dict | None:
        """Load exercise context from exercise_context module."""
        try:
            from backend.services.exercise_context import get_exercise_context
            ctx = get_exercise_context(exercise_id)
            return {
                "exercise_id": ctx.exercise_id,
                "exercise_name": ctx.exercise_name,
                "category": ctx.category,
                "correct_form": ctx.correct_form,
                "common_mistakes": ctx.common_mistakes,
                "coaching_cues": ctx.coaching_cues,
                "phase_names": ctx.phase_names,
                "primary_joints": ctx.primary_joints,
                "thresholds": ctx.thresholds,
                "key_frame_strategy": ctx.key_frame_strategy,
            }
        except (ImportError, AttributeError):
            return None

    def _run_analysis(self, keypoints_path: str,
                      exercise_context: dict | None = None) -> dict:
        """Synchronous analysis (runs in thread pool)."""
        with open(keypoints_path, encoding="utf-8") as f:
            data = json.load(f)

        frames = data.get("frames", [])
        valid_frames = [f for f in frames if f.get("detected")]

        category = exercise_context.get("category", "general") if exercise_context else "general"
        exercise_name = exercise_context.get("exercise_name", "movement") if exercise_context else "movement"
        primary_joints = exercise_context.get("primary_joints", []) if exercise_context else []

        if not valid_frames:
            return {
                "error": "No pose detected in any frame",
                "observations": [],
                "focus_areas": ["Improve video quality — no pose was detected"],
                "summary": "Could not detect any body movement in the video.",
                "total_frames_analyzed": 0,
            }

        # Step 1: Compute category-specific biomechanical metrics
        metrics = self.movement_analyzer.analyze(
            valid_frames, category=category, primary_joints=primary_joints
        )

        # Step 2: Extract exercise-aware qualitative observations
        evaluation = self.observation_extractor.evaluate(
            metrics, sport=exercise_name, exercise_context=exercise_context
        )

        # Step 3: Get exercise-specific joint angles at the key frame
        key_frame = self._find_key_frame(valid_frames, exercise_context)
        joint_angles = {}
        if key_frame:
            joint_angles = self.joint_analyzer.get_joint_angles(
                key_frame["landmarks"],
                exercise_category=category,
                primary_joints=primary_joints,
            )

        # Step 4: Compute overall score from metrics and observations
        overall_score = self._compute_overall_score(
            metrics, evaluation.get("observations", []), category
        )

        result = {
            "observations": evaluation.get("observations", []),
            "focus_areas": evaluation.get("focus_areas", []),
            "phase_findings": evaluation.get("phase_findings", []),
            "summary": evaluation.get("summary", ""),
            "overall_score": overall_score,
            "metrics": metrics,
            "joint_angles_keyframe": joint_angles,
            "total_frames_analyzed": len(valid_frames),
            "category": category,
            "exercise_name": exercise_name,
        }

        # Save analysis result
        output_dir = os.path.dirname(keypoints_path)
        analysis_path = os.path.join(output_dir, "analysis.json")
        with open(analysis_path, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2, ensure_ascii=False)

        return result

    def _run_analysis_3d(self, keypoints_path: str,
                          exercise_context: dict | None = None) -> dict:
        """Synchronous 3D analysis (runs in thread pool)."""
        with open(keypoints_path, encoding="utf-8") as f:
            data = json.load(f)

        frames = data.get("frames", [])
        valid_frames = [f for f in frames if f.get("detected")]

        category = exercise_context.get("category", "general") if exercise_context else "general"
        exercise_name = exercise_context.get("exercise_name", "movement") if exercise_context else "movement"
        primary_joints = exercise_context.get("primary_joints", []) if exercise_context else []

        if not valid_frames:
            return {
                "error": "No pose detected in any frame",
                "observations": [],
                "focus_areas": ["Improve video quality — no pose was detected"],
                "summary": "Could not detect any body movement in the video.",
                "total_frames_analyzed": 0,
            }

        # Step 1: Compute 3D category-specific biomechanical metrics
        metrics = self.movement_analyzer.analyze(
            valid_frames, category=category, primary_joints=primary_joints,
            use_3d=True
        )

        # Step 2: Extract 3D-aware qualitative observations
        evaluation = self.observation_extractor.evaluate(
            metrics, sport=exercise_name, exercise_context=exercise_context
        )

        # Step 3: Get 3D joint angles at key frame
        key_frame = self._find_key_frame(valid_frames, exercise_context)
        joint_angles = {}
        if key_frame:
            joint_angles = self.joint_analyzer.get_joint_angles(
                key_frame["landmarks"],
                exercise_category=category,
                primary_joints=primary_joints,
            )

        # Step 4: Compute overall score
        overall_score = self._compute_overall_score(
            metrics, evaluation.get("observations", []), category
        )

        result = {
            "observations": evaluation.get("observations", []),
            "focus_areas": evaluation.get("focus_areas", []),
            "phase_findings": evaluation.get("phase_findings", []),
            "summary": evaluation.get("summary", ""),
            "overall_score": overall_score,
            "metrics": metrics,
            "joint_angles_keyframe": joint_angles,
            "total_frames_analyzed": len(valid_frames),
            "category": category,
            "exercise_name": exercise_name,
            "is_3d": True,
        }

        output_dir = os.path.dirname(keypoints_path)
        analysis_path = os.path.join(output_dir, "analysis.json")
        with open(analysis_path, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2, ensure_ascii=False)

        return result

    # ═══════════════════════════════════════════════════════════════
    # KEY FRAME DETECTION
    # ═══════════════════════════════════════════════════════════════

    def _find_key_frame(self, frames: list[dict],
                        exercise_context: dict | None = None) -> dict | None:
        """Find the key frame based on exercise type and strategy."""
        if not frames:
            return None

        strategy = "lowest_hip"
        if exercise_context:
            strategy = exercise_context.get("key_frame_strategy", "lowest_hip")
            category = exercise_context.get("category", "general")
            if strategy == "lowest_hip" and category == "push":
                strategy = "highest_wrist"

        strategy_map = {
            "lowest_hip": self._frame_with_lowest_hip,
            "highest_wrist": self._frame_with_highest_wrist,
            "lowest_bar": self._frame_with_lowest_wrist,
            "lowest_wrist": self._frame_with_lowest_wrist,
            "peak_knee_flexion": self._frame_with_peak_knee_flexion,
            "peak_hip_flexion": self._frame_with_peak_hip_flexion,
            "peak_hip_extension": self._frame_with_peak_hip_extension,
            "peak_elbow_flexion": self._frame_with_peak_elbow_flexion,
            "peak_shoulder_abduction": self._frame_with_peak_shoulder_abduction,
            "lowest_chest": self._frame_with_lowest_chest,
            "lowest_shoulder": self._frame_with_lowest_shoulder,
            "peak_extension": self._frame_with_peak_extension,
            "peak_arm_abduction": self._frame_with_peak_shoulder_abduction,
        }

        finder = strategy_map.get(strategy, lambda fs: fs[len(fs) // 2])
        return finder(frames)

    def _frame_with_lowest_hip(self, frames):
        best_frame, best_y = frames[0], 0.0
        for f in frames:
            lms = f.get("landmarks", [])
            if len(lms) > 24:
                hip_y = (lms[23].get("y", 0) + lms[24].get("y", 0)) / 2
                if hip_y > best_y:
                    best_y = hip_y
                    best_frame = f
        return best_frame

    def _frame_with_highest_wrist(self, frames):
        best_frame, best_y = frames[0], 1.0
        for f in frames:
            lms = f.get("landmarks", [])
            if len(lms) > 16:
                wrist_y = min(lms[15].get("y", 1.0), lms[16].get("y", 1.0))
                if wrist_y < best_y:
                    best_y = wrist_y
                    best_frame = f
        return best_frame

    def _frame_with_lowest_wrist(self, frames):
        best_frame, best_y = frames[0], 0.0
        for f in frames:
            lms = f.get("landmarks", [])
            if len(lms) > 16:
                wrist_y = max(lms[15].get("y", 0), lms[16].get("y", 0))
                if wrist_y > best_y:
                    best_y = wrist_y
                    best_frame = f
        return best_frame

    def _frame_with_peak_knee_flexion(self, frames):
        best_frame, best_angle = frames[0], 180.0
        for f in frames:
            lms = f.get("landmarks", [])
            if len(lms) > 26:
                try:
                    lh = np.array([lms[23]["x"], lms[23]["y"]])
                    lk = np.array([lms[25]["x"], lms[25]["y"]])
                    la = np.array([lms[27]["x"], lms[27]["y"]])
                    ba, bc = lh - lk, la - lk
                    cos = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-8)
                    angle = float(np.degrees(np.arccos(np.clip(cos, -1.0, 1.0))))
                    if angle < best_angle:
                        best_angle = angle
                        best_frame = f
                except (KeyError, IndexError):
                    continue
        return best_frame

    def _frame_with_peak_hip_flexion(self, frames):
        best_frame, best_angle = frames[0], 180.0
        for f in frames:
            lms = f.get("landmarks", [])
            if len(lms) > 24:
                try:
                    ls = np.array([lms[11]["x"], lms[11]["y"]])
                    lh = np.array([lms[23]["x"], lms[23]["y"]])
                    lk = np.array([lms[25]["x"], lms[25]["y"]])
                    ba, bc = ls - lh, lk - lh
                    cos = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-8)
                    angle = float(np.degrees(np.arccos(np.clip(cos, -1.0, 1.0))))
                    if angle < best_angle:
                        best_angle = angle
                        best_frame = f
                except (KeyError, IndexError):
                    continue
        return best_frame

    def _frame_with_peak_hip_extension(self, frames):
        best_frame, best_angle = frames[0], 0.0
        for f in frames:
            lms = f.get("landmarks", [])
            if len(lms) > 24:
                try:
                    ls = np.array([lms[11]["x"], lms[11]["y"]])
                    lh = np.array([lms[23]["x"], lms[23]["y"]])
                    lk = np.array([lms[25]["x"], lms[25]["y"]])
                    ba, bc = ls - lh, lk - lh
                    cos = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-8)
                    angle = float(np.degrees(np.arccos(np.clip(cos, -1.0, 1.0))))
                    if angle > best_angle:
                        best_angle = angle
                        best_frame = f
                except (KeyError, IndexError):
                    continue
        return best_frame

    def _frame_with_peak_elbow_flexion(self, frames):
        best_frame, best_angle = frames[0], 180.0
        for f in frames:
            lms = f.get("landmarks", [])
            if len(lms) > 16:
                try:
                    ls = np.array([lms[11]["x"], lms[11]["y"]])
                    le = np.array([lms[13]["x"], lms[13]["y"]])
                    lw = np.array([lms[15]["x"], lms[15]["y"]])
                    ba, bc = ls - le, lw - le
                    cos = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-8)
                    angle = float(np.degrees(np.arccos(np.clip(cos, -1.0, 1.0))))
                    if angle < best_angle:
                        best_angle = angle
                        best_frame = f
                except (KeyError, IndexError):
                    continue
        return best_frame

    def _frame_with_peak_shoulder_abduction(self, frames):
        best_frame, best_angle = frames[0], 0.0
        for f in frames:
            lms = f.get("landmarks", [])
            if len(lms) > 14:
                try:
                    le = np.array([lms[13]["x"], lms[13]["y"]])
                    ls = np.array([lms[11]["x"], lms[11]["y"]])
                    lh = np.array([lms[23]["x"], lms[23]["y"]])
                    ba, bc = le - ls, lh - ls
                    cos = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-8)
                    angle = float(np.degrees(np.arccos(np.clip(cos, -1.0, 1.0))))
                    if angle > best_angle:
                        best_angle = angle
                        best_frame = f
                except (KeyError, IndexError):
                    continue
        return best_frame

    def _frame_with_lowest_chest(self, frames):
        best_frame, best_y = frames[0], 0.0
        for f in frames:
            lms = f.get("landmarks", [])
            if len(lms) > 12:
                shoulder_y = (lms[11].get("y", 0) + lms[12].get("y", 0)) / 2
                if shoulder_y > best_y:
                    best_y = shoulder_y
                    best_frame = f
        return best_frame

    def _frame_with_lowest_shoulder(self, frames):
        best_frame, best_y = frames[0], 0.0
        for f in frames:
            lms = f.get("landmarks", [])
            if len(lms) > 12:
                shoulder_y = max(lms[11].get("y", 0), lms[12].get("y", 0))
                if shoulder_y > best_y:
                    best_y = shoulder_y
                    best_frame = f
        return best_frame

    def _frame_with_peak_extension(self, frames):
        best_frame, best_dist = frames[0], 0.0
        for f in frames:
            lms = f.get("landmarks", [])
            if len(lms) > 28:
                try:
                    lw = np.array([lms[15]["x"], lms[15]["y"]])
                    ra = np.array([lms[28]["x"], lms[28]["y"]])
                    dist = np.linalg.norm(lw - ra)
                    if dist > best_dist:
                        best_dist = dist
                        best_frame = f
                except (KeyError, IndexError):
                    continue
        return best_frame

    # ═══════════════════════════════════════════════════════════════
    # OVERALL SCORE COMPUTATION
    # ═══════════════════════════════════════════════════════════════

    def _compute_overall_score(self, metrics: dict, observations: list[dict],
                                category: str) -> float:
        """Compute a meaningful 0-100 overall score from category-specific metrics.

        Each category has different ideal ranges. Scores start at 70 (baseline)
        and are adjusted by how close metrics are to their ideal values, plus
        observation-based bonuses/penalties.
        """
        if not metrics or "error" in metrics:
            return 0.0

        score = 70.0  # baseline — average form

        # ── Category-specific metric scoring ──
        if category == "squat":
            score += self._score_squat(metrics)
        elif category == "hinge":
            score += self._score_hinge(metrics)
        elif category == "push":
            score += self._score_push(metrics)
        elif category == "pull":
            score += self._score_pull(metrics)
        elif category == "core":
            score += self._score_core(metrics)
        elif category == "carry":
            score += self._score_carry(metrics)
        elif category == "isolation":
            score += self._score_isolation(metrics)
        else:
            score += self._score_general(metrics)

        # ── Universal metric adjustments ──
        balance_std = metrics.get("balance_std", 0.05)
        if balance_std < 0.03:
            score += 5
        elif balance_std > 0.08:
            score -= 8

        shoulder_sym = metrics.get("shoulder_symmetry", 0.1)
        if shoulder_sym < 0.05:
            score += 3
        elif shoulder_sym > 0.2:
            score -= 6

        # ── Observation-based adjustments ──
        for obs in observations:
            severity = obs.get("severity", "info")
            if severity == "positive":
                score += 3
            elif severity == "critical":
                score -= 10
            elif severity == "warning":
                score -= 5

        return round(max(0.0, min(100.0, score)), 1)

    # ── Per-category scorers ──

    def _score_squat(self, m: dict) -> float:
        s = 0.0
        # Depth quality
        dq = m.get("depth_quality", "")
        if dq == "deep": s += 8
        elif dq == "parallel": s += 5
        elif dq == "above_parallel": s -= 3
        elif dq == "shallow": s -= 10
        # Knee valgus
        kv = m.get("knee_valgus_severity", "")
        if kv == "minimal": s += 6
        elif kv == "moderate": s -= 4
        elif kv == "significant": s -= 10
        # Knee asymmetry
        asym = m.get("knee_asymmetry", 5)
        if asym < 3: s += 4
        elif asym > 10: s -= 7
        # Trunk angle
        ta = m.get("trunk_angle_mean", 30)
        if 15 < ta < 40: s += 3
        elif ta > 55: s -= 6
        # Weight stability
        ws = m.get("weight_stability", 0.03)
        if ws < 0.03: s += 3
        elif ws > 0.07: s -= 5
        return s

    def _score_hinge(self, m: dict) -> float:
        s = 0.0
        # Hip angle range
        hr = m.get("hip_angle_range", 40)
        if hr > 60: s += 6
        elif hr > 35: s += 3
        elif hr < 20: s -= 5
        # Bar proximity
        bp = m.get("bar_proximity", "")
        if bp == "excellent": s += 6
        elif bp == "good": s += 3
        elif bp == "poor": s -= 7
        # Knee stability
        ks = m.get("knee_stability", "")
        if ks == "excellent": s += 5
        elif ks == "good": s += 2
        elif ks == "poor": s -= 6
        # Trunk angle
        ta = m.get("trunk_angle_max", 60)
        if 45 < ta < 80: s += 2
        elif ta < 30 or ta > 90: s -= 4
        return s

    def _score_push(self, m: dict) -> float:
        s = 0.0
        # Bar path quality
        bp = m.get("bar_path_quality", "")
        if bp == "excellent": s += 7
        elif bp == "good": s += 3
        elif bp == "needs_work": s -= 6
        # Elbow flare risk
        ef = m.get("elbow_flare_risk", "")
        if ef == "low": s += 5
        elif ef == "moderate": s -= 3
        elif ef == "high": s -= 8
        # Lockout quality
        lq = m.get("lockout_quality", "")
        if lq == "full": s += 5
        elif lq == "partial": s += 1
        elif lq == "incomplete": s -= 5
        # Elbow ROM
        er = m.get("elbow_angle_range", 60)
        if er > 80: s += 4
        elif er > 50: s += 2
        elif er < 30: s -= 4
        return s

    def _score_pull(self, m: dict) -> float:
        s = 0.0
        # Body stability
        bs = m.get("body_stability", "")
        if bs == "excellent": s += 7
        elif bs == "moderate": s += 2
        elif bs == "excessive_swing": s -= 8
        # Elbow ROM
        er = m.get("elbow_rom", 40)
        if er > 60: s += 5
        elif er > 35: s += 2
        elif er < 20: s -= 5
        # Scapular retraction
        sr = m.get("scapular_retraction_range", 20)
        if sr > 30: s += 3
        elif sr < 10: s -= 3
        return s

    def _score_core(self, m: dict) -> float:
        s = 0.0
        # Core stability
        cs = m.get("core_stability", "")
        if cs == "excellent": s += 8
        elif cs == "good": s += 4
        elif cs == "needs_work": s -= 8
        # Body line quality
        bl = m.get("body_line_quality", "")
        if bl == "excellent": s += 6
        elif bl == "good": s += 3
        elif bl == "poor": s -= 7
        # Trunk angle std
        ts = m.get("trunk_angle_std", 5)
        if ts < 3: s += 3
        elif ts > 10: s -= 4
        return s

    def _score_carry(self, m: dict) -> float:
        s = 0.0
        # Posture quality
        pq = m.get("posture_quality", "")
        if pq == "excellent": s += 7
        elif pq == "good": s += 3
        elif pq == "needs_work": s -= 7
        # Lateral lean
        ll = m.get("lateral_lean_std", 0.03)
        if ll < 0.02: s += 4
        elif ll > 0.06: s -= 6
        # Walking stability
        ws = m.get("walking_stability", 0.03)
        if ws < 0.02: s += 4
        elif ws > 0.06: s -= 5
        return s

    def _score_isolation(self, m: dict) -> float:
        s = 0.0
        # Isolation quality
        iq = m.get("isolation_quality", "")
        if iq == "excellent": s += 8
        elif iq == "good": s += 4
        elif iq == "poor": s -= 8
        # Elbow ROM
        er = m.get("elbow_rom", 30)
        if er > 50: s += 5
        elif er > 25: s += 2
        elif er < 15: s -= 5
        # Body momentum
        bm = m.get("body_momentum_std", 0.02)
        if bm < 0.01: s += 4
        elif bm > 0.04: s -= 6
        return s

    def _score_general(self, m: dict) -> float:
        s = 0.0
        ta = m.get("trunk_angle_mean", 20)
        if ta < 15: s += 3
        elif ta > 35: s -= 4
        sd = m.get("shoulder_diff_mean", 0.08)
        if sd < 0.05: s += 3
        elif sd > 0.15: s -= 5
        cx = m.get("com_x_std", 0.04)
        if cx < 0.03: s += 4
        elif cx > 0.08: s -= 6
        return s
