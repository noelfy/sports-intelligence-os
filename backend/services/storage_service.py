"""
File storage abstraction layer.

For MVP, uses local filesystem. Can be swapped for S3/R2 in production.
"""

import os
import shutil
from backend.config import settings


class StorageService:
    """Manages file read/write operations for uploads and outputs."""

    @staticmethod
    def save_upload(analysis_id: str, file_bytes: bytes, filename: str) -> str:
        """Save an uploaded video file to disk.

        Args:
            analysis_id: Unique analysis ID.
            file_bytes: Raw file content.
            filename: Original filename.

        Returns:
            Path to the saved file.
        """
        dir_path = os.path.join(settings.UPLOAD_DIR, analysis_id)
        os.makedirs(dir_path, exist_ok=True)
        file_path = os.path.join(dir_path, filename)
        with open(file_path, "wb") as f:
            f.write(file_bytes)
        return file_path

    @staticmethod
    def get_video_path(analysis_id: str, filename: str) -> str:
        """Get the path to a processed video file."""
        return os.path.join(settings.OUTPUT_DIR, analysis_id, filename)

    @staticmethod
    def get_keypoints_path(analysis_id: str) -> str:
        """Get the path to the keypoints JSON file."""
        return os.path.join(settings.OUTPUT_DIR, analysis_id, "keypoints.json")

    @staticmethod
    def get_analysis_path(analysis_id: str) -> str:
        """Get the path to the analysis JSON file."""
        return os.path.join(settings.OUTPUT_DIR, analysis_id, "analysis.json")

    @staticmethod
    def get_upload_path(analysis_id: str, filename: str) -> str:
        """Get the path to an uploaded video file."""
        return os.path.join(settings.UPLOAD_DIR, analysis_id, filename)

    @staticmethod
    def delete_analysis_files(analysis_id: str) -> None:
        """Delete all files associated with an analysis."""
        for base_dir in [settings.UPLOAD_DIR, settings.OUTPUT_DIR]:
            dir_path = os.path.join(base_dir, analysis_id)
            if os.path.exists(dir_path):
                shutil.rmtree(dir_path)
