"""
Skeleton overlay renderer for pose estimation visualization.

Draws landmarks and connection lines onto video frames with configurable styles.
"""

import cv2
import numpy as np
from typing import Callable

from pose_estimation.config import SkeletonStyleConfig, DEFAULT_SKELETON_STYLE
from pose_estimation.landmark_definitions import (
    POSE_CONNECTIONS,
    LEFT_PINKY,
    RIGHT_PINKY,
    LEFT_INDEX,
    RIGHT_INDEX,
    LEFT_THUMB,
    RIGHT_THUMB,
    LEFT_HEEL,
    RIGHT_HEEL,
    LEFT_FOOT_INDEX,
    RIGHT_FOOT_INDEX,
)


# Hand and foot landmark indices for special coloring
_HAND_FOOT_INDICES = {
    LEFT_PINKY, RIGHT_PINKY, LEFT_INDEX, RIGHT_INDEX,
    LEFT_THUMB, RIGHT_THUMB, LEFT_HEEL, RIGHT_HEEL,
    LEFT_FOOT_INDEX, RIGHT_FOOT_INDEX,
}


class SkeletonRenderer:
    """Draws pose landmarks and skeleton connections onto video frames.

    Usage:
        renderer = SkeletonRenderer()
        annotated_frame = renderer.render_frame(frame, landmarks)
        # or process a whole video:
        renderer.render_video(input_path, frames_data, output_path)
    """

    def __init__(self, style: SkeletonStyleConfig | None = None):
        """Initialize the renderer with visual style configuration.

        Args:
            style: SkeletonStyleConfig for visual customization.
        """
        self.style = style or DEFAULT_SKELETON_STYLE

    def render_frame(
        self,
        image: np.ndarray,
        landmarks: list[dict] | None,
        width: int | None = None,
        height: int | None = None,
    ) -> np.ndarray:
        """Draw landmarks and connections onto a single frame.

        Args:
            image: BGR numpy array (height, width, 3).
            landmarks: List of 33 landmark dicts (with x, y keys) or None.
            width: Image width in pixels. If None, inferred from image shape.
            height: Image height in pixels. If None, inferred from image shape.

        Returns:
            Annotated BGR image (new array, original unchanged).
        """
        # Work on a copy
        overlay = image.copy()
        h, w = height or image.shape[0], width or image.shape[1]

        if landmarks is None or len(landmarks) == 0:
            return overlay

        # Convert normalized coordinates to pixel positions
        points: dict[int, tuple[int, int]] = {}
        for i, lm in enumerate(landmarks):
            px = int(lm["x"] * w)
            py = int(lm["y"] * h)
            points[i] = (px, py)

        # Draw connections
        for start_idx, end_idx in POSE_CONNECTIONS:
            if start_idx in points and end_idx in points:
                pt1 = points[start_idx]
                pt2 = points[end_idx]
                cv2.line(
                    overlay, pt1, pt2,
                    self.style.connection_color,
                    self.style.line_thickness,
                    cv2.LINE_AA,
                )

        # Draw landmarks
        for i, (px, py) in points.items():
            color = (
                self.style.hand_foot_color
                if i in _HAND_FOOT_INDICES
                else self.style.landmark_color
            )
            cv2.circle(
                overlay, (px, py),
                self.style.landmark_radius,
                color,
                -1,  # filled
                cv2.LINE_AA,
            )

        # Alpha blend the overlay with the original
        blended = cv2.addWeighted(
            image,
            1.0 - self.style.overlay_alpha,
            overlay,
            self.style.overlay_alpha,
            0,
        )

        return blended

    def render_video(
        self,
        video_path: str,
        frames_data: list[dict],
        output_path: str,
        progress_callback: Callable | None = None,
    ) -> str:
        """Render skeleton overlay for every frame of a video.

        Args:
            video_path: Path to the original video file.
            frames_data: List of per-frame landmark data dicts
                (each with 'landmarks' key containing list of 33 landmarks).
            output_path: Path where the output MP4 video will be written.
            progress_callback: Optional callback(current_frame, total_frames).

        Returns:
            Path to the generated overlay video.
        """
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Cannot open video file: {video_path}")

        fps = cap.get(cv2.CAP_PROP_FPS)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        # Use mp4v codec (MPEG-4 Part 2). Reliable cross-platform.
        # For browser playback, a post-processing step converts to H.264.
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

        frame_idx = 0
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            # Get landmarks for this frame (None if no pose detected)
            frame_landmarks = None
            if frame_idx < len(frames_data) and frames_data[frame_idx]["detected"]:
                frame_landmarks = frames_data[frame_idx].get("landmarks")

                # Convert to format expected by render_frame
                if frame_landmarks:
                    frame_landmarks = [
                        {"x": lm["x"], "y": lm["y"], "z": lm.get("z", 0),
                         "visibility": lm.get("visibility", 0), "name": lm.get("name", "")}
                        for lm in frame_landmarks
                    ]

            rendered = self.render_frame(frame, frame_landmarks or None, width, height)
            out.write(rendered)

            if progress_callback:
                progress_callback(frame_idx, total_frames)

            frame_idx += 1

        cap.release()
        out.release()

        return output_path
