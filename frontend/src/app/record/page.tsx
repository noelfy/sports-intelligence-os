"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Video,
  StopCircle,
  Camera,
  Wifi,
  WifiOff,
} from "lucide-react";

interface CameraInfo {
  index: number;
  name: string;
  max_width: number;
  max_height: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function RecordPage() {
  const router = useRouter();
  const [cameras, setCameras] = useState<CameraInfo[]>([]);
  const [selectedCameras, setSelectedCameras] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(false);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Discover cameras on mount
  useEffect(() => {
    fetchCameras();
  }, []);

  // Timer during recording
  useEffect(() => {
    if (!recording) return;
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [recording]);

  const fetchCameras = async () => {
    try {
      const res = await fetch(`${API_BASE}/recording/cameras`);
      const data = await res.json();
      setCameras(data.cameras || []);
    } catch {
      setError("Failed to detect cameras. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const toggleCamera = (index: number) => {
    setSelectedCameras((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const startRecording = async () => {
    if (selectedCameras.size === 0) {
      setError("Select at least one camera");
      return;
    }
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/recording/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          camera_ids: Array.from(selectedCameras),
          exercise_id: "general",
          fps: 30,
          width: 1280,
          height: 720,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAnalysisId(data.analysis_id);
        setRecording(true);
        setElapsed(0);
      } else {
        setError(data.error || "Failed to start recording");
      }
    } catch (e) {
      setError("Failed to start recording. Check backend connection.");
    }
  };

  const stopRecording = async () => {
    if (!analysisId) return;
    try {
      const res = await fetch(
        `${API_BASE}/recording/${analysisId}/stop`,
        { method: "POST" }
      );
      const data = await res.json();
      if (data.success) {
        setRecording(false);
        router.push(`/results/${analysisId}`);
      } else {
        setError(data.error || "Failed to stop recording");
      }
    } catch {
      setError("Failed to stop recording.");
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen max-w-2xl mx-auto px-4 py-8">
      {/* Back */}
      <Link
        href="/upload"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-amber-400 transition-colors group mb-8"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm">Back to Upload 返回上传</span>
      </Link>

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Multi-Camera Recording
          <span className="text-amber-400 text-lg font-normal ml-2">多相机录制</span>
        </h1>
        <p className="text-slate-400 text-sm">
          Record synchronized video from multiple USB cameras for 3D motion capture
        </p>
      </div>

      {/* Camera Detection */}
      <div className="bg-slate-900/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <Camera className="w-4 h-4 text-amber-400" />
          Available Cameras
          <span className="text-amber-400 text-xs font-normal">可用摄像头</span>
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : cameras.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <WifiOff className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-slate-500 text-sm">No cameras detected</p>
            <p className="text-slate-600 text-xs">
              Connect USB cameras and refresh. (连接USB摄像头后刷新)
            </p>
            <button
              onClick={fetchCameras}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors"
            >
              Refresh 刷新
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {cameras.map((cam) => (
              <button
                key={cam.index}
                onClick={() => toggleCamera(cam.index)}
                disabled={recording}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                  selectedCameras.has(cam.index)
                    ? "border-amber-500/50 bg-amber-500/10"
                    : "border-slate-700/50 bg-slate-800/30 hover:border-slate-600/50"
                } ${recording ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      selectedCameras.has(cam.index)
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-slate-700/50 text-slate-500"
                    }`}
                  >
                    <Video className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-white font-medium">{cam.name}</p>
                    <p className="text-xs text-slate-500">
                      {cam.max_width}x{cam.max_height} · Camera {cam.index}
                    </p>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    selectedCameras.has(cam.index)
                      ? "border-amber-400 bg-amber-400"
                      : "border-slate-600"
                  }`}
                >
                  {selectedCameras.has(cam.index) && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Recording Controls */}
      <div className="bg-slate-900/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <Wifi className="w-4 h-4 text-amber-400" />
          Recording Controls
          <span className="text-amber-400 text-xs font-normal">录制控制</span>
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {recording ? (
          <div className="space-y-4">
            {/* Recording indicator */}
            <div className="flex items-center justify-center gap-3 py-4">
              <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse" />
              <span className="text-2xl font-mono text-white font-bold">
                {formatTime(elapsed)}
              </span>
              <span className="text-sm text-red-400 font-medium">REC</span>
            </div>

            <p className="text-center text-sm text-slate-400">
              Recording {selectedCameras.size} camera{selectedCameras.size > 1 ? "s" : ""}...
            </p>

            <button
              onClick={stopRecording}
              className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <StopCircle className="w-5 h-5" />
              Stop Recording 停止录制
            </button>
          </div>
        ) : (
          <button
            onClick={startRecording}
            disabled={selectedCameras.size === 0 || cameras.length === 0}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Video className="w-5 h-5" />
            Start Recording ({selectedCameras.size} camera{selectedCameras.size !== 1 ? "s" : ""})
            开始录制
          </button>
        )}
      </div>

      {/* Info */}
      <div className="bg-slate-900/30 border border-white/5 rounded-xl p-4">
        <p className="text-xs text-slate-600 leading-relaxed">
          💡 <span className="text-slate-500">For best 3D results:</span>{" "}
          Use 2-4 cameras positioned at different angles. Calibrate first using
          the calibration page for accurate 3D triangulation. Ensure good lighting
          and that the subject is visible in all cameras.
        </p>
      </div>
    </div>
  );
}
