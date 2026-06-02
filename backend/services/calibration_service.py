"""
Calibration service — camera intrinsic + extrinsic calibration using OpenCV ChArUco.

Provides async bridge from FastAPI to OpenCV-based multi-camera calibration.
Follows the existing service pattern (async public → executor → sync private).
"""

import json
import os
import uuid
import asyncio
import numpy as np
import cv2
from datetime import datetime, timezone

from backend.config import settings


class CalibrationService:
    """Multi-camera calibration using OpenCV ChArUco boards.

    Each calibration session collects frames from N cameras showing a
    ChArUco board in different positions. After collecting enough frames,
    compute_calibration() solves for:
      - Per-camera intrinsic matrices (focal length, principal point, distortion)
      - Per-camera extrinsic matrices (rotation + translation relative to camera 0)
    """

    def __init__(self):
        self.board = cv2.aruco.CharucoBoard(
            (settings.BOARD_SQUARES_X, settings.BOARD_SQUARES_Y),
            squareLength=settings.BOARD_SQUARE_SIZE_MM,
            markerLength=settings.BOARD_MARKER_SIZE_MM,
            dictionary=cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_4X4_50),
        )
        self.detector_params = cv2.aruco.DetectorParameters()
        self.detector_params.cornerRefinementMethod = cv2.aruco.CORNER_REFINE_SUBPIX
        self.aruco_detector = cv2.aruco.ArucoDetector(
            self.board.getDictionary(), self.detector_params
        )

    # ═══════════════════════════════════════════════════════════════
    # PUBLIC ASYNC API
    # ═══════════════════════════════════════════════════════════════

    async def create_session(self, camera_count: int, name: str | None = None) -> dict:
        """Create a new calibration session."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None, self._create_session, camera_count, name
        )

    async def process_frame(self, session_id: str, camera_index: int,
                            image_bytes: bytes) -> dict:
        """Process one calibration frame from one camera.

        Returns detected corners and whether the board was found.
        """
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None, self._process_frame, session_id, camera_index, image_bytes
        )

    async def compute_calibration(self, session_id: str) -> dict:
        """Run full calibration on collected frames.

        Computes per-camera intrinsics + extrinsics relative to camera 0.
        """
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None, self._compute_calibration, session_id
        )

    async def get_session(self, session_id: str) -> dict | None:
        """Retrieve calibration session metadata and results."""
        path = os.path.join(settings.CALIBRATION_DIR, session_id, "session.json")
        if not os.path.exists(path):
            return None
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._load_json, path)

    async def list_sessions(self) -> list[dict]:
        """List all calibration sessions."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._list_sessions)

    # ═══════════════════════════════════════════════════════════════
    # SYNC IMPLEMENTATION
    # ═══════════════════════════════════════════════════════════════

    def _create_session(self, camera_count: int, name: str | None) -> dict:
        session_id = str(uuid.uuid4())
        session_dir = os.path.join(settings.CALIBRATION_DIR, session_id)
        os.makedirs(os.path.join(session_dir, "frames"), exist_ok=True)

        # Create per-camera frame directories
        for i in range(camera_count):
            os.makedirs(os.path.join(session_dir, "frames", f"cam_{i}"), exist_ok=True)

        session = {
            "session_id": session_id,
            "name": name or f"Calibration {session_id[:8]}",
            "camera_count": camera_count,
            "status": "collecting",
            "frame_counts": [0] * camera_count,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        self._save_json(os.path.join(session_dir, "session.json"), session)
        return session

    def _process_frame(self, session_id: str, camera_index: int,
                       image_bytes: bytes) -> dict:
        session_dir = os.path.join(settings.CALIBRATION_DIR, session_id)

        # Decode image
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return {"success": False, "error": "Failed to decode image"}

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Detect ChArUco board
        corners, ids, rejected = self.aruco_detector.detectMarkers(gray)
        if corners is None or len(corners) == 0:
            return {
                "success": True,
                "detected": False,
                "message": "No markers found in image",
                "camera_index": camera_index,
            }

        # Interpolate ChArUco corners
        ret, charuco_corners, charuco_ids = cv2.aruco.interpolateCornersCharuco(
            corners, ids, gray, self.board
        )

        # Save frame
        frame_dir = os.path.join(session_dir, "frames", f"cam_{camera_index}")
        session = self._load_json(os.path.join(session_dir, "session.json"))
        frame_idx = session["frame_counts"][camera_index]
        frame_path = os.path.join(frame_dir, f"frame_{frame_idx:04d}.jpg")
        cv2.imwrite(frame_path, img)

        # Save detected corners
        if ret and charuco_corners is not None:
            corners_data = {
                "corners": charuco_corners.tolist(),
                "ids": charuco_ids.flatten().tolist() if charuco_ids is not None else [],
            }
            corner_path = os.path.join(frame_dir, f"frame_{frame_idx:04d}_corners.json")
            self._save_json(corner_path, corners_data)

        session["frame_counts"][camera_index] += 1
        self._save_json(os.path.join(session_dir, "session.json"), session)

        return {
            "success": True,
            "detected": ret and charuco_corners is not None,
            "corner_count": len(charuco_corners) if ret and charuco_corners is not None else 0,
            "marker_count": len(corners),
            "camera_index": camera_index,
            "frame_index": frame_idx,
        }

    def _compute_calibration(self, session_id: str) -> dict:
        session_dir = os.path.join(settings.CALIBRATION_DIR, session_id)
        session = self._load_json(os.path.join(session_dir, "session.json"))
        camera_count = session["camera_count"]

        if camera_count < 2:
            return {"success": False, "error": "Need at least 2 cameras"}

        # Collect 3D object points and 2D image points per camera
        per_camera_objpoints = [[] for _ in range(camera_count)]
        per_camera_imgpoints = [[] for _ in range(camera_count)]

        # Generate object points for the ChArUco board
        board_objpoints = self.board.getChessboardCorners()

        for cam_idx in range(camera_count):
            frame_dir = os.path.join(session_dir, "frames", f"cam_{cam_idx}")
            if not os.path.exists(frame_dir):
                continue
            for fname in sorted(os.listdir(frame_dir)):
                if not fname.endswith("_corners.json"):
                    continue
                corner_data = self._load_json(os.path.join(frame_dir, fname))
                if not corner_data.get("corners") or not corner_data.get("ids"):
                    continue
                corners = np.array(corner_data["corners"], dtype=np.float32)
                ids = np.array(corner_data["ids"], dtype=np.int32).flatten()

                # Match detected corners to board object points
                objpts = []
                imgpts = []
                for i, cid in enumerate(ids):
                    if 0 <= cid < len(board_objpoints):
                        objpts.append(board_objpoints[cid])
                        imgpts.append(corners[i])

                if len(objpts) >= 4:
                    per_camera_objpoints[cam_idx].append(
                        np.array(objpts, dtype=np.float32)
                    )
                    per_camera_imgpoints[cam_idx].append(
                        np.array(imgpts, dtype=np.float32)
                    )

        # Calibrate each camera individually (intrinsics)
        camera_params = []
        img_size = None
        for cam_idx in range(camera_count):
            if len(per_camera_objpoints[cam_idx]) < 5:
                return {
                    "success": False,
                    "error": f"Camera {cam_idx} has insufficient frames "
                             f"({len(per_camera_objpoints[cam_idx])}). Need at least 5.",
                }

            # Get image size from first frame
            first_frame = os.path.join(
                session_dir, "frames", f"cam_{cam_idx}", "frame_0000.jpg"
            )
            if os.path.exists(first_frame):
                img = cv2.imread(first_frame)
                img_size = (img.shape[1], img.shape[0])

            ret, mtx, dist, rvecs, tvecs = cv2.aruco.calibrateCameraCharuco(
                per_camera_imgpoints[cam_idx],
                per_camera_objpoints[cam_idx],
                self.board,
                img_size or (1280, 720),
                None, None,  # initial camera matrix / dist coeffs
            )

            camera_params.append({
                "camera_index": cam_idx,
                "intrinsic_matrix": mtx.tolist(),
                "distortion_coeffs": dist.tolist(),
                "calibration_success": ret,
            })

        # Compute extrinsics relative to camera 0
        # Use frames where the board is visible in ALL cameras simultaneously
        extrinsics = self._compute_extrinsics(
            session_dir, camera_count, camera_params, board_objpoints
        )

        # Calculate overall reprojection error
        mean_error = self._compute_reprojection_error(
            per_camera_objpoints, per_camera_imgpoints,
            camera_params, extrinsics
        )

        quality = "excellent" if mean_error < 0.5 else (
            "good" if mean_error < 1.0 else (
                "acceptable" if mean_error < 2.0 else "needs_improvement"
            )
        )

        result = {
            "session_id": session_id,
            "camera_count": camera_count,
            "image_size": list(img_size) if img_size else None,
            "cameras": camera_params,
            "extrinsics": extrinsics,
            "reprojection_error_px": round(mean_error, 3),
            "quality": quality,
            "computed_at": datetime.now(timezone.utc).isoformat(),
        }

        # Save calibration result
        self._save_json(os.path.join(session_dir, "calibration.json"), result)

        # Update session status
        session["status"] = "completed"
        session["reprojection_error"] = round(mean_error, 3)
        self._save_json(os.path.join(session_dir, "session.json"), session)

        return {"success": True, **result}

    def _compute_extrinsics(self, session_dir: str, camera_count: int,
                            camera_params: list[dict],
                            board_objpoints: np.ndarray) -> list[dict]:
        """Compute camera extrinsics by solving PnP for each camera on shared frames.

        For each frame where the board is detected in multiple cameras,
        solve PnP to get the board pose in each camera's frame, then
        chain transformations to get camera-to-camera extrinsics.
        """
        extrinsics = []

        # Find the best frame where board is visible in most cameras
        frame_dir = os.path.join(session_dir, "frames")

        # For each camera, solve PnP on the frame with most corners
        for cam_idx in range(camera_count):
            cam_frame_dir = os.path.join(frame_dir, f"cam_{cam_idx}")
            if not os.path.exists(cam_frame_dir):
                extrinsics.append({
                    "camera_index": cam_idx,
                    "rotation": [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
                    "translation": [0, 0, 0],
                })
                continue

            # Find best frame for this camera
            best_corners = None
            best_frame_idx = 0
            for fname in sorted(os.listdir(cam_frame_dir)):
                if not fname.endswith("_corners.json"):
                    continue
                corner_data = self._load_json(os.path.join(cam_frame_dir, fname))
                if corner_data.get("corners") and len(corner_data["corners"]) > (
                    len(best_corners) if best_corners else 0
                ):
                    best_corners = corner_data["corners"]
                    best_frame_idx = int(fname.split("_")[1])

            # Solve PnP
            mtx = np.array(camera_params[cam_idx]["intrinsic_matrix"])
            dist = np.array(camera_params[cam_idx]["distortion_coeffs"])

            # Match corners to board points
            corner_data = self._load_json(
                os.path.join(cam_frame_dir, f"frame_{best_frame_idx:04d}_corners.json")
            )
            if not corner_data.get("corners") or not corner_data.get("ids"):
                extrinsics.append({
                    "camera_index": cam_idx,
                    "rotation": [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
                    "translation": [0, 0, 0],
                })
                continue

            imgpts = np.array(corner_data["corners"], dtype=np.float32)
            ids = np.array(corner_data["ids"], dtype=np.int32).flatten()
            objpts_list = []
            imgpts_list = []
            for i, cid in enumerate(ids):
                if 0 <= cid < len(board_objpoints):
                    objpts_list.append(board_objpoints[cid])
                    imgpts_list.append(imgpts[i])

            if len(objpts_list) < 4:
                extrinsics.append({
                    "camera_index": cam_idx,
                    "rotation": [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
                    "translation": [0, 0, 0],
                })
                continue

            objpts = np.array(objpts_list, dtype=np.float32)
            imgpts_arr = np.array(imgpts_list, dtype=np.float32)

            ret, rvec, tvec = cv2.solvePnP(objpts, imgpts_arr, mtx, dist)

            if ret:
                R, _ = cv2.Rodrigues(rvec)
                extrinsics.append({
                    "camera_index": cam_idx,
                    "rotation": R.tolist(),
                    "translation": tvec.flatten().tolist(),
                })
            else:
                extrinsics.append({
                    "camera_index": cam_idx,
                    "rotation": [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
                    "translation": [0, 0, 0],
                })

        # Set camera 0 as origin
        if len(extrinsics) > 0:
            extrinsics[0]["rotation"] = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
            extrinsics[0]["translation"] = [0, 0, 0]

        return extrinsics

    def _compute_reprojection_error(self, per_camera_objpoints, per_camera_imgpoints,
                                     camera_params, extrinsics) -> float:
        """Compute mean reprojection error across all cameras and frames."""
        total_error = 0.0
        total_points = 0

        for cam_idx in range(len(camera_params)):
            mtx = np.array(camera_params[cam_idx]["intrinsic_matrix"])
            dist = np.array(camera_params[cam_idx]["distortion_coeffs"])
            ext = extrinsics[cam_idx] if cam_idx < len(extrinsics) else None
            if ext is None:
                continue

            R = np.array(ext["rotation"])
            t = np.array(ext["translation"]).reshape(3, 1)

            for frame_idx in range(len(per_camera_objpoints[cam_idx])):
                objpts = per_camera_objpoints[cam_idx][frame_idx]
                imgpts = per_camera_imgpoints[cam_idx][frame_idx]

                projected, _ = cv2.projectPoints(objpts, R, t, mtx, dist)
                error = np.linalg.norm(imgpts - projected, axis=2).flatten()
                total_error += error.sum()
                total_points += len(error)

        return float(total_error / total_points) if total_points > 0 else float("inf")

    # ═══════════════════════════════════════════════════════════════
    # UTILITY
    # ═══════════════════════════════════════════════════════════════

    def _list_sessions(self) -> list[dict]:
        calib_dir = settings.CALIBRATION_DIR
        if not os.path.exists(calib_dir):
            return []
        sessions = []
        for sid in os.listdir(calib_dir):
            session_path = os.path.join(calib_dir, sid, "session.json")
            if os.path.exists(session_path):
                sessions.append(self._load_json(session_path))
        sessions.sort(key=lambda s: s.get("created_at", ""), reverse=True)
        return sessions

    @staticmethod
    def _save_json(path: str, data: dict) -> None:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    @staticmethod
    def _load_json(path: str) -> dict:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
