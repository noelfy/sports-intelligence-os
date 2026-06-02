"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { getKeypointsUrl } from "@/lib/api";

// MediaPipe Pose connections (pairs of landmark indices)
const CONNECTIONS: [number, number][] = [
  // Face
  [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8],
  // Torso
  [9, 10], [11, 12],
  // Left arm
  [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], [17, 19],
  // Right arm
  [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20],
  // Left leg
  [11, 23], [23, 25], [25, 27], [27, 29], [27, 31], [29, 31],
  // Right leg
  [12, 24], [24, 26], [26, 28], [28, 30], [28, 32], [30, 32],
];

// Hand/foot indices for different coloring
const HAND_FOOT_INDICES = new Set([17, 18, 19, 20, 21, 22, 29, 30, 31, 32]);

interface CompactKeypoints {
  meta: {
    width: number;
    height: number;
    fps: number;
    total_frames: number;
  };
  frames: Record<string, number[][]>;  // frame_index -> [[x,y], ...]
}

interface SkeletonOverlayProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  analysisId: string;
  visible: boolean;
}

export function SkeletonOverlay({ videoRef, analysisId, visible }: SkeletonOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keypointsRef = useRef<CompactKeypoints | null>(null);
  const animFrameRef = useRef<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load compact keypoints
  useEffect(() => {
    if (!analysisId) return;
    setLoading(true);
    setError(null);

    const url = getKeypointsUrl(analysisId).replace("keypoints.json", "compact.json");
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: CompactKeypoints) => {
        keypointsRef.current = data;
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load keypoints:", err);
        setError("Failed to load skeleton data");
        setLoading(false);
      });
  }, [analysisId]);

  // Draw skeleton on canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const keypoints = keypointsRef.current;

    if (!canvas || !video || !keypoints || !visible) {
      animFrameRef.current = requestAnimationFrame(draw);
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Match canvas size to video display size
    const rect = video.getBoundingClientRect();
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    // Only draw if video is playing
    if (video.paused || video.ended) {
      animFrameRef.current = requestAnimationFrame(draw);
      return;
    }

    // Find the closest frame's keypoints
    const currentTime = video.currentTime;
    const fps = keypoints.meta.fps;
    const frameIndex = Math.round(currentTime * fps);
    const frameKey = String(frameIndex);
    const landmarks = keypoints.frames[frameKey];

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (landmarks && landmarks.length > 0) {
      const scaleX = canvas.width / keypoints.meta.width;
      const scaleY = canvas.height / keypoints.meta.height;

      // Draw connections
      ctx.lineWidth = 2;
      for (const [startIdx, endIdx] of CONNECTIONS) {
        if (startIdx >= landmarks.length || endIdx >= landmarks.length) continue;
        const x1 = landmarks[startIdx][0] * keypoints.meta.width * scaleX;
        const y1 = landmarks[startIdx][1] * keypoints.meta.height * scaleY;
        const x2 = landmarks[endIdx][0] * keypoints.meta.width * scaleX;
        const y2 = landmarks[endIdx][1] * keypoints.meta.height * scaleY;
        ctx.strokeStyle = "rgba(0, 255, 100, 0.8)";
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // Draw landmarks
      for (let i = 0; i < landmarks.length; i++) {
        const x = landmarks[i][0] * keypoints.meta.width * scaleX;
        const y = landmarks[i][1] * keypoints.meta.height * scaleY;
        const isHandFoot = HAND_FOOT_INDICES.has(i);
        ctx.fillStyle = isHandFoot ? "rgba(255, 0, 255, 0.9)" : "rgba(255, 255, 0, 0.9)";
        ctx.beginPath();
        ctx.arc(x, y, isHandFoot ? 3 : 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    animFrameRef.current = requestAnimationFrame(draw);
  }, [videoRef, visible]);

  // Start/stop animation loop
  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [draw, visible]);

  if (loading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl z-10">
        <div className="flex items-center gap-2 text-sky-400 text-sm">
          <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
          Loading skeleton data...
        </div>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
      style={{ display: visible ? "block" : "none" }}
    />
  );
}
