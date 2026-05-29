"""
Video processing pipeline orchestrator.

Coordinates video reading, pose estimation, keypoint serialization,
and skeleton rendering for a complete video analysis pass.
"""

import os
import json
import cv2
from typing import Callable

from pose_estimation.config import PoseEstimationConfig, DEFAULT_POSE_CONFIG
from pose_estimation.pose_estimator import PoseEstimator
from pose_estimation.keypoint_serializer import serialize_frame_landmarks, serialize_all_frames
from pose_estimation.skeleton_renderer import SkeletonRenderer


class VideoProcessor:
    """Orchestrates the complete pose estimation pipeline for a single video.

    Usage:
        processor = VideoProcessor()
        result = processor.process("input.mp4", "output/")
        # result = {
        #     "keypoints_path": "output/keypoints.json",
        #     "overlay_path": "output/overlay.mp4",
        #     "metadata": {...},
        # }
        processor.close()
    """

    def __init__(self, config: PoseEstimationConfig | None = None):
        """Initialize the processor.

        Args:
            config: PoseEstimationConfig or None for defaults.
        """
        self.config = config or DEFAULT_POSE_CONFIG
        self._estimator: PoseEstimator | None = None
        self._renderer: SkeletonRenderer | None = None

    def _ensure_initialized(self) -> None:
        """Lazy initialization of estimator and renderer."""
        if self._estimator is None:
            self._estimator = PoseEstimator(self.config)
        if self._renderer is None:
            self._renderer = SkeletonRenderer()

    def process(
        self,
        video_path: str,
        output_dir: str,
        progress_callback: Callable | None = None,
    ) -> dict:
        """Process a video: extract poses, serialize keypoints, render overlay.

        Args:
            video_path: Path to the input video file (.mp4 or .mov).
            output_dir: Directory where output files will be written.
            progress_callback: Optional callback(step: str, current: int, total: int).

        Returns:
            Dict with keys:
                keypoints_path: Path to the keypoints JSON file.
                overlay_path: Path to the skeleton overlay video.
                metadata: Dict with video metadata.
                error: Error message (only present if processing failed).

        Raises:
            FileNotFoundError: If video_path does not exist.
            ValueError: If the video cannot be opened.
        """
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file not found: {video_path}")

        self._ensure_initialized()

        # Create output directory
        os.makedirs(output_dir, exist_ok=True)

        # Open video
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Cannot open video file: {video_path}")

        try:
            # Extract video metadata
            fps = cap.get(cv2.CAP_PROP_FPS)
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            duration_ms = (total_frames / fps * 1000) if fps > 0 else 0

            video_metadata = {
                "video_filename": os.path.basename(video_path),
                "video_fps": round(fps, 2),
                "video_duration_ms": round(duration_ms, 2),
                "total_frames": total_frames,
                "width": width,
                "height": height,
            }

            # Process frame by frame
            frames_data = []
            frame_idx = 0

            while True:
                ret, frame = cap.read()
                if not ret:
                    break

                timestamp_ms = (frame_idx / fps * 1000) if fps > 0 else frame_idx * 33.33

                landmarks = self._estimator.estimate(frame)
                frame_data = serialize_frame_landmarks(frame_idx, landmarks, timestamp_ms)
                frames_data.append(frame_data)

                if progress_callback:
                    progress_callback("pose_estimation", frame_idx + 1, total_frames)

                frame_idx += 1

            # Serialize all keypoints to JSON
            keypoints_data = serialize_all_frames(frames_data, video_metadata)
            keypoints_path = os.path.join(output_dir, "keypoints.json")
            with open(keypoints_path, "w", encoding="utf-8") as f:
                json.dump(keypoints_data, f, indent=2, ensure_ascii=False)

            # Render skeleton overlay video
            overlay_path = os.path.join(output_dir, "overlay.mp4")

            def render_progress(current: int, total: int) -> None:
                if progress_callback:
                    progress_callback("rendering", current, total)

            self._renderer.render_video(
                video_path, frames_data, overlay_path,
                progress_callback=render_progress,
            )

            return {
                "keypoints_path": keypoints_path,
                "overlay_path": overlay_path,
                "metadata": video_metadata,
            }

        finally:
            cap.release()

    def reset(self) -> None:
        """Reset estimator state between videos."""
        if self._estimator is not None:
            self._estimator.reset()

    def close(self) -> None:
        """Release all resources."""
        if self._estimator is not None:
            self._estimator.close()
            self._estimator = None
        self._renderer = None
