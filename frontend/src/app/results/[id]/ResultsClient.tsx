"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getResult, getVideoUrl, getKeypointsUrl } from "@/lib/api";
import { getClientResult } from "@/lib/client-results-store";
import { getExerciseById } from "@/data/exercises";
import { VideoPlayer } from "@/components/viewer/VideoPlayer";
import { Viewer3D } from "@/components/viewer/Viewer3D";
import { FeedbackPanel } from "@/components/feedback/FeedbackPanel";
import { ArrowLeft, AlertTriangle, CheckCircle } from "lucide-react";
import type { AnalysisResult } from "@/types";

interface ResultsClientProps {
  analysisId: string;
  initialResult: AnalysisResult | null;
  isClientResult?: boolean;
}

export function ResultsClient({
  analysisId,
  initialResult,
  isClientResult: _isClientResult,
}: ResultsClientProps) {
  const [result, setResult] = useState<AnalysisResult | null>(initialResult);
  const [polling, setPolling] = useState(
    !initialResult?.status ||
      initialResult.status === "pending" ||
      initialResult.status === "processing"
  );
  const [loadingFromClient, setLoadingFromClient] = useState(false);

  const isClient = analysisId.startsWith("client_");

  // On mount, if this is a client-side result and we don't have it from the server,
  // load it from sessionStorage
  useEffect(() => {
    if (!initialResult && isClient) {
      setLoadingFromClient(true);
      const stored = getClientResult(analysisId);
      if (stored) {
        setResult(stored);
        setPolling(false);
      }
      setLoadingFromClient(false);
    }
  }, [analysisId, initialResult, isClient]);

  // Poll for updates when status is "processing" (server results only)
  useEffect(() => {
    if (!polling || isClient) return;

    const interval = setInterval(async () => {
      try {
        const updated = await getResult(analysisId);
        setResult(updated);
        if (updated.status === "completed" || updated.status === "failed") {
          setPolling(false);
        }
      } catch {
        // Keep polling on transient errors
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [polling, analysisId, isClient]);

  // ── Loading from client store ──
  if (loadingFromClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" />
      </div>
    );
  }

  // ── Not Found ──
  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-slate-900/50 backdrop-blur-sm border border-white/5 rounded-2xl p-8 text-center space-y-4 max-w-md">
          <h2 className="text-xl font-semibold text-red-400">Not Found</h2>
          <p className="text-slate-400 text-sm">
            This analysis result could not be found. It may have been deleted or
            the link is invalid.
          </p>
          <Link
            href="/upload"
            className="inline-block px-4 py-2 text-sm text-amber-400 hover:text-amber-300 border border-amber-500/30 rounded-lg hover:bg-amber-500/10 transition-colors"
          >
            Try a New Analysis
          </Link>
        </div>
      </div>
    );
  }

  // Resolve exercise name from sport_type
  const exercise = result.sport_type ? getExerciseById(result.sport_type) : null;

  // Video URL: use blob URL for client results, API URL for server results
  const videoUrl = isClient
    ? result.video_url
    : getVideoUrl(analysisId, "original.mp4");

  // Overlay video: only available on server results
  const overlayUrl = isClient
    ? ""
    : getVideoUrl(analysisId, "overlay.mp4");

  // ── Processing State ──
  if (result.status === "pending" || result.status === "processing") {
    return (
      <div className="min-h-screen max-w-4xl mx-auto px-4 py-8">
        <Link
          href="/upload"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-amber-400 transition-colors group mb-8"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm">Back</span>
        </Link>

        <div className="flex flex-col items-center justify-center py-20 space-y-6">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold text-white">
              Analyzing Your Movement
            </h2>
            <p className="text-amber-400 text-sm">动作分析进行中...</p>
          </div>
          <p className="text-slate-500 text-sm max-w-md text-center">
            We&apos;re extracting pose keypoints and analyzing your biomechanics.
            This usually takes 30-90 seconds. The page will update automatically.
          </p>
          <div className="flex gap-2 mt-4">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      </div>
    );
  }

  // ── Failed State ──
  if (result.status === "failed") {
    return (
      <div className="min-h-screen max-w-4xl mx-auto px-4 py-8">
        <Link
          href="/upload"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-amber-400 transition-colors group mb-8"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm">Back</span>
        </Link>

        <div className="flex flex-col items-center justify-center py-20 space-y-6">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold text-white">Analysis Failed</h2>
            <p className="text-red-400 text-sm">分析失败</p>
          </div>
          <p className="text-slate-500 text-sm max-w-md text-center">
            We couldn&apos;t complete the analysis. This could be due to poor
            lighting, the person not being fully visible, or an unsupported
            camera angle.
          </p>
          <Link
            href="/upload"
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium transition-colors"
          >
            Try Again
          </Link>
        </div>
      </div>
    );
  }

  // ── Completed State ──
  return (
    <div className="min-h-screen max-w-4xl mx-auto px-4 py-8">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/upload"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-amber-400 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm">New Analysis 新的分析</span>
        </Link>
        <Link
          href="/history"
          className="text-xs text-slate-500 hover:text-slate-400 transition-colors"
        >
          History 历史记录 →
        </Link>
      </div>

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Movement Analysis
          <span className="text-amber-400 text-lg font-normal ml-2">
            动作分析报告
          </span>
        </h1>
        {exercise && (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/5">
            <span className="text-amber-400 text-sm font-medium">
              {exercise.name}
            </span>
            <span className="text-slate-500 text-sm">{exercise.nameZh}</span>
          </div>
        )}
        {isClient && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-2 rounded-full border border-green-500/20 bg-green-500/5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span className="text-[10px] text-green-400">
              On-Device Analysis · 设备端分析
            </span>
          </div>
        )}
      </div>

      {/* Video Player — only show for server results (client results use blob URL) */}
      {videoUrl && videoUrl !== "/api/files/videos//original.mp4" && (
        <div className="mb-8">
          <VideoPlayer
            originalUrl={videoUrl}
            overlayUrl={overlayUrl}
            analysisId={analysisId}
          />
        </div>
      )}

      {/* 3D Viewer (only for multi-camera 3D analyses) */}
      {result.is_3d && (
        <div className="mb-8">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              3D Skeleton View
              <span className="text-emerald-400 text-xs font-normal">
                三维骨骼视图
              </span>
            </h3>
            <Viewer3D analysisId={analysisId} />
          </div>
        </div>
      )}

      {/* Feedback */}
      {result.feedback && (
        <div className="mb-8">
          <FeedbackPanel
            feedback={result.feedback}
            overallScore={result.overall_score}
          />
        </div>
      )}

      {/* Metrics (client-side extra detail) */}
      {(result as any).metrics && (
        <div className="bg-slate-900/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6 mb-8">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            Detailed Metrics
            <span className="text-emerald-400 text-xs font-normal">
              详细指标
            </span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[
              { label: "Stability", key: "stability", desc: "稳定性" },
              { label: "Symmetry", key: "symmetry", desc: "对称性" },
              { label: "Range of Motion", key: "range_of_motion", desc: "活动范围" },
              { label: "Tempo", key: "tempo", desc: "节奏" },
              { label: "Posture", key: "posture", desc: "姿势" },
            ].map(({ label, key, desc }) => (
              <div key={key} className="text-center">
                <p className="text-2xl font-bold text-amber-400">
                  {(result as any).metrics[key]}
                </p>
                <p className="text-xs text-slate-400 mt-1">{label}</p>
                <p className="text-[10px] text-slate-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      {result.metadata && (
        <div className="bg-slate-900/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6 mb-8">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            Analysis Details
            <span className="text-emerald-400 text-xs font-normal">分析详情</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {result.metadata.video_filename && (
              <div>
                <p className="text-xs text-slate-500 mb-1">File</p>
                <p
                  className="text-sm text-slate-300 truncate"
                  title={result.metadata.video_filename}
                >
                  {result.metadata.video_filename}
                </p>
              </div>
            )}
            {result.metadata.total_frames && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Frames Analyzed</p>
                <p className="text-sm text-slate-300">
                  {result.metadata.total_frames}
                </p>
              </div>
            )}
            {(result as any).detection_rate !== undefined && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Detection Rate</p>
                <p className="text-sm text-slate-300">
                  {Math.round((result as any).detection_rate * 100)}%
                </p>
              </div>
            )}
            {result.metadata.video_fps && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Sample Rate</p>
                <p className="text-sm text-slate-300">
                  {result.metadata.video_fps} FPS
                </p>
              </div>
            )}
            {result.completed_at && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Completed</p>
                <p className="text-sm text-slate-300">
                  {new Date(result.completed_at).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Download Keypoints */}
      {!isClient && (
        <div className="text-center pb-12">
          <a
            href={
              result.is_3d
                ? getKeypointsUrl(analysisId, "keypoints_3d.json")
                : getKeypointsUrl(analysisId)
            }
            download
            className="text-sm text-slate-500 hover:text-amber-400 transition-colors underline underline-offset-4"
          >
            Download raw keypoint data
            {result.is_3d ? " (3D)" : ""} (JSON)
          </a>
        </div>
      )}
    </div>
  );
}
