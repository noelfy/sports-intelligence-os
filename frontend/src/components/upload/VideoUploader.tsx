"use client";

import { useState, useCallback } from "react";
import { useStore } from "@/lib/store";
import { uploadVideo, pollUntilComplete } from "@/lib/api";
import { cn } from "@/lib/utils";

interface VideoUploaderProps {
  exerciseId?: string;
  onComplete?: (analysisId: string) => void;
}

export function VideoUploader({ exerciseId, onComplete }: VideoUploaderProps) {
  const { upload, setUpload } = useStore();
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!ext || !["mp4", "mov"].includes(ext)) {
        setUpload({ error: "Please upload an MP4 or MOV file. (请上传 MP4 或 MOV 格式的视频)" });
        return;
      }
      if (file.size > 500 * 1024 * 1024) {
        setUpload({ error: "File size must be under 500MB. (文件大小不能超过 500MB)" });
        return;
      }

      setUpload({ file, status: "uploading", progress: 0, error: null });

      try {
        const result = await uploadVideo(file, exerciseId, (pct) => {
          setUpload({ progress: pct });
        });

        setUpload({
          status: "processing",
          analysisId: result.analysis_id,
        });

        const finalResult = await pollUntilComplete(result.analysis_id);
        if (finalResult.status === "failed") {
          setUpload({ status: "error", error: "Analysis failed. Please try again with a clearer video. (分析失败，请使用更清晰的视频重试)" });
        } else {
          setUpload({ status: "completed" });
          onComplete?.(result.analysis_id);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Upload failed (上传失败)";
        setUpload({ status: "error", error: msg });
      }
    },
    [setUpload, exerciseId, onComplete]
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
        />

        {upload.status === "idle" && (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
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
                MP4 or MOV, up to 500MB
              </p>
            </div>
            <button className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium transition-colors">
              Choose Video
            </button>
          </div>
        )}

        {/* Uploading */}
        {upload.status === "uploading" && (
          <div className="space-y-4">
            <p className="text-amber-400 font-medium">Uploading... (上传中...)</p>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-300"
                style={{ width: `${upload.progress}%` }}
              />
            </div>
            <p className="text-sm text-slate-500">{upload.progress}%</p>
          </div>
        )}

        {/* Processing */}
        {upload.status === "processing" && (
          <div className="space-y-4">
            <div className="w-12 h-12 mx-auto border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-amber-400 font-medium">Analyzing Movement... (动作分析中...)</p>
            <p className="text-sm text-slate-500">
              Extracting pose keypoints and analyzing biomechanics
            </p>
          </div>
        )}

        {/* Completed */}
        {upload.status === "completed" && (
          <div className="space-y-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-green-400 font-medium">Analysis Complete!</p>
          </div>
        )}

        {/* Error */}
        {upload.status === "error" && (
          <div className="space-y-3">
            <p className="text-red-400 font-medium">Upload Failed</p>
            <p className="text-sm text-slate-400">{upload.error}</p>
            <button
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors"
              onClick={(e) => {
                e.stopPropagation();
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
    </div>
  );
}
