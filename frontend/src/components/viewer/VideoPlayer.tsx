"use client";

import { useState, useRef } from "react";
import { SkeletonOverlay } from "./SkeletonOverlay";

interface VideoPlayerProps {
  originalUrl: string;
  overlayUrl: string;
  analysisId: string;
}

export function VideoPlayer({ originalUrl, overlayUrl, analysisId }: VideoPlayerProps) {
  const [activeTab, setActiveTab] = useState<"original" | "overlay" | "side-by-side">("overlay");
  const [showSkeleton, setShowSkeleton] = useState(true);
  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const sideVideoRef = useRef<HTMLVideoElement>(null);

  // Sync side-by-side video playback
  const handleMainPlay = () => {
    if (sideVideoRef.current) {
      sideVideoRef.current.currentTime = mainVideoRef.current?.currentTime ?? 0;
      sideVideoRef.current.play();
    }
  };

  const handleMainPause = () => {
    sideVideoRef.current?.pause();
  };

  const handleMainSeeked = () => {
    if (sideVideoRef.current && mainVideoRef.current) {
      sideVideoRef.current.currentTime = mainVideoRef.current.currentTime;
    }
  };

  return (
    <div className="space-y-4">
      {/* Tab selector */}
      <div className="flex gap-2 flex-wrap">
        {(["overlay", "original", "side-by-side"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                : "bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:border-slate-600"
            }`}
          >
            {tab === "original" ? "Original" : tab === "overlay" ? "Skeleton Overlay" : "Side by Side"}
          </button>
        ))}
        {activeTab === "overlay" && (
          <label className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showSkeleton}
              onChange={(e) => setShowSkeleton(e.target.checked)}
              className="accent-sky-500"
            />
            Show Skeleton
          </label>
        )}
      </div>

      {/* Video display */}
      <div className={`grid ${activeTab === "side-by-side" ? "grid-cols-2 gap-4" : "grid-cols-1"}`}>
        {/* Main video player (used for Original and Overlay tabs) */}
        {(activeTab === "original" || activeTab === "overlay") && (
          <div className="relative rounded-xl overflow-hidden bg-black/50">
            <video
              ref={mainVideoRef}
              src={originalUrl}
              controls
              className="w-full"
              onPlay={handleMainPlay}
              onPause={handleMainPause}
              onSeeked={handleMainSeeked}
            />
            {analysisId && (
              <SkeletonOverlay
                videoRef={mainVideoRef}
                analysisId={analysisId}
                visible={activeTab === "overlay" && showSkeleton}
              />
            )}
          </div>
        )}

        {/* Side by side: both videos */}
        {activeTab === "side-by-side" && (
          <>
            <div className="rounded-xl overflow-hidden bg-black/50">
              <video
                ref={mainVideoRef}
                src={originalUrl}
                controls
                className="w-full"
                onPlay={handleMainPlay}
                onPause={handleMainPause}
                onSeeked={handleMainSeeked}
              />
              <p className="text-xs text-slate-500 text-center py-2">Original</p>
            </div>
            <div className="rounded-xl overflow-hidden bg-black/50">
              <video
                ref={sideVideoRef}
                src={originalUrl}
                controls
                className="w-full"
              />
              <p className="text-xs text-slate-500 text-center py-2">With Skeleton</p>
              {analysisId && (
                <SkeletonOverlay
                  videoRef={sideVideoRef}
                  analysisId={analysisId}
                  visible={true}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
