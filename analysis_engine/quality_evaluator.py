"""
Quality evaluator — computes overall movement score from individual metrics.

Uses sport-specific weights and converts numeric scores to human-readable levels.
"""

from analysis_engine.rules.base import BaseSportRule
from analysis_engine.rules.volleyball import VolleyballRule


# Registry of available sport rules
SPORT_RULES: dict[str, BaseSportRule] = {
    "volleyball": VolleyballRule(),
}


class QualityEvaluator:
    """Computes overall movement quality score and level."""

    def __init__(self, sport: str = "volleyball"):
        """Initialize with a sport-specific rule set.

        Args:
            sport: Sport identifier string (e.g., 'volleyball').
        """
        self.sport = sport
        self.rule = SPORT_RULES.get(sport, VolleyballRule())
        self.weights = self.rule.get_metric_weights()

    def evaluate(self, metrics: dict[str, float]) -> dict:
        """Compute overall score from individual metrics.

        Args:
            metrics: Dict with keys: balance, posture, timing, efficiency, coordination.
                     Each value is 0-100.

        Returns:
            Dict with overall_score, level, and weighted breakdown.
        """
        overall = sum(
            metrics.get(k, 50) * self.weights.get(k, 0.2)
            for k in self.weights
        )

        return {
            "overall_score": round(overall, 1),
            "level": self._score_to_level(overall),
            "metric_breakdown": {
                k: {
                    "score": metrics.get(k, 50),
                    "weight": self.weights.get(k, 0.2),
                    "contribution": round(metrics.get(k, 50) * self.weights.get(k, 0.2), 1),
                }
                for k in self.weights
            },
        }

    def _score_to_level(self, score: float) -> str:
        """Convert numeric score to a descriptive level."""
        if score >= 85:
            return "Elite"
        elif score >= 70:
            return "Advanced"
        elif score >= 55:
            return "Intermediate"
        elif score >= 40:
            return "Developing"
        else:
            return "Beginner"
