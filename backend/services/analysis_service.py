"""
Analysis service — bridges FastAPI to the analysis engine.

Runs movement analysis on keypoint data in a thread pool executor.
"""

import json
import os
import asyncio

from analysis_engine.joint_analyzer import JointAnalyzer
from analysis_engine.movement_analyzer import MovementAnalyzer
from analysis_engine.quality_evaluator import QualityEvaluator


class AnalysisService:
    """Runs movement analysis on processed keypoint data."""

    def __init__(self, sport: str = "volleyball"):
        self.sport = sport
        self.joint_analyzer = JointAnalyzer()
        self.movement_analyzer = MovementAnalyzer()
        self.quality_evaluator = QualityEvaluator(sport=sport)

    async def analyze(self, analysis_id: str) -> dict:
        """Analyze movement from saved keypoint data.

        Args:
            analysis_id: Unique analysis ID.

        Returns:
            Dict with metrics, evaluation, and joint analysis.
        """
        keypoints_path = os.path.join(
            "data", "output", analysis_id, "keypoints.json"
        )

        if not os.path.exists(keypoints_path):
            raise FileNotFoundError(f"Keypoints file not found: {keypoints_path}")

        # Run CPU-bound analysis in thread pool
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, self._run_analysis, keypoints_path)
        return result

    def _run_analysis(self, keypoints_path: str) -> dict:
        """Synchronous analysis (runs in thread pool)."""
        with open(keypoints_path, encoding="utf-8") as f:
            data = json.load(f)

        frames = data.get("frames", [])
        valid_frames = [f for f in frames if f.get("detected")]

        if not valid_frames:
            return {
                "error": "No pose detected in any frame",
                "overall_score": 0,
                "total_frames_analyzed": 0,
            }

        # Compute movement metrics
        metrics = self.movement_analyzer.analyze(valid_frames)
        evaluation = self.quality_evaluator.evaluate(metrics)

        # Get joint angles for key frame (frame with peak wrist height)
        key_frame = self._find_key_frame(valid_frames)
        joint_angles = self.joint_analyzer.get_volleyball_angles(
            key_frame["landmarks"]
        ) if key_frame else {}

        result = {
            **evaluation,
            "metrics": metrics,
            "joint_angles_keyframe": joint_angles,
            "total_frames_analyzed": len(valid_frames),
        }

        # Save analysis result
        output_dir = os.path.dirname(keypoints_path)
        analysis_path = os.path.join(output_dir, "analysis.json")
        with open(analysis_path, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2, ensure_ascii=False)

        return result

    def _find_key_frame(self, frames: list[dict]) -> dict | None:
        """Find the key frame — the one with the highest wrist position."""
        best_frame = None
        best_y = 1.0  # y goes from 0 (top) to 1 (bottom), so lower is higher

        for f in frames:
            lms = f.get("landmarks", [])
            if len(lms) > 16:  # RIGHT_WRIST = 16
                wrist_y = lms[16].get("y", 1.0)
                if wrist_y < best_y:
                    best_y = wrist_y
                    best_frame = f

        return best_frame if best_frame else (frames[0] if frames else None)
