"use client";

import { useState, useCallback } from "react";
import { useStore } from "@/lib/store";
import { uploadVideo, pollUntilComplete } from "@/lib/api";
import { useClientAnalysis } from "@/hooks/useClientAnalysis";
import { cn } from "@/lib/utils";

function isProduction(): boolean {
  if (typeof window === "undefined") return false;
  return (
    !window.location.hostname.includes("localhost") &&
    !window.location.hostname.includes("127.0.0.1")
  );
}

interface VideoUploaderProps {
  exerciseId?: string;
  exerciseName?: string;
  onComplete?: (analysisId: string) => void;
}

export function VideoUploader({
  exerciseId,
  exerciseName,
  onComplete,
}: VideoUploaderProps) {
  const { upload, setUpload } = useStore();
  const [dragOver, setDragOver] = useState(false);

  // Client-side analysis hook (used in production/Vercel)
  const clientAnalysis = useClientAnalysis();

  const handleFile = useCallback(
    async (file: File) => {
      // Validate
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!ext || !["mp4", "mov"].includes(ext)) {
        setUpload({
          error:
            "Please upload an MP4 or MOV file. (请上传 MP4 或 MOV 格式的视频)",
        });
        return;
      }
      if (file.size > 500 * 1024 * 1024) {
        setUpload({
          error: "File size must be under 500MB. (文件大小不能超过 500MB)",
        });
        return;
      }

      // ── Production: Client-side MediaPipe analysis ──
      if (isProduction()) {
        setUpload({
          file,
          status: "uploading", // reuse uploading state for model loading
          progress: 0,
          error: null,
          analysisId: null,
        });

        const result = await clientAnalysis.analyze(
          file,
          exerciseId,
          exerciseName
        );

        if (!result) {
          // Aborted or failed
          setUpload({
            status: "error",
            error: clientAnalysis.error || "Analysis failed. (分析失败)",
          });
          return;
        }

        setUpload({
          status: "completed",
          progress: 100,
          analysisId: result.analysis_id,
        });

        onComplete?.(result.analysis_id);
        return;
      }

      // ── Development: Upload to Python backend ──
      setUpload({ file, status: "uploading", progress: 0, error: null });

      try {
        const uploadResult = await uploadVideo(file, exerciseId, (pct) => {
          setUpload({ progress: pct });
        });

        setUpload({
          status: "processing",
          analysisId: uploadResult.analysis_id,
        });

        const finalResult = await pollUntilComplete(uploadResult.analysis_id);
        if (finalResult.status === "failed") {
          setUpload({
            status: "error",
            error:
              "Analysis failed. Please try again with a clearer video. (分析失败，请使用更清晰的视频重试)",
          });
        } else {
          setUpload({ status: "completed" });
          onComplete?.(uploadResult.analysis_id);
        }
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Upload failed (上传失败)";
        setUpload({ status: "error", error: msg });
      }
    },
    [setUpload, exerciseId, exerciseName, onComplete, clientAnalysis]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  // Determine the effective status for UI rendering
  // When using client analysis, map loading_model → show loading UI
  const effectiveStatus =
    clientAnalysis.status === "loading_model" && upload.status === "uploading"
      ? "uploading" // reuse uploading spinner for model loading
      : clientAnalysis.status === "processing" && upload.status === "uploading"
        ? "processing" // reuse processing state
        : upload.status;

  // Effective progress and message
  const effectiveProgress =
    clientAnalysis.status !== "idle" && clientAnalysis.status !== "error"
      ? clientAnalysis.progress
      : upload.progress;

  const effectiveMessage =
    clientAnalysis.status !== "idle" && clientAnalysis.message
      ? clientAnalysis.message
      : upload.status === "uploading"
        ? "Uploading... (上传中...)"
        : "";

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Drop zone */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer",
          "bg-slate-900/50 backdrop-blur-sm",
          dragOver
            ? "border-amber-400 bg-amber-500/5"
            : upload.error
              ? "border-red-500/50"
              : "border-slate-700 hover:border-slate-500"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById("video-upload")?.click()}
      >
        <input
          id="video-upload"
          type="file"
          accept=".mp4,.mov"
          className="hidden"
          onChange={handleChange}
          capture="environment"
        />

        {/* ── Idle State ── */}
        {effectiveStatus === "idle" && (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-amber-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
            </div>
            <div>
              <p className="text-lg font-medium text-slate-200">
                Drop your exercise video here
              </p>
              <p className="text-sm text-slate-400 mt-1">
                拖放你的训练视频到这里
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                MP4 or MOV, up to 500MB · Analysis runs in your browser
              </p>
            </div>
            <button className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium transition-colors">
              Choose Video
            </button>
          </div>
        )}

        {/* ── Loading Model / Uploading State ── */}
        {effectiveStatus === "uploading" && (
          <div className="space-y-4">
            <div className="w-12 h-12 mx-auto border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-amber-400 font-medium">{effectiveMessage}</p>
            {effectiveProgress > 0 && (
              <div className="w-full max-w-xs mx-auto bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-300"
                  style={{ width: `${effectiveProgress}%` }}
                />
              </div>
            )}
            {effectiveProgress > 0 && (
              <p className="text-sm text-slate-500">{effectiveProgress}%</p>
            )}
          </div>
        )}

        {/* ── Processing State ── */}
        {effectiveStatus === "processing" && (
          <div className="space-y-4">
            <div className="w-12 h-12 mx-auto border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-amber-400 font-medium">
              Analyzing Movement... (动作分析中...)
            </p>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              {effectiveMessage ||
                "Extracting pose keypoints and analyzing biomechanics"}
            </p>
            <div className="w-full max-w-xs mx-auto bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-300"
                style={{ width: `${effectiveProgress}%` }}
              />
            </div>
            <p className="text-sm text-slate-500">{effectiveProgress}%</p>
          </div>
        )}

        {/* ── Completed State ── */}
        {effectiveStatus === "completed" && (
          <div className="space-y-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-green-400 font-medium">Analysis Complete!</p>
          </div>
        )}

        {/* ── Error State ── */}
        {effectiveStatus === "error" && (
          <div className="space-y-3">
            <p className="text-red-400 font-medium">Analysis Failed</p>
            <p className="text-sm text-slate-400">{upload.error}</p>
            <button
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                clientAnalysis.reset();
                setUpload({
                  status: "idle",
                  error: null,
                  file: null,
                  progress: 0,
                  analysisId: null,
                });
              }}
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Privacy notice — shown in production */}
      {isProduction() && effectiveStatus === "idle" && (
        <p className="text-[10px] text-slate-600 text-center mt-3 px-4">
          🔒 Your video stays on your device. Analysis runs entirely in your
          browser — nothing is uploaded to any server.
          <br />
          您的视频保留在设备上，所有分析均在浏览器中完成，不会上传至任何服务器。
        </p>
      )}
    </div>
  );
}
