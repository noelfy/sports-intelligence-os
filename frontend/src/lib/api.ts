import axios from "axios";
import type { AnalysisResult, HistoryItem } from "@/types";

// In production: API routes are served by Next.js on the same origin
// In development: proxy to Python backend
const API_BASE = process.env.NEXT_PUBLIC_API_URL || (
  typeof window !== "undefined" ? "/api" : "http://localhost:8000/api"
);

const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000,
});

// Attach JWT token from localStorage
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// === Upload ===

function isProduction(): boolean {
  if (typeof window === "undefined") return false;
  return !window.location.hostname.includes("localhost") && !window.location.hostname.includes("127.0.0.1");
}

export async function uploadVideo(
  file: File,
  exerciseId?: string,
  onProgress?: (pct: number) => void
): Promise<{ analysis_id: string; status: string; message: string }> {
  if (isProduction()) {
    // In production (Vercel), send JSON to avoid 4.5MB body size limit.
    // Real video processing requires the Python backend running locally.
    const { data } = await api.post("/upload", {
      filename: file.name,
      exercise_id: exerciseId || null,
    });
    return data;
  }

  // In development: send actual file via multipart (proxied to Python backend)
  const formData = new FormData();
  formData.append("video", file);
  if (exerciseId) {
    formData.append("exercise_id", exerciseId);
  }
  const { data } = await api.post("/upload", formData, {
    onUploadProgress: (e) => {
      if (e.total && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    },
  });
  return data;
}

// === Multi-Video Upload (3D) ===

export interface MultiUploadResult {
  analysis_id: string;
  status: string;
  camera_count: number;
  message: string;
}

export async function uploadMultiVideos(
  files: File[],
  calibrationSessionId?: string,
  exerciseId?: string,
  onProgress?: (pct: number) => void
): Promise<MultiUploadResult> {
  if (isProduction()) {
    // In production (Vercel), send JSON to avoid 4.5MB body size limit
    const { data } = await api.post("/upload/multi", {
      filenames: files.map((f) => f.name),
      camera_count: files.length,
      calibration_session_id: calibrationSessionId || null,
      exercise_id: exerciseId || null,
    });
    return data;
  }

  const formData = new FormData();
  files.forEach((file) => {
    formData.append("videos", file);
  });
  if (calibrationSessionId) {
    formData.append("calibration_session_id", calibrationSessionId);
  }
  if (exerciseId) {
    formData.append("exercise_id", exerciseId);
  }

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  let loadedTotal = 0;

  const { data } = await api.post("/upload/multi", formData, {
    onUploadProgress: (e) => {
      if (e.loaded && totalSize && onProgress) {
        // Track cumulative progress across all files
        loadedTotal = e.loaded;
        onProgress(Math.min(99, Math.round((loadedTotal / totalSize) * 100)));
      }
    },
  });
  return data;
}

// === Calibration ===

export interface CalibrationSessionSummary {
  session_id: string;
  name: string;
  camera_count: number;
  status: string;
  reprojection_error: number | null;
  frame_counts: number[];
  created_at: string;
}

export async function getCalibrationSessions(): Promise<CalibrationSessionSummary[]> {
  const { data } = await api.get("/calibration/sessions");
  return data;
}

// === Results ===

export async function getResult(analysisId: string): Promise<AnalysisResult> {
  const { data } = await api.get(`/results/${analysisId}`);
  return data;
}

export function getVideoUrl(analysisId: string, filename: string): string {
  return `${API_BASE}/files/videos/${analysisId}/${filename}`;
}

export function getKeypointsUrl(analysisId: string, filename = "keypoints.json"): string {
  return `${API_BASE}/files/keypoints/${analysisId}/${filename}`;
}

export async function pollUntilComplete(
  analysisId: string,
  intervalMs = 2000
): Promise<AnalysisResult> {
  return new Promise((resolve, reject) => {
    const poll = setInterval(async () => {
      try {
        const result = await getResult(analysisId);
        if (result.status === "completed" || result.status === "failed") {
          clearInterval(poll);
          resolve(result);
        }
      } catch (e) {
        clearInterval(poll);
        reject(e);
      }
    }, intervalMs);
  });
}

// === Auth ===

export async function registerUser(
  email: string,
  username: string,
  password: string
): Promise<{ access_token: string; user: Record<string, unknown> }> {
  const { data } = await api.post("/auth/register", { email, username, password });
  return data;
}

export async function loginUser(
  email: string,
  password: string
): Promise<{ access_token: string; user: Record<string, unknown> }> {
  const { data } = await api.post("/auth/login", { email, password });
  return data;
}

// === History ===

export async function getHistory(
  page = 1,
  limit = 20
): Promise<{ items: HistoryItem[]; total: number; page: number; pages: number }> {
  const { data } = await api.get("/history", { params: { page, limit } });
  return data;
}
