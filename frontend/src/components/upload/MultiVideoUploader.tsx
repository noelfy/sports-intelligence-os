"use client";

import { useState, useCallback, useRef } from "react";
import { useStore } from "@/lib/store";
import { uploadMultiVideos, pollUntilComplete } from "@/lib/api";
import { useClientAnalysis } from "@/hooks/useClientAnalysis";
import { cn } from "@/lib/utils";
import { Plus, X, Video, Upload, AlertCircle } from "lucide-react";

function isProduction(): boolean {
  if (typeof window === "undefined") return false;
  return (
    !window.location.hostname.includes("localhost") &&
    !window.location.hostname.includes("127.0.0.1")
  );
}

interface MultiVideoUploaderProps {
  calibrationSessionId?: string | null;
  exerciseId?: string;
  exerciseName?: string;
  onComplete?: (analysisId: string) => void;
}

interface VideoSlot {
  id: number;
  file: File | null;
  dragOver: boolean;
}

const MAX_CAMERAS = 4;
const MIN_CAMERAS = 1;

export function MultiVideoUploader({
  calibrationSessionId,
  exerciseId,
  exerciseName,
  onComplete,
}: MultiVideoUploaderProps) {
  const { upload, setUpload, resetUpload } = useStore();
  const [slots, setSlots] = useState<VideoSlot[]>([
    { id: 0, file: null, dragOver: false },
    { id: 1, file: null, dragOver: false },
  ]);
  const nextId = useRef(2);

  // Client-side analysis hook (used in production/Vercel)
  const clientAnalysis = useClientAnalysis();

  const filledCount = slots.filter((s) => s.file !== null).length;

  const addSlot = () => {
    if (slots.length >= MAX_CAMERAS) return;
    setSlots((prev) => [
      ...prev,
      { id: nextId.current++, file: null, dragOver: false },
    ]);
  };

  const removeSlot = (slotId: number) => {
    if (slots.length <= MIN_CAMERAS) return;
    setSlots((prev) => prev.filter((s) => s.id !== slotId));
  };

  const setSlotFile = (slotId: number, file: File | null) => {
    setSlots((prev) =>
      prev.map((s) => (s.id === slotId ? { ...s, file, dragOver: false } : s))
    );
  };

  const setSlotDragOver = (slotId: number, dragOver: boolean) => {
    setSlots((prev) =>
      prev.map((s) => (s.id === slotId ? { ...s, dragOver } : s))
    );
  };

  const validateFile = (file: File): string | null => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["mp4", "mov"].includes(ext)) {
      return "MP4 or MOV only (仅支持 MP4 或 MOV 格式)";
    }
    if (file.size > 500 * 1024 * 1024) {
      return "File must be under 500MB (文件不能超过 500MB)";
    }
    return null;
  };

  const handleFileForSlot = useCallback(
    (slotId: number, file: File) => {
      const error = validateFile(file);
      if (error) {
        setUpload({ error });
        return;
      }
      if (
        slots.some(
          (s) =>
            s.file?.name === file.name &&
            s.file?.size === file.size &&
            s.id !== slotId
        )
      ) {
        setUpload({
          error:
            "Duplicate file — each camera needs a different video (请选择不同的视频文件)",
        });
        return;
      }
      setSlotFile(slotId, file);
      setUpload({ error: null });
    },
    [slots, setUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, slotId: number) => {
      e.preventDefault();
      setSlotDragOver(slotId, false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileForSlot(slotId, file);
    },
    [handleFileForSlot]
  );

  const handleUpload = async () => {
    const filledSlots = slots.filter((s) => s.file !== null);
    if (filledSlots.length < MIN_CAMERAS) {
      setUpload({
        error: `Need at least ${MIN_CAMERAS} video (至少需要 ${MIN_CAMERAS} 个视频)`,
      });
      return;
    }

    const files = filledSlots.map((s) => s.file!);

    // ── Production: Client-side multi-camera MediaPipe analysis ──
    if (isProduction()) {
      setUpload({
        files,
        status: "uploading", // reuse for model loading
        progress: 0,
        error: null,
        analysisId: null,
      });

      const result = await clientAnalysis.analyzeMulti(
        files,
        exerciseId,
        exerciseName
      );

      if (!result) {
        setUpload({
          status: "error",
          error: clientAnalysis.error || "3D analysis failed. (3D分析失败)",
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
    setUpload({ files, status: "uploading", progress: 0, error: null });

    try {
      const result = await uploadMultiVideos(
        files,
        calibrationSessionId ?? undefined,
        exerciseId,
        (pct) => setUpload({ progress: pct })
      );

      setUpload({ status: "processing", analysisId: result.analysis_id });

      const finalResult = await pollUntilComplete(result.analysis_id);
      if (finalResult.status === "failed") {
        setUpload({
          status: "error",
          error:
            "3D analysis failed. Ensure videos are synchronized and show the same movement from different angles. (3D分析失败，请确保视频同步且从不同角度拍摄同一动作)",
        });
      } else {
        setUpload({ status: "completed" });
        onComplete?.(result.analysis_id);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Upload failed (上传失败)";
      setUpload({ status: "error", error: msg });
    }
  };

  const canUpload =
    filledCount >= MIN_CAMERAS &&
    upload.status !== "uploading" &&
    upload.status !== "processing";

  // Map client analysis states to upload status for UI
  const effectiveStatus =
    clientAnalysis.status === "loading_model" ||
    clientAnalysis.status === "processing"
      ? clientAnalysis.status === "loading_model"
        ? "uploading"
        : "processing"
      : upload.status;

  const effectiveProgress =
    clientAnalysis.status !== "idle" && clientAnalysis.status !== "error"
      ? clientAnalysis.progress
      : upload.progress;

  const effectiveMessage =
    clientAnalysis.status !== "idle" && clientAnalysis.message
      ? clientAnalysis.message
      : "";

  // ── Render ──
  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Camera slots grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {slots.map((slot, idx) => (
          <SlotCard
            key={slot.id}
            index={idx}
            slot={slot}
            onFile={(file) => handleFileForSlot(slot.id, file)}
            onRemove={() => removeSlot(slot.id)}
            onDragOver={(v) => setSlotDragOver(slot.id, v)}
            onDrop={(e) => handleDrop(e, slot.id)}
            canRemove={slots.length > MIN_CAMERAS}
            disabled={
              upload.status === "uploading" || upload.status === "processing"
            }
          />
        ))}
      </div>

      {/* Add camera button */}
      {slots.length < MAX_CAMERAS && upload.status === "idle" && (
        <button
          type="button"
          onClick={addSlot}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-slate-600 rounded-xl text-slate-500 hover:text-amber-400 hover:border-amber-500/50 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Camera {slots.length + 1} (添加机位)
        </button>
      )}

      {/* Error display (idle state) */}
      {upload.error && upload.status === "idle" && (
        <div className="flex items-start gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{upload.error}</p>
        </div>
      )}

      {/* Upload button */}
      {upload.status === "idle" && (
        <button
          type="button"
          disabled={!canUpload}
          onClick={handleUpload}
          className={cn(
            "w-full py-3 rounded-xl text-sm font-medium transition-all",
            canUpload
              ? "bg-amber-500 hover:bg-amber-600 text-white"
              : "bg-slate-800 text-slate-600 cursor-not-allowed"
          )}
        >
          {filledCount >= MIN_CAMERAS
            ? `Start ${
                filledCount >= 2 ? "3D" : ""
              } Analysis with ${filledCount} Camera${filledCount > 1 ? "s" : ""} (开始${
                filledCount >= 2 ? "3D" : ""
              }分析)`
            : `Select at least ${MIN_CAMERAS} video (至少选择 ${MIN_CAMERAS} 个视频)`}
        </button>
      )}

      {/* Uploading / Loading Model state */}
      {effectiveStatus === "uploading" && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-amber-400 text-sm font-medium">
              {effectiveMessage ||
                `Processing ${filledCount} videos... (处理${filledCount}个视频...)`}
            </p>
          </div>
          {effectiveProgress > 0 && (
            <>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-300"
                  style={{ width: `${effectiveProgress}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 text-center">
                {effectiveProgress}%
              </p>
            </>
          )}
        </div>
      )}

      {/* Processing state */}
      {effectiveStatus === "processing" && (
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 mx-auto border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <div>
            <p className="text-amber-400 font-medium">
              Processing {filledCount >= 2 ? "3D" : ""} Analysis... (
              {filledCount >= 2 ? "3D " : ""}动作分析中...)
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {effectiveMessage ||
                `Running pose estimation on ${filledCount} videos and biomechanical analysis`}
            </p>
          </div>
          {effectiveProgress > 0 && (
            <>
              <div className="w-full max-w-xs mx-auto bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-300"
                  style={{ width: `${effectiveProgress}%` }}
                />
              </div>
              <p className="text-xs text-slate-500">{effectiveProgress}%</p>
            </>
          )}
          <div className="flex justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      )}

      {/* Completed state */}
      {effectiveStatus === "completed" && (
        <div className="text-center space-y-2">
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
          <p className="text-green-400 font-medium">
            {filledCount >= 2 ? "3D" : ""} Analysis Complete! (
            {filledCount >= 2 ? "3D" : ""}分析完成)
          </p>
        </div>
      )}

      {/* Error during upload/processing */}
      {effectiveStatus === "error" && (
        <div className="space-y-3 text-center">
          <div className="flex items-start gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-left">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">
              {upload.error || "Analysis failed (分析失败)"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              clientAnalysis.reset();
              resetUpload();
            }}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors"
          >
            Try Again (重试)
          </button>
        </div>
      )}

      {/* Privacy notice — shown in production */}
      {isProduction() && upload.status === "idle" && (
        <p className="text-[10px] text-slate-600 text-center">
          🔒 Videos stay on your device. Analysis runs in your browser. Nothing
          is uploaded.
          <br />
          视频保留在设备上，分析在浏览器中完成，不进行上传。
        </p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Single Camera Slot Card
// ═══════════════════════════════════════════════════════════════

function SlotCard({
  index,
  slot,
  onFile,
  onRemove,
  onDragOver,
  onDrop,
  canRemove,
  disabled,
}: {
  index: number;
  slot: VideoSlot;
  onFile: (file: File) => void;
  onRemove: () => void;
  onDragOver: (v: boolean) => void;
  onDrop: (e: React.DragEvent) => void;
  canRemove: boolean;
  disabled: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
  };

  return (
    <div
      className={cn(
        "relative border-2 border-dashed rounded-xl p-4 transition-all duration-300",
        slot.file
          ? "border-emerald-500/50 bg-emerald-500/5"
          : slot.dragOver
            ? "border-amber-400 bg-amber-500/5"
            : "border-slate-700 hover:border-slate-500 bg-slate-900/30",
        disabled && "opacity-60 pointer-events-none"
      )}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(true);
      }}
      onDragLeave={() => onDragOver(false)}
      onDrop={onDrop}
      onClick={() => !slot.file && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".mp4,.mov"
        className="hidden"
        onChange={handleChange}
        capture="environment"
      />

      {/* Remove button */}
      {canRemove && !disabled && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-slate-800 hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {slot.file ? (
        /* Filled state */
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-amber-500/20 flex items-center justify-center text-amber-400 text-xs font-bold">
              {index + 1}
            </span>
            <span className="text-xs text-amber-400 font-medium">
              Camera {index + 1}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Video className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm text-white truncate">{slot.file.name}</p>
              <p className="text-xs text-slate-500">
                {(slot.file.size / (1024 * 1024)).toFixed(1)} MB
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
            className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
          >
            Change video (更换视频)
          </button>
        </div>
      ) : (
        /* Empty state */
        <div className="text-center py-4 space-y-2">
          <span className="w-8 h-8 mx-auto rounded-lg bg-slate-800 flex items-center justify-center">
            <Upload className="w-4 h-4 text-slate-500" />
          </span>
          <div>
            <p className="text-sm text-slate-400 font-medium">
              Camera {index + 1}
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              Drop video or click to browse
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
