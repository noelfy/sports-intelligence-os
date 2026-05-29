"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { getResult, getVideoUrl, getKeypointsUrl } from "@/lib/api";
import { VideoUploader } from "@/components/upload/VideoUploader";
import { VideoPlayer } from "@/components/viewer/VideoPlayer";
import { FeedbackPanel } from "@/components/feedback/FeedbackPanel";
import { GlassCard } from "@/components/common/GlassCard";
import type { AnalysisResult } from "@/types";

export default function Home() {
  const { upload } = useStore();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (upload.status === "completed" && upload.analysisId) {
      setLoading(true);
      getResult(upload.analysisId)
        .then(setResult)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [upload.status, upload.analysisId]);

  return (
    <div className="min-h-screen">
      {/* Hero section */}
      <section className="relative py-20 px-4">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight">
            <span className="gradient-text">NeuroVolley AI</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto">
            Sports Intelligence OS — Upload your volleyball movement video
            and receive AI-powered biomechanical analysis in seconds.
          </p>
        </div>
      </section>

      {/* Upload section */}
      <section className="px-4 pb-12">
        <VideoUploader />
      </section>

      {/* Results section */}
      {(upload.status === "completed" || loading) && (
        <section className="px-4 pb-20 max-w-6xl mx-auto space-y-8">
          <h2 className="text-2xl font-bold text-white text-center">
            Analysis Results
          </h2>

          {loading && !result ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-slate-400">Loading results...</span>
            </div>
          ) : result ? (
            <div className="space-y-8">
              <GlassCard>
                <VideoPlayer
                  originalUrl={getVideoUrl(result.analysis_id, "original.mp4")}
                  overlayUrl={getVideoUrl(result.analysis_id, "overlay.mp4")}
                />
              </GlassCard>

              {result.feedback && <FeedbackPanel feedback={result.feedback} />}

              <div className="text-center">
                <a
                  href={getKeypointsUrl(result.analysis_id)}
                  download
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm text-sky-400 hover:text-sky-300 border border-sky-500/30 rounded-lg hover:bg-sky-500/10 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Keypoint Data (JSON)
                </a>
              </div>
            </div>
          ) : null}
        </section>
      )}
    </div>
  );
}
