"""
3D Triangulation service — converts multi-view 2D keypoints to 3D skeleton.

Uses OpenCV DLT triangulation with per-camera projection matrices
derived from calibration parameters. Applies temporal smoothing.
"""

import json
import os
import asyncio
import numpy as np
import cv2
from scipy.signal import butter, filtfilt

from backend.config import settings
from pose_estimation.keypoint_serializer_3d import (
    serialize_frame_landmarks_3d,
    serialize_all_frames_3d,
)
from pose_estimation.landmark_definitions import LANDMARK_NAMES


class TriangulationService:
    """Converts multi-view 2D keypoints to 3D world coordinates.

    Requires:
      - Per-camera 2D keypoints (from PoseService on each camera video)
      - Calibration parameters (intrinsics + extrinsics) from CalibrationService
    """

    def __init__(self):
        self.confidence_threshold = 0.5
        self.smoothing_cutoff_hz = 6.0

    # ═══════════════════════════════════════════════════════════════
    # PUBLIC ASYNC API
    # ═══════════════════════════════════════════════════════════════

    async def triangulate(self, analysis_id: str,
                          calibration_session_id: str,
                          camera_count: int | None = None) -> dict:
        """Run 3D triangulation on multi-camera keypoint data.

        Args:
            analysis_id: The analysis session ID.
            calibration_session_id: Calibration session to use for camera params.
            camera_count: Override camera count (bypasses calibration lookup).
                          Used for calibration-free uploads.

        Returns:
            Dict with keypoints_3d_path and triangulation metadata.
        """
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None, self._triangulate, analysis_id, calibration_session_id, camera_count
        )

    # ═══════════════════════════════════════════════════════════════
    # SYNC IMPLEMENTATION
    # ═══════════════════════════════════════════════════════════════

    def _triangulate(self, analysis_id: str,
                     calibration_session_id: str,
                     camera_count: int | None = None) -> dict:
        # Load calibration
        using_identity = camera_count is not None

        if using_identity:
            # Calibration-free mode: use identity matrices
            P_list = []
            for i in range(camera_count):
                P = np.eye(3, 4, dtype=np.float64)
                P_list.append(P)
        else:
            calib_path = os.path.join(
                settings.CALIBRATION_DIR, calibration_session_id, "calibration.json"
            )
            if not os.path.exists(calib_path):
                # Try session.json for camera count
                session_path = os.path.join(
                    settings.CALIBRATION_DIR, calibration_session_id, "session.json"
                )
                if not os.path.exists(session_path):
                    raise FileNotFoundError(
                        f"Calibration session {calibration_session_id} not found"
                    )
                with open(session_path, encoding="utf-8") as f:
                    calib = json.load(f)
                camera_count = calib.get("camera_count", 2)
                # Use identity matrices as fallback
                P_list = []
                for i in range(camera_count):
                    P = np.eye(3, 4, dtype=np.float64)
                    P_list.append(P)
            else:
                with open(calib_path, encoding="utf-8") as f:
                    calib = json.load(f)
                camera_count = calib["camera_count"]
                P_list = self._build_projection_matrices(calib)

        # Load per-camera keypoints
        output_dir = os.path.join(settings.OUTPUT_DIR, analysis_id)
        per_camera_keypoints = []
        for i in range(camera_count):
            kp_path = os.path.join(output_dir, f"keypoints_cam_{i}.json")
            if os.path.exists(kp_path):
                with open(kp_path, encoding="utf-8") as f:
                    per_camera_keypoints.append(json.load(f))
            else:
                # Try recording directory
                rec_dir = os.path.join(settings.RECORDING_DIR, analysis_id)
                kp_path = os.path.join(rec_dir, f"keypoints_cam_{i}.json")
                if os.path.exists(kp_path):
                    with open(kp_path, encoding="utf-8") as f:
                        per_camera_keypoints.append(json.load(f))
                else:
                    raise FileNotFoundError(
                        f"Keypoints for camera {i} not found at {kp_path}"
                    )

        if len(per_camera_keypoints) < 2:
            raise ValueError(
                f"Need at least 2 camera views for triangulation, "
                f"got {len(per_camera_keypoints)}"
            )

        # Find the minimum number of frames across all cameras
        min_frames = min(len(kp["frames"]) for kp in per_camera_keypoints)

        # Triangulate frame by frame
        frames_3d = []
        total_triangulated = 0
        total_landmarks = 0

        for frame_idx in range(min_frames):
            # Collect 2D points for this frame across cameras
            all_pts_2d = []  # shape: (num_cameras, 33, 2) with None for missing
            all_vis = []     # shape: (num_cameras, 33)

            for cam_idx in range(camera_count):
                frames = per_camera_keypoints[cam_idx]["frames"]
                frame = frames[frame_idx] if frame_idx < len(frames) else None

                pts_2d = []
                vis = []
                if frame and frame.get("detected") and frame.get("landmarks"):
                    for lm in frame["landmarks"]:
                        pts_2d.append([lm["x"], lm["y"]])
                        vis.append(lm.get("visibility", 0))
                else:
                    for _ in range(33):
                        pts_2d.append(None)
                        vis.append(0)

                all_pts_2d.append(pts_2d)
                all_vis.append(vis)

            # Triangulate each of the 33 landmarks
            landmarks_3d = []
            for lm_idx in range(33):
                lm_3d = self._triangulate_landmark(
                    all_pts_2d, all_vis, lm_idx, P_list
                )
                if lm_3d is not None:
                    landmarks_3d.append(lm_3d)
                    total_triangulated += 1
                total_landmarks += 1

            # Get timestamp from first camera
            ts = per_camera_keypoints[0]["frames"][frame_idx].get("timestamp_ms", 0)

            frame_data = serialize_frame_landmarks_3d(
                frame_idx, landmarks_3d, ts
            )
            frames_3d.append(frame_data)

        # Apply temporal smoothing
        frames_3d = self._smooth_trajectories(frames_3d)

        # Build metadata
        fps = per_camera_keypoints[0].get("metadata", {}).get("video_fps", 30)
        metadata = {
            "video_fps": fps,
            "total_frames": min_frames,
            "camera_count": camera_count,
            "calibration_session_id": calibration_session_id,
            "world_units": "normalized" if using_identity else "mm",
            "triangulation_rate": (
                round(total_triangulated / max(total_landmarks, 1), 4)
            ),
        }

        # Save
        output_path = os.path.join(output_dir, "keypoints_3d.json")
        data = serialize_all_frames_3d(frames_3d, metadata)
        os.makedirs(output_dir, exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

        return {
            "success": True,
            "keypoints_3d_path": output_path,
            "total_frames": min_frames,
            "frames_with_pose": data["metadata"]["frames_with_pose"],
            "triangulation_rate": metadata["triangulation_rate"],
        }

    def _triangulate_landmark(self, all_pts_2d: list, all_vis: list,
                               lm_idx: int, P_list: list[np.ndarray]) -> dict | None:
        """Triangulate a single landmark across camera views.

        Uses only cameras where the landmark is visible (visibility > threshold).
        Falls back gracefully when fewer than 2 views are available.
        """
        valid_views = []
        for cam_idx in range(len(P_list)):
            pt = all_pts_2d[cam_idx][lm_idx]
            vis = all_vis[cam_idx][lm_idx]
            if pt is not None and vis > self.confidence_threshold:
                valid_views.append(cam_idx)

        if len(valid_views) < 2:
            return None

        # Build linear system for DLT
        # For each camera: [x * P[2] - P[0]] * X = 0, [y * P[2] - P[1]] * X = 0
        A = []
        for cam_idx in valid_views:
            x, y = all_pts_2d[cam_idx][lm_idx]
            P = P_list[cam_idx]
            A.append(x * P[2] - P[0])
            A.append(y * P[2] - P[1])

        A = np.array(A)

        # SVD solution
        _, _, Vt = np.linalg.svd(A)
        X = Vt[-1]  # Last row of Vt = null space
        X = X / X[3]  # Homogeneous → Euclidean

        # Reprojection error
        errors = []
        for cam_idx in valid_views:
            P = P_list[cam_idx]
            projected = P @ X
            if abs(projected[2]) > 1e-8:
                proj_2d = projected[:2] / projected[2]
                actual = np.array(all_pts_2d[cam_idx][lm_idx])
                errors.append(np.linalg.norm(proj_2d - actual))

        mean_error = float(np.mean(errors)) if errors else 0.0
        avg_vis = float(np.mean([all_vis[c][lm_idx] for c in valid_views]))

        return {
            "id": lm_idx,
            "name": LANDMARK_NAMES.get(lm_idx, f"landmark_{lm_idx}"),
            "x": round(float(X[0]), 3),
            "y": round(float(X[1]), 3),
            "z": round(float(X[2]), 3),
            "visibility": round(avg_vis, 4),
            "reprojection_error": round(mean_error, 4),
        }

    def _build_projection_matrices(self, calib: dict) -> list[np.ndarray]:
        """Build 3x4 projection matrices from calibration data.

        P = K * [R | t] where K is intrinsic, R/t are extrinsic.
        """
        P_list = []
        cameras = calib.get("cameras", [])
        extrinsics = calib.get("extrinsics", [])

        for i, cam in enumerate(cameras):
            K = np.array(cam["intrinsic_matrix"], dtype=np.float64)

            ext = extrinsics[i] if i < len(extrinsics) else {
                "rotation": [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
                "translation": [0, 0, 0],
            }
            R = np.array(ext["rotation"], dtype=np.float64)
            t = np.array(ext["translation"], dtype=np.float64).reshape(3, 1)

            Rt = np.hstack([R, t])
            P = K @ Rt
            P_list.append(P)

        return P_list

    def _smooth_trajectories(self, frames_3d: list[dict]) -> list[dict]:
        """Apply Butterworth low-pass filter to smooth 3D trajectories."""
        if len(frames_3d) < 10:
            return frames_3d

        # Collect trajectories per landmark
        num_landmarks = 33
        trajectories = {lm_idx: {"x": [], "y": [], "z": []}
                        for lm_idx in range(num_landmarks)}

        for frame in frames_3d:
            lm_map = {}
            for lm in frame.get("landmarks", []):
                lm_map[lm["id"]] = lm
            for lm_idx in range(num_landmarks):
                lm = lm_map.get(lm_idx)
                if lm:
                    trajectories[lm_idx]["x"].append(lm["x"])
                    trajectories[lm_idx]["y"].append(lm["y"])
                    trajectories[lm_idx]["z"].append(lm["z"])
                else:
                    trajectories[lm_idx]["x"].append(None)
                    trajectories[lm_idx]["y"].append(None)
                    trajectories[lm_idx]["z"].append(None)

        # Design filter
        fps = 30.0
        nyquist = fps / 2
        cutoff = self.smoothing_cutoff_hz / nyquist
        if cutoff >= 1.0:
            return frames_3d
        b, a = butter(4, cutoff, btype="low")

        # Filter and replace
        for lm_idx in range(num_landmarks):
            for axis in ["x", "y", "z"]:
                traj = trajectories[lm_idx][axis]
                # Fill gaps with linear interpolation
                filled = self._fill_gaps(traj)
                if len(filled) > 15:
                    try:
                        smoothed = filtfilt(b, a, filled)
                    except ValueError:
                        smoothed = filled
                else:
                    smoothed = filled

                # Write back
                smooth_idx = 0
                for fi, frame in enumerate(frames_3d):
                    for lm in frame.get("landmarks", []):
                        if lm["id"] == lm_idx:
                            if smooth_idx < len(smoothed):
                                lm[axis] = round(float(smoothed[smooth_idx]), 3)
                            smooth_idx += 1
                            break

        return frames_3d

    @staticmethod
    def _fill_gaps(traj: list) -> np.ndarray:
        """Linear interpolation to fill None gaps in a trajectory."""
        arr = np.array([t if t is not None else np.nan for t in traj])
        nans = np.isnan(arr)
        if nans.all():
            return np.zeros_like(arr)
        if nans.any():
            ok = ~nans
            xp = ok.nonzero()[0]
            fp = arr[ok]
            x = nans.nonzero()[0]
            arr[nans] = np.interp(x, xp, fp)
        return arr
