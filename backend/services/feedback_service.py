"""
Feedback service — bridges FastAPI to the AI feedback generator.

Generates LLM-powered coaching feedback from analysis results.
"""

import json
import os
import asyncio

from backend.config import settings
from analysis_engine.feedback_generator import FeedbackGenerator


class FeedbackService:
    """Generates AI-powered sports feedback from analysis data."""

    def __init__(self):
        self.generator = FeedbackGenerator(
            api_key=settings.OPENAI_API_KEY,
            model=settings.OPENAI_MODEL,
        )

    async def generate(self, analysis_id: str) -> dict:
        """Generate AI feedback for a completed analysis.

        Args:
            analysis_id: Unique analysis ID.

        Returns:
            Structured feedback dict.
        """
        analysis_path = os.path.join(
            "data", "output", analysis_id, "analysis.json"
        )

        if not os.path.exists(analysis_path):
            raise FileNotFoundError(f"Analysis file not found: {analysis_path}")

        with open(analysis_path, encoding="utf-8") as f:
            analysis_data = json.load(f)

        metrics = {
            "overall_score": analysis_data.get("overall_score", 50),
            "level": analysis_data.get("level", "Unknown"),
            "metric_breakdown": analysis_data.get("metric_breakdown", {}),
        }

        # Run API call in thread pool
        loop = asyncio.get_event_loop()
        feedback = await loop.run_in_executor(
            None, self.generator.generate, metrics, analysis_data
        )

        # Save feedback
        output_dir = os.path.dirname(analysis_path)
        feedback_path = os.path.join(output_dir, "feedback.json")
        with open(feedback_path, "w", encoding="utf-8") as f:
            json.dump(feedback, f, indent=2, ensure_ascii=False)

        return feedback
