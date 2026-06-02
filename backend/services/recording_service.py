"""
Multi-camera recording service using OpenCV.

Provides headless synchronized recording from multiple USB cameras.
Follows existing service pattern (async public → executor → sync private).
"""

import os
import uuid
import json
import time
import asyncio
import threading
from datetime import datetime, timezone

import cv2
import numpy as np

from backend.config import settings


class RecordingService:
    """Manages synchronized multi-camera recording.

    Recording sessions store per-camera .mp4 files in
    data/recordings/{analysis_id}/cam_{i}.mp4.
    """

    def __init__(self):
        self._active_sessions: dict[str, dict] = {}  # analysis_id → session state
        self._lock = threading.Lock()

    # ═══════════════════════════════════════════════════════════════
    # PUBLIC ASYNC API
    # ═══════════════════════════════════════════════════════════════

    async def discover_cameras(self) -> dict:
        """Detect available USB cameras.

        Returns list of {index, name, max_resolution}.
        """
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._discover_cameras)

    async def start_recording(self, camera_ids: list[int],
                              exercise_id: str = "general",
                              calibration_session_id: str | None = None,
                              fps: int = 30,
                              width: int = 1280,
                              height: int = 720) -> dict:
        """Start synchronized recording on multiple cameras.

        Returns analysis_id immediately. Recording runs in background threads.
        """
        analysis_id = str(uuid.uuid4())

        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None, self._start_recording, analysis_id, camera_ids,
            exercise_id, calibration_session_id, fps, width, height
        )

    async def stop_recording(self, analysis_id: str) -> dict:
        """Stop an active recording session.

        Signals all camera threads to stop, waits for them to finish,
        and cleans up.
        """
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None, self._stop_recording, analysis_id
        )

    async def get_status(self, analysis_id: str) -> dict:
        """Get current recording session status."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None, self._get_status, analysis_id
        )

    # ═══════════════════════════════════════════════════════════════
    # SYNC IMPLEMENTATION
    # ═══════════════════════════════════════════════════════════════

    def _discover_cameras(self) -> dict:
        cameras = []
        for idx in range(settings.MAX_CAMERAS):
            cap = cv2.VideoCapture(idx, cv2.CAP_DSHOW)
            if cap.isOpened():
                w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
                h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
                # Get camera name via DSHOW
                name = f"Camera {idx}"
                cameras.append({
                    "index": idx,
                    "name": name,
                    "max_width": w,
                    "max_height": h,
                })
                cap.release()

        return {"cameras": cameras}

    def _start_recording(self, analysis_id: str, camera_ids: list[int],
                         exercise_id: str, calibration_session_id: str | None,
                         fps: int, width: int, height: int) -> dict:
        # Validate cameras
        available = self._discover_cameras()
        available_indices = {c["index"] for c in available["cameras"]}
        for cid in camera_ids:
            if cid not in available_indices:
                return {
                    "success": False,
                    "error": f"Camera {cid} not available. Available: {sorted(available_indices)}",
                }

        # Create recording directory
        session_dir = os.path.join(settings.RECORDING_DIR, analysis_id)
        os.makedirs(session_dir, exist_ok=True)

        # Open cameras and start recording threads
        camera_sessions = []
        stop_flags = []

        for i, cid in enumerate(camera_ids):
            cap = cv2.VideoCapture(cid, cv2.CAP_DSHOW)
            cap.set(cv2.CAP_PROP_FRAME_WIDTH, width)
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, height)
            cap.set(cv2.CAP_PROP_FPS, fps)

            actual_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            actual_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            actual_fps = cap.get(cv2.CAP_PROP_FPS)

            video_path = os.path.join(session_dir, f"cam_{i}.mp4")
            fourcc = cv2.VideoWriter_fourcc(*"mp4v")
            writer = cv2.VideoWriter(video_path, fourcc, actual_fps or fps,
                                     (actual_w, actual_h))

            stop_flag = threading.Event()
            stop_flags.append(stop_flag)

            thread = threading.Thread(
                target=self._record_camera,
                args=(cap, writer, stop_flag, i),
                daemon=True,
            )

            camera_sessions.append({
                "camera_index": i,
                "camera_id": cid,
                "video_path": video_path,
                "width": actual_w,
                "height": actual_h,
                "fps": actual_fps,
                "thread": thread,
                "capture": cap,
                "writer": writer,
                "stop_flag": stop_flag,
            })

        # Start all threads
        start_time = time.time()
        for cs in camera_sessions:
            cs["thread"].start()

        session = {
            "analysis_id": analysis_id,
            "camera_ids": camera_ids,
            "exercise_id": exercise_id,
            "calibration_session_id": calibration_session_id,
            "camera_sessions": camera_sessions,
            "start_time": start_time,
            "status": "recording",
            "is_3d": calibration_session_id is not None,
            "capture_mode": "multi_camera",
        }

        with self._lock:
            self._active_sessions[analysis_id] = session

        # Save session meta
        meta = {
            "analysis_id": analysis_id,
            "camera_count": len(camera_ids),
            "exercise_id": exercise_id,
            "calibration_session_id": calibration_session_id,
            "camera_config": [
                {"index": cs["camera_index"], "camera_id": cs["camera_id"],
                 "fps": cs["fps"], "width": cs["width"], "height": cs["height"]}
                for cs in camera_sessions
            ],
            "started_at": datetime.now(timezone.utc).isoformat(),
        }
        with open(os.path.join(session_dir, "meta.json"), "w", encoding="utf-8") as f:
            json.dump(meta, f, indent=2, ensure_ascii=False)

        return {
            "success": True,
            "analysis_id": analysis_id,
            "camera_count": len(camera_ids),
            "cameras": [
                {"index": cs["camera_index"], "camera_id": cs["camera_id"],
                 "width": cs["width"], "height": cs["height"], "fps": cs["fps"]}
                for cs in camera_sessions
            ],
            "started_at": meta["started_at"],
        }

    def _record_camera(self, cap: cv2.VideoCapture, writer: cv2.VideoWriter,
                       stop_flag: threading.Event, cam_idx: int):
        """Background thread: record frames from one camera until stopped."""
        frame_count = 0
        while not stop_flag.is_set():
            ret, frame = cap.read()
            if not ret:
                break
            writer.write(frame)
            frame_count += 1

        cap.release()
        writer.release()

    def _stop_recording(self, analysis_id: str) -> dict:
        with self._lock:
            session = self._active_sessions.get(analysis_id)
            if session is None:
                return {"success": False, "error": "No active recording session found"}

        # Signal all threads to stop
        for cs in session["camera_sessions"]:
            cs["stop_flag"].set()

        # Wait for threads to finish
        for cs in session["camera_sessions"]:
            cs["thread"].join(timeout=5)

        elapsed = round(time.time() - session["start_time"], 1)

        # Update session
        session["status"] = "completed"
        session["elapsed_seconds"] = elapsed
        session["completed_at"] = datetime.now(timezone.utc).isoformat()

        # Update meta file
        session_dir = os.path.join(settings.RECORDING_DIR, analysis_id)
        meta_path = os.path.join(session_dir, "meta.json")
        if os.path.exists(meta_path):
            with open(meta_path, encoding="utf-8") as f:
                meta = json.load(f)
            meta["status"] = "completed"
            meta["elapsed_seconds"] = elapsed
            meta["completed_at"] = session["completed_at"]
            with open(meta_path, "w", encoding="utf-8") as f:
                json.dump(meta, f, indent=2, ensure_ascii=False)

        # Build video paths
        video_paths = [
            {
                "camera_index": cs["camera_index"],
                "path": cs["video_path"],
            }
            for cs in session["camera_sessions"]
        ]

        # Clean up
        with self._lock:
            del self._active_sessions[analysis_id]

        return {
            "success": True,
            "analysis_id": analysis_id,
            "elapsed_seconds": elapsed,
            "camera_count": len(video_paths),
            "videos": video_paths,
            "capture_mode": session["capture_mode"],
            "is_3d": session["is_3d"],
            "exercise_id": session["exercise_id"],
            "calibration_session_id": session["calibration_session_id"],
        }

    def _get_status(self, analysis_id: str) -> dict:
        with self._lock:
            session = self._active_sessions.get(analysis_id)

        if session is None:
            # Check if completed session exists
            session_dir = os.path.join(settings.RECORDING_DIR, analysis_id)
            meta_path = os.path.join(session_dir, "meta.json")
            if os.path.exists(meta_path):
                with open(meta_path, encoding="utf-8") as f:
                    meta = json.load(f)
                return {"status": meta.get("status", "completed"), **meta}
            return {"status": "not_found", "analysis_id": analysis_id}

        elapsed = round(time.time() - session["start_time"], 1)
        return {
            "status": session["status"],
            "analysis_id": analysis_id,
            "elapsed_seconds": elapsed,
            "camera_count": len(session["camera_sessions"]),
            "is_3d": session["is_3d"],
        }
