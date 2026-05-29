"""
Bridge between FastAPI's async world and MediaPipe's synchronous CPU processing.

Runs pose estimation in a thread pool executor to avoid blocking the event loop.
"""

import asyncio
import os

from pose_estimation.video_processor import VideoProcessor
from pose_estimation.config import PoseEstimationConfig


class PoseService:
    """Async-compatible wrapper around the pose estimation pipeline."""

    def __init__(self, config: PoseEstimationConfig | None = None):
        self.config = config or PoseEstimationConfig()

    async def process_video(self, analysis_id: str) -> dict:
        """Process a video: extract poses, generate keypoints and overlay.

        Runs the CPU-bound processing in a thread pool executor.

        Args:
            analysis_id: Unique ID for this analysis session.

        Returns:
            Dict with keypoints_path, overlay_path, and metadata.
        """
        video_path = f"data/uploads/{analysis_id}/original.mp4"
        output_dir = f"data/output/{analysis_id}"

        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Uploaded video not found: {video_path}")

        # Run CPU-bound work in thread pool
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None, self._run_processing, video_path, output_dir
        )
        return result

    def _run_processing(self, video_path: str, output_dir: str) -> dict:
        """Synchronous video processing (runs in thread pool)."""
        os.makedirs(output_dir, exist_ok=True)
        processor = VideoProcessor(config=self.config)
        try:
            result = processor.process(video_path, output_dir)
            return result
        finally:
            processor.close()
