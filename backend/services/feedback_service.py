"""
Feedback service — bridges FastAPI to the AI feedback generator.

Generates coaching feedback from biomechanical observations.
"""

import json
import os
import asyncio

from backend.config import settings
from analysis_engine.feedback_generator import FeedbackGenerator


class FeedbackService:
    """Generates coaching feedback from movement analysis."""

    def __init__(self):
        self.generator = FeedbackGenerator(
            api_key=settings.OPENAI_API_KEY,
            model=settings.OPENAI_MODEL,
        )

    async def generate(self, analysis_id: str, exercise_id: str | None = None) -> dict:
        """Generate coaching feedback for a completed analysis.

        Args:
            analysis_id: Unique analysis ID.
            exercise_id: Optional exercise ID for exercise-specific feedback
                         (e.g. "barbell-squats"). Loads correct form cues,
                         common mistakes, and coaching cues from exercise_context.

        Returns:
            Structured feedback dict with summary, strengths, improvements,
            and detailed_feedback.
        """
        analysis_path = os.path.join(
            "data", "output", analysis_id, "analysis.json"
        )

        if not os.path.exists(analysis_path):
            raise FileNotFoundError(f"Analysis file not found: {analysis_path}")

        with open(analysis_path, encoding="utf-8") as f:
            analysis_data = json.load(f)

        # Load exercise context for exercise-specific feedback
        exercise_ctx = None
        if exercise_id:
            try:
                from backend.services.exercise_context import get_exercise_context
                ctx = get_exercise_context(exercise_id)
                exercise_ctx = {
                    "exercise_name": ctx.exercise_name,
                    "category": ctx.category,
                    "correct_form": ctx.correct_form,
                    "common_mistakes": ctx.common_mistakes,
                    "coaching_cues": ctx.coaching_cues,
                    "phase_names": ctx.phase_names,
                    "primary_joints": ctx.primary_joints,
                }
            except ImportError:
                pass  # exercise_context module not available, use generic feedback

        loop = asyncio.get_event_loop()
        feedback = await loop.run_in_executor(
            None, self.generator.generate, analysis_data, exercise_ctx
        )

        # Save feedback
        output_dir = os.path.dirname(analysis_path)
        feedback_path = os.path.join(output_dir, "feedback.json")
        with open(feedback_path, "w", encoding="utf-8") as f:
            json.dump(feedback, f, indent=2, ensure_ascii=False)

        return feedback
