"use client";

import { useState, useRef, useEffect } from "react";

interface VideoPlayerProps {
  originalUrl: string;
  overlayUrl: string;
}

export function VideoPlayer({ originalUrl, overlayUrl }: VideoPlayerProps) {
  const [activeTab, setActiveTab] = useState<"original" | "overlay" | "side-by-side">("overlay");
  const originalRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLVideoElement>(null);

  // Sync playback between videos
  const handlePlay = () => {
    if (originalRef.current && overlayRef.current) {
      overlayRef.current.currentTime = originalRef.current.currentTime;
      overlayRef.current.play();
    }
  };

  const handlePause = () => {
    overlayRef.current?.pause();
  };

  const handleSeeked = () => {
    if (originalRef.current && overlayRef.current) {
      overlayRef.current.currentTime = originalRef.current.currentTime;
    }
  };

  return (
    <div className="space-y-4">
      {/* Tab selector */}
      <div className="flex gap-2">
        {(["original", "overlay", "side-by-side"] as const).map((tab) => (
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
      </div>

      {/* Video display */}
      <div className={`grid ${activeTab === "side-by-side" ? "grid-cols-2 gap-4" : "grid-cols-1"}`}>
        {(activeTab === "original" || activeTab === "side-by-side") && (
          <div className="rounded-xl overflow-hidden bg-black/50">
            <video
              ref={originalRef}
              src={originalUrl}
              controls
              className="w-full"
              onPlay={handlePlay}
              onPause={handlePause}
              onSeeked={handleSeeked}
            />
          </div>
        )}
        {(activeTab === "overlay" || activeTab === "side-by-side") && (
          <div className="rounded-xl overflow-hidden bg-black/50">
            <video
              ref={overlayRef}
              src={overlayUrl}
              controls
              className="w-full"
            />
          </div>
        )}
      </div>
    </div>
  );
}
