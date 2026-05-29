import { getResult, getVideoUrl, getKeypointsUrl } from "@/lib/api";
import { VideoPlayer } from "@/components/viewer/VideoPlayer";
import { FeedbackPanel } from "@/components/feedback/FeedbackPanel";
import { GlassCard } from "@/components/common/GlassCard";
import Link from "next/link";

export default async function ResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let result;
  let error: string | null = null;

  try {
    result = await getResult(id);
  } catch {
    error = "Analysis not found. It may have been deleted or never existed.";
  }

  if (error || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <GlassCard className="text-center space-y-4 max-w-md">
          <h2 className="text-xl font-semibold text-red-400">Not Found</h2>
          <p className="text-slate-400 text-sm">{error}</p>
          <Link
            href="/"
            className="inline-block px-4 py-2 text-sm text-sky-400 hover:text-sky-300 border border-sky-500/30 rounded-lg"
          >
            Back to Home
          </Link>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Analysis Result</h1>
        <Link
          href="/"
          className="text-sm text-sky-400 hover:text-sky-300 transition-colors"
        >
          ← New Analysis
        </Link>
      </div>

      {/* Status banner */}
      {result.status === "processing" && (
        <GlassCard className="flex items-center gap-4">
          <div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
          <div>
            <p className="text-sky-400 font-medium">Processing...</p>
            <p className="text-sm text-slate-500">
              Analyzing movement data. This page will update when complete.
            </p>
          </div>
        </GlassCard>
      )}

      {result.status === "failed" && (
        <GlassCard>
          <p className="text-red-400 font-medium">Analysis Failed</p>
          <p className="text-sm text-slate-400 mt-1">
            An error occurred during processing. Please try uploading again.
          </p>
        </GlassCard>
      )}

      {result.status === "completed" && (
        <>
          <GlassCard>
            <VideoPlayer
              originalUrl={getVideoUrl(result.analysis_id, "original.mp4")}
              overlayUrl={getVideoUrl(result.analysis_id, "overlay.mp4")}
            />
          </GlassCard>

          {result.feedback && <FeedbackPanel feedback={result.feedback} />}

          {/* Metadata */}
          <GlassCard className="text-sm text-slate-400 space-y-1">
            <p>
              <span className="text-slate-500">Video:</span>{" "}
              {result.metadata.video_filename || "Unknown"}
            </p>
            <p>
              <span className="text-slate-500">Frames:</span>{" "}
              {result.metadata.total_frames || "?"}
            </p>
            <p>
              <span className="text-slate-500">Analyzed:</span>{" "}
              {result.completed_at
                ? new Date(result.completed_at).toLocaleString()
                : "Unknown"}
            </p>
          </GlassCard>

          <div className="text-center">
            <a
              href={getKeypointsUrl(result.analysis_id)}
              download
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-sky-400 hover:text-sky-300 border border-sky-500/30 rounded-lg hover:bg-sky-500/10 transition-colors"
            >
              Download Keypoint Data (JSON)
            </a>
          </div>
        </>
      )}
    </div>
  );
}
