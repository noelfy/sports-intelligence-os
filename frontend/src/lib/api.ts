import axios from "axios";
import type { AnalysisResult, HistoryItem } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

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

export async function uploadVideo(
  file: File,
  onProgress?: (pct: number) => void
): Promise<{ analysis_id: string; status: string; message: string }> {
  const formData = new FormData();
  formData.append("video", file);
  const { data } = await api.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => {
      if (e.total && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    },
  });
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

export function getKeypointsUrl(analysisId: string): string {
  return `${API_BASE}/files/keypoints/${analysisId}/keypoints.json`;
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
