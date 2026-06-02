"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  CheckCircle,
  AlertTriangle,
  Play,
} from "lucide-react";
import type { CameraInfo, CalibrationSession } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function CalibratePage() {
  const [cameras, setCameras] = useState<CameraInfo[]>([]);
  const [selectedCameras, setSelectedCameras] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("idle");
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<CalibrationSession[]>([]);

  useEffect(() => {
    fetchCameras();
    fetchSessions();
  }, []);

  const fetchCameras = async () => {
    try {
      const res = await fetch(`${API_BASE}/recording/cameras`);
      const data = await res.json();
      setCameras(data.cameras || []);
    } catch {
      setError("Failed to detect cameras");
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await fetch(`${API_BASE}/calibration/sessions`);
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch {}
  };

  const toggleCamera = (index: number) => {
    setSelectedCameras((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const createSession = async () => {
    if (selectedCameras.size < 2) {
      setError("Select at least 2 cameras");
      return;
    }
    setError(null);
    setStatus("creating");
    try {
      const res = await fetch(
        `${API_BASE}/calibration/sessions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            camera_count: selectedCameras.size,
            name: `Calibration ${new Date().toLocaleDateString()}`,
          }),
        }
      );
      const data = await res.json();
      setSessionId(data.session_id);
      setStatus("collecting");
      fetchSessions();
    } catch {
      setError("Failed to create calibration session");
      setStatus("idle");
    }
  };

  const computeCalibration = async () => {
    if (!sessionId) return;
    setStatus("computing");
    try {
      const res = await fetch(
        `${API_BASE}/calibration/sessions/${sessionId}/compute`,
        { method: "POST" }
      );
      const data = await res.json();
      if (data.success) {
        setStatus("completed");
        fetchSessions();
      } else {
        setError(data.error || "Calibration failed");
        setStatus("collecting");
      }
    } catch {
      setError("Failed to compute calibration");
      setStatus("collecting");
    }
  };

  return (
    <div className="min-h-screen max-w-2xl mx-auto px-4 py-8">
      <Link
        href="/record"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-amber-400 transition-colors group mb-8"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm">Back to Recording 返回录制</span>
      </Link>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Camera Calibration
          <span className="text-amber-400 text-lg font-normal ml-2">相机标定</span>
        </h1>
        <p className="text-slate-400 text-sm">
          Calibrate multiple cameras for 3D motion capture using a ChArUco board
        </p>
      </div>

      {/* Camera Selection */}
      <div className="bg-slate-900/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <Camera className="w-4 h-4 text-amber-400" />
          Step 1: Select Cameras
          <span className="text-amber-400 text-xs font-normal">选择摄像头</span>
        </h2>

        {loading ? (
          <div className="flex justify-center py-4">
            <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : cameras.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-4">
            No cameras detected. Connect USB cameras and refresh.
          </p>
        ) : (
          <div className="space-y-2 mb-4">
            {cameras.map((cam) => (
              <button
                key={cam.index}
                onClick={() => toggleCamera(cam.index)}
                disabled={status !== "idle"}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                  selectedCameras.has(cam.index)
                    ? "border-amber-500/50 bg-amber-500/10"
                    : "border-slate-700/50 bg-slate-800/30"
                } ${status !== "idle" ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <span className="text-sm text-white">{cam.name}</span>
                <span className="text-xs text-slate-500">
                  {cam.max_width}x{cam.max_height}
                </span>
              </button>
            ))}
          </div>
        )}

        <button
          onClick={createSession}
          disabled={selectedCameras.size < 2 || status !== "idle" || loading}
          className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl text-sm font-medium transition-colors"
        >
          Create Calibration Session ({selectedCameras.size} cameras)
        </button>
      </div>

      {/* Status & Compute */}
      {sessionId && (
        <div className="bg-slate-900/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">
            Step 2: Capture & Calibrate
          </h2>

          {status === "collecting" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-amber-400 text-sm">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Ready to calibrate
              </div>
              <p className="text-xs text-slate-500">
                Session ID: {sessionId}
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                Show the ChArUco board to all cameras. Use the recording page to
                capture synchronized calibration frames, then come back here to
                compute the calibration.
              </p>
              <button
                onClick={computeCalibration}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <Play className="w-4 h-4" />
                Compute Calibration 开始标定
              </button>
            </div>
          )}

          {status === "computing" && (
            <div className="flex items-center justify-center py-6 gap-3">
              <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-slate-400">Computing calibration...</span>
            </div>
          )}

          {status === "completed" && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 text-sm">
                <CheckCircle className="w-4 h-4" />
                Calibration Complete!
              </div>
              <p className="text-xs text-slate-500">
                Session ID: {sessionId}
              </p>
              <Link
                href="/record"
                className="inline-block mt-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium transition-colors"
              >
                Go to Recording 去录制
              </Link>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg mb-6">
          <p className="text-sm text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </p>
        </div>
      )}

      {/* Saved Sessions */}
      {sessions.length > 0 && (
        <div className="bg-slate-900/30 border border-white/5 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-slate-500 mb-3">
            Saved Calibrations 已保存的标定
          </h3>
          <div className="space-y-2">
            {sessions.slice(0, 5).map((s) => (
              <div
                key={s.session_id}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-slate-400">{s.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-slate-600">{s.camera_count} cameras</span>
                  <span
                    className={
                      s.status === "completed"
                        ? "text-emerald-400"
                        : "text-amber-400"
                    }
                  >
                    {s.status}
                  </span>
                  {s.reprojection_error != null && (
                    <span className="text-slate-500">
                      {s.reprojection_error.toFixed(2)}px
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
