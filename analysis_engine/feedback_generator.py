"""
AI feedback generator using LLM (OpenAI-compatible API).

Generates structured, actionable coaching feedback based on biomechanical
observations — not arbitrary scores.
"""

import json
import os

from openai import OpenAI


FALLBACK_FEEDBACK = {
    "summary": "Movement analysis complete.",
    "strengths": [],
    "improvements": [],
    "detailed_feedback": "",
}


class FeedbackGenerator:
    """Generates AI-powered feedback from biomechanical observations."""

    def __init__(self, api_key: str | None = None, model: str = "gpt-4o-mini"):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY", "")
        self.model = model
        self.client = OpenAI(api_key=self.api_key) if self.api_key else None

    def generate(self, analysis: dict, exercise_context: dict | None = None) -> dict:
        """Generate coaching feedback from biomechanical observations.

        Args:
            analysis: Dict with observations, focus_areas, joint_angles, metrics.
            exercise_context: Optional dict with exercise_name, correct_form,
                              common_mistakes, and coaching_cues for exercise-specific feedback.

        Returns:
            Structured feedback dict with summary, strengths, improvements,
            and detailed_feedback.
        """
        if not self.client or not self.api_key:
            return self._build_fallback(analysis)

        try:
            prompt = self._build_prompt(analysis, exercise_context)
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self._system_prompt(exercise_context)},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.7,
                max_tokens=600,
                response_format={"type": "json_object"},
            )
            return json.loads(response.choices[0].message.content)

        except Exception as e:
            result = self._build_fallback(analysis)
            result["error"] = str(e)
            return result

    def _build_fallback(self, analysis: dict) -> dict:
        """Build useful feedback without an LLM, based on observations and severity."""
        observations = analysis.get("observations", [])
        focus_areas = analysis.get("focus_areas", [])
        summary_text = analysis.get("summary", "")
        exercise_name = analysis.get("exercise_name", "the exercise")
        category = analysis.get("category", "general")

        strengths = []
        improvements = []
        critical_fixes = []

        for obs in observations:
            finding = obs.get("finding", "")
            implication = obs.get("implication", "")
            severity = obs.get("severity", "info")

            if severity == "positive":
                strengths.append(finding)
            elif severity == "critical":
                critical_fixes.append(f"{finding} {implication}")
                improvements.append(f"CRITICAL: {finding}")
            elif severity == "warning":
                improvements.append(f"{finding}")
            else:
                improvements.append(finding)

        if not strengths:
            strengths = [f"Your {exercise_name} movement data was successfully captured and analyzed"]

        # Build detailed feedback with exercise-specific structure
        parts = [f"## {exercise_name} Movement Analysis\n"]

        if critical_fixes:
            parts.append("### Critical Issues to Fix Immediately")
            for i, fix in enumerate(critical_fixes, 1):
                parts.append(f"{i}. {fix}")
            parts.append("")

        if improvements:
            parts.append("### Areas for Improvement")
            for i, imp in enumerate(improvements, 1):
                parts.append(f"{i}. {imp}")
            parts.append("")

        if strengths:
            parts.append("### What You Are Doing Well")
            for i, s in enumerate(strengths, 1):
                parts.append(f"{i}. {s}")

        detailed = "\n".join(parts)

        return {
            "summary": summary_text,
            "strengths": strengths[:3],
            "improvements": improvements[:4],
            "detailed_feedback": detailed,
        }

    def _system_prompt(self, exercise_context: dict | None = None) -> str:
        exercise_name = exercise_context.get("exercise_name", "the exercise") if exercise_context else "the exercise"
        correct_form = exercise_context.get("correct_form", "") if exercise_context else ""
        common_mistakes = exercise_context.get("common_mistakes", []) if exercise_context else []
        coaching_cues = exercise_context.get("coaching_cues", []) if exercise_context else []

        context_block = ""
        if correct_form:
            context_block += f"\nCORRECT FORM FOR {exercise_name.upper()}:\n{correct_form}\n"
        if common_mistakes:
            context_block += f"\nCOMMON MISTAKES TO WATCH FOR:\n" + "\n".join(f"- {m}" for m in common_mistakes) + "\n"
        if coaching_cues:
            context_block += f"\nKEY COACHING CUES:\n" + "\n".join(f"- {c}" for c in coaching_cues) + "\n"

        return f"""You are an expert sports biomechanist and fitness coach with 20 years of experience.
Analyze biomechanical observations from an exercise video and provide concise, actionable coaching feedback.

The athlete is performing: {exercise_name}
{context_block}
Guidelines:
- Be specific and reference actual body mechanics from the observations
- Compare the athlete's movement to the correct form described above
- Call out any common mistakes you detect in the observations
- Use professional but encouraging, direct language
- Keep feedback concise (2-3 paragraphs max)
- Focus on the most impactful findings
- Give practical coaching cues the athlete can use immediately
- Do NOT mention arbitrary scores, ratings, or levels — focus on what to improve and how
- Return valid JSON always"""

    def _build_prompt(self, analysis: dict, exercise_context: dict | None = None) -> str:
        """Build the analysis prompt from observations, with optional exercise context."""
        observations = analysis.get("observations", [])
        focus_areas = analysis.get("focus_areas", [])
        joint_angles = analysis.get("joint_angles_keyframe", {})

        obs_text = ""
        for obs in observations:
            area = obs.get("area", "unknown")
            finding = obs.get("finding", "")
            obs_text += f"- [{area}] {finding}\n"

        focus_text = "\n".join(f"- {f}" for f in focus_areas) if focus_areas else "(none identified)"

        exercise_name = exercise_context.get("exercise_name", "the exercise") if exercise_context else "the exercise"

        return f"""Analyze these biomechanical observations from a {exercise_name} video and provide coaching feedback:

OBSERVATIONS:
{obs_text}

KEY FOCUS AREAS:
{focus_text}

JOINT ANGLES AT KEY FRAME:
{json.dumps(joint_angles, indent=2)}

Return JSON with these exact keys:
{{
  "summary": "2-3 sentence overview of the movement quality for this {exercise_name}",
  "strengths": ["2-3 specific things the athlete is doing well"],
  "improvements": ["2-3 specific, actionable coaching cues for improvement"],
  "detailed_feedback": "A paragraph of biomechanical analysis with practical coaching cues. Reference the correct form. Do NOT mention scores or ratings."
}}"""
