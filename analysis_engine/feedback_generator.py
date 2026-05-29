"""
AI feedback generator using LLM (OpenAI-compatible API).

Generates structured, sports-science-informed movement feedback
based on computed metrics and joint analysis.
"""

import json
import os

from openai import OpenAI


# Fallback feedback when no API key is available
FALLBACK_FEEDBACK = {
    "summary": "Movement analysis complete. AI-powered feedback requires an OpenAI API key. "
               "Set OPENAI_API_KEY in your .env file to enable detailed coaching feedback.",
    "strengths": [
        "Data collection successful — pose estimation pipeline is working",
        "All movement metrics have been computed",
    ],
    "improvements": [
        "Add your OpenAI API key to get personalized coaching feedback",
        "Record clearer video for more accurate pose detection",
    ],
    "detailed_feedback": "AI-powered feedback is not yet configured. "
                         "The system has successfully analyzed your movement and computed "
                         "biomechanical metrics. To enable personalized coaching feedback, "
                         "please set the OPENAI_API_KEY environment variable.",
}


class FeedbackGenerator:
    """Generates AI-powered feedback from movement metrics and analysis data."""

    def __init__(self, api_key: str | None = None, model: str = "gpt-4o-mini"):
        """Initialize the feedback generator.

        Args:
            api_key: OpenAI API key. If None, reads from OPENAI_API_KEY env var.
            model: OpenAI model name to use.
        """
        self.api_key = api_key or os.getenv("OPENAI_API_KEY", "")
        self.model = model
        self.client = OpenAI(api_key=self.api_key) if self.api_key else None

    def generate(self, metrics: dict, analysis: dict) -> dict:
        """Generate AI feedback from metrics and analysis data.

        Args:
            metrics: Dict with overall_score, level, and metric breakdown.
            analysis: Dict with joint angles and frame statistics.

        Returns:
            Structured feedback dict with summary, strengths, improvements,
            and detailed_feedback.
        """
        if not self.client or not self.api_key:
            return {
                **FALLBACK_FEEDBACK,
                "overall_score": metrics.get("overall_score", 50),
            }

        try:
            prompt = self._build_prompt(metrics, analysis)
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self._system_prompt()},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.7,
                max_tokens=600,
                response_format={"type": "json_object"},
            )
            result = json.loads(response.choices[0].message.content)
            result["overall_score"] = metrics.get("overall_score", 50)
            return result

        except Exception as e:
            return {
                **FALLBACK_FEEDBACK,
                "overall_score": metrics.get("overall_score", 50),
                "error": str(e),
            }

    def _system_prompt(self) -> str:
        """System prompt for the sports biomechanist persona."""
        return """You are an expert sports biomechanist and volleyball coach with 20 years of experience.
Analyze volleyball movement data and provide concise, actionable feedback.

Focus on key biomechanical principles:
- Balance and stability through the movement
- Posture and body alignment
- Timing and rhythm of movement phases
- Movement efficiency and smoothness
- Coordination of multi-joint actions

Guidelines:
- Be specific and reference actual body mechanics
- Use professional but encouraging language
- Keep feedback concise (2-3 paragraphs max)
- Focus on the most impactful 2-3 strengths and improvements
- Return valid JSON always"""

    def _build_prompt(self, metrics: dict, analysis: dict) -> str:
        """Build the analysis prompt from metrics and analysis data."""
        metric_lines = []
        breakdown = metrics.get("metric_breakdown", {})
        for name, data in breakdown.items():
            score = data.get("score", 0)
            emoji = "🟢" if score >= 80 else "🟡" if score >= 60 else "🔴"
            metric_lines.append(f"- {emoji} {name.title()}: {score}/100")

        return f"""Analyze this volleyball movement data and provide coaching feedback:

Overall Score: {metrics.get('overall_score', 0)}/100
Level: {metrics.get('level', 'Unknown')}

Metrics:
{chr(10).join(metric_lines)}

Joint Angles (key frame):
{json.dumps(analysis.get('joint_angles_keyframe', {}), indent=2)}

Total Frames Analyzed: {analysis.get('total_frames_analyzed', 0)}

Return JSON with these exact keys:
{{
  "summary": "2-3 sentence overview of the movement quality",
  "strengths": ["2-3 specific, biomechanically accurate strengths"],
  "improvements": ["2-3 specific, actionable areas to improve with coaching cues"],
  "detailed_feedback": "A paragraph of biomechanical analysis with practical coaching cues"
}}"""
