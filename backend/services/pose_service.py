"""
Bridge between FastAPI's async world and MediaPipe's synchronous CPU processing.

Runs pose estimation in a thread pool executor to avoid blocking the event loop.
"""

import asyncio
import os


class PoseService:
    """Async-compatible wrapper around the pose estimation pipeline."""

    def __init__(self, config=None):
        self.config = config  # lazy: set when needed

    async def process_video(self, analysis_id: str) -> dict:
        from pose_estimation.video_processor import VideoProcessor
        from pose_estimation.config import PoseEstimationConfig
        if self.config is None:
            self.config = PoseEstimationConfig()
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

    async def process_multi_camera(self, analysis_id: str,
                                   video_paths: list[str]) -> dict:
        """Run pose estimation on multiple synchronized camera videos.

        Each camera video is processed independently (in parallel if possible).
        Output saved as data/output/{analysis_id}/keypoints_cam_{i}.json.

        Args:
            analysis_id: Analysis session ID.
            video_paths: List of paths to per-camera .mp4 files.

        Returns:
            Dict with per-camera result summaries.
        """
        loop = asyncio.get_event_loop()
        results = []
        for i, video_path in enumerate(video_paths):
            output_dir = os.path.join("data", "output", analysis_id)
            result = await loop.run_in_executor(
                None, self._run_processing_multi, video_path, output_dir, i
            )
            results.append(result)
        return {"camera_count": len(video_paths), "results": results}

    def _run_processing(self, video_path: str, output_dir: str) -> dict:
        """Synchronous video processing (runs in thread pool)."""
        os.makedirs(output_dir, exist_ok=True)
        processor = VideoProcessor(config=self.config)
        try:
            result = processor.process(video_path, output_dir)
            return result
        finally:
            processor.close()

    def _run_processing_multi(self, video_path: str, output_dir: str,
                               camera_index: int) -> dict:
        """Process one camera's video — saves as keypoints_cam_{i}.json."""
        os.makedirs(output_dir, exist_ok=True)
        processor = VideoProcessor(config=self.config)
        try:
            result = processor.process(video_path, output_dir)
            # Rename keypoints.json to include camera index
            default_path = os.path.join(output_dir, "keypoints.json")
            indexed_path = os.path.join(output_dir, f"keypoints_cam_{camera_index}.json")
            if os.path.exists(default_path):
                if os.path.exists(indexed_path):
                    os.remove(indexed_path)
                os.rename(default_path, indexed_path)
                result["keypoints_path"] = indexed_path
            return result
        finally:
            processor.close()
