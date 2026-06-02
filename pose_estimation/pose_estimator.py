"""
MediaPipe Pose estimator wrapper.

Provides a clean interface for running pose estimation on images/video frames.
"""

import os
import cv2
import numpy as np
import mediapipe as mp

from pose_estimation.config import PoseEstimationConfig, DEFAULT_POSE_CONFIG
from pose_estimation.landmark_definitions import LANDMARK_COUNT, LANDMARK_NAMES

# ── Workaround for MediaPipe Unicode path bug on Windows ──────────────
# MediaPipe's C++ backend cannot handle paths with non-ASCII characters.
# We redirect model resource directory resolution to a safe ASCII location.
_MP_ASCII_PATH = os.path.join(
    os.path.expanduser("~"), ".mediapipe_patch", "mediapipe"
).replace("\\", "/")

def _ensure_ascii_modules():
    """Copy mediapipe modules to ASCII-safe path (idempotent)."""
    src = os.path.join(os.path.dirname(mp.__file__), "modules")
    dst = os.path.join(_MP_ASCII_PATH, "modules")
    if not os.path.exists(os.path.join(dst, "pose_landmark")):
        import shutil
        if os.path.exists(dst):
            shutil.rmtree(dst)
        shutil.copytree(src, dst)
    return dst

_ensure_ascii_modules()

# Monkey-patch: MediaPipe's C++ layer can't handle paths with non-ASCII
# characters. We:
#   1) Redirect resource_util.set_resource_dir to always use our ASCII-safe copy
#   2) Patch SolutionBase.__init__ to pass an ASCII-safe binary_graph_path
from mediapipe.python import solution_base as _mp_solution_base
from mediapipe.python._framework_bindings import resource_util as _mp_resource

_ASCII_ROOT = os.path.dirname(_MP_ASCII_PATH).replace("\\", "/")

# Step 1: Force set_resource_dir to ALWAYS use the ASCII path (no-op the arg)
_orig_set_resource_dir = _mp_resource.set_resource_dir
def _locked_set_resource_dir(_path=None):
    _orig_set_resource_dir(_ASCII_ROOT)
_mp_resource.set_resource_dir = _locked_set_resource_dir

# Step 2: Patch SolutionBase.__init__ to also fix binary_graph_path
_SB_ORIG_INIT = _mp_solution_base.SolutionBase.__init__

def _patched_sb_init(self, binary_graph_path=None, graph_config=None,
                     calculator_params=None, graph_options=None,
                     side_inputs=None, outputs=None, stream_type_hints=None):
    if binary_graph_path:
        binary_graph_path = os.path.join(_ASCII_ROOT, binary_graph_path).replace("\\", "/")
    _SB_ORIG_INIT(
        self,
        binary_graph_path=binary_graph_path,
        graph_config=graph_config,
        calculator_params=calculator_params,
        graph_options=graph_options,
        side_inputs=side_inputs,
        outputs=outputs,
        stream_type_hints=stream_type_hints,
    )

_mp_solution_base.SolutionBase.__init__ = _patched_sb_init
# ─────────────────────────────────────────────────────────────────────


class PoseEstimator:
    """Wraps MediaPipe Pose for single-frame landmark extraction.

    Usage:
        estimator = PoseEstimator()
        landmarks = estimator.estimate(frame)  # frame is BGR numpy array
        # landmarks is list of 33 dicts: {x, y, z, visibility, name}
        estimator.close()
    """

    def __init__(self, config: PoseEstimationConfig | None = None):
        """Initialize the MediaPipe Pose model.

        Args:
            config: PoseEstimationConfig or None to use defaults.
        """
        self.config = config or DEFAULT_POSE_CONFIG
        self._mp_pose = mp.solutions.pose
        self._pose = self._mp_pose.Pose(
            model_complexity=self.config.model_complexity,
            min_detection_confidence=self.config.min_detection_confidence,
            min_tracking_confidence=self.config.min_tracking_confidence,
            static_image_mode=self.config.static_image_mode,
            smooth_landmarks=self.config.smooth_landmarks,
        )

    def estimate(self, image: np.ndarray) -> list[dict] | None:
        """Run pose estimation on a single BGR image frame.

        Args:
            image: BGR numpy array (height, width, 3) as read by OpenCV.

        Returns:
            List of 33 landmark dicts with keys:
                x: float (normalized 0-1, image width ratio)
                y: float (normalized 0-1, image height ratio)
                z: float (relative depth, roughly proportional to hip width)
                visibility: float (0-1, confidence of landmark being visible)
                name: str (human-readable landmark name)
            Or None if no person was detected.
        """
        # MediaPipe expects RGB
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        # Disable writeability for performance
        image_rgb.flags.writeable = False
        results = self._pose.process(image_rgb)
        image_rgb.flags.writeable = True

        if results.pose_landmarks is None:
            return None

        landmarks = []
        for i, lm in enumerate(results.pose_landmarks.landmark):
            landmarks.append({
                "x": round(lm.x, 6),
                "y": round(lm.y, 6),
                "z": round(lm.z, 6),
                "visibility": round(lm.visibility, 6),
                "name": LANDMARK_NAMES.get(i, f"landmark_{i}"),
            })

        return landmarks

    def reset(self) -> None:
        """Reset the underlying MediaPipe Pose instance (e.g., between videos)."""
        self._pose.close()
        self._pose = self._mp_pose.Pose(
            model_complexity=self.config.model_complexity,
            min_detection_confidence=self.config.min_detection_confidence,
            min_tracking_confidence=self.config.min_tracking_confidence,
            static_image_mode=self.config.static_image_mode,
            smooth_landmarks=self.config.smooth_landmarks,
        )

    def close(self) -> None:
        """Release MediaPipe resources."""
        self._pose.close()
