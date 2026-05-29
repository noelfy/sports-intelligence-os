"""
Abstract base class for sport-specific analysis rules.

New sports can be added by implementing this interface.
"""

from abc import ABC, abstractmethod


class BaseSportRule(ABC):
    """Abstract base for sport-specific movement analysis rules.

    Each sport implements:
    - Key joints used for analysis
    - Metric weights for overall score
    - Movement phase detection
    """

    sport_name: str = "generic"

    @abstractmethod
    def get_key_joints(self) -> list[str]:
        """Return list of joint names relevant to this sport."""
        ...

    @abstractmethod
    def get_metric_weights(self) -> dict[str, float]:
        """Return weight distribution for the overall score (must sum to 1.0)."""
        ...

    @abstractmethod
    def detect_phases(self, frames_data: list[dict]) -> list[dict]:
        """Detect movement phases from frame keypoint data.

        Args:
            frames_data: List of per-frame landmark data.

        Returns:
            List of phase dicts: {name, start_frame, end_frame, description}
        """
        ...
