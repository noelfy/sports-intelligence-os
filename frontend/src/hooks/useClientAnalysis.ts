/**
 * React hook for client-side pose analysis.
 *
 * Manages the full lifecycle: initialization → processing → result storage.
 * Used in production (Vercel) where video upload to server is not feasible.
 */

"use client";

import { useState, useCallback, useRef } from "react";
import {
  runFullAnalysis,
  runMultiCameraAnalysis,
  type ProcessingProgress,
} from "@/lib/mediapipe/pose-analyzer";
import { storeClientResult } from "@/lib/client-results-store";
import type { AnalysisResult } from "@/types";

export type ClientAnalysisStatus =
  | "idle"
  | "loading_model"
  | "processing"
  | "completed"
  | "error";

export interface ClientAnalysisState {
  status: ClientAnalysisStatus;
  progress: number; // 0-100
  message: string;
  result: AnalysisResult | null;
  error: string | null;
}

export function useClientAnalysis() {
  const [state, setState] = useState<ClientAnalysisState>({
    status: "idle",
    progress: 0,
    message: "",
    result: null,
    error: null,
  });

  const abortRef = useRef(false);

  const analyze = useCallback(
    async (
      file: File,
      exerciseId?: string,
      exerciseName?: string
    ): Promise<AnalysisResult | null> => {
      abortRef.current = false;

      setState({
        status: "loading_model",
        progress: 0,
        message: "Loading pose detection engine... (加载姿态检测引擎)",
        result: null,
        error: null,
      });

      try {
        const handleProgress = (p: ProcessingProgress) => {
          if (abortRef.current) return;
          setState((prev) =>
            prev.status === "error"
              ? prev
              : {
                  ...prev,
                  status:
                    p.pct < 5
                      ? "loading_model"
                      : "processing",
                  progress: p.pct,
                  message: p.msg,
                }
          );
        };

        const result = await runFullAnalysis(
          file,
          { exerciseId, exerciseName },
          handleProgress
        );

        if (abortRef.current) return null;

        // Store result for results page
        storeClientResult(result.analysis_id, result);

        setState({
          status: "completed",
          progress: 100,
          message: "Analysis complete! (分析完成)",
          result,
          error: null,
        });

        return result;
      } catch (err) {
        if (abortRef.current) return null;

        const msg =
          err instanceof Error
            ? err.message
            : "Analysis failed. (分析失败)";

        setState({
          status: "error",
          progress: 0,
          message: "",
          result: null,
          error: msg,
        });

        return null;
      }
    },
    []
  );

  const analyzeMulti = useCallback(
    async (
      files: File[],
      exerciseId?: string,
      exerciseName?: string
    ): Promise<AnalysisResult | null> => {
      abortRef.current = false;

      setState({
        status: "loading_model",
        progress: 0,
        message: `Loading pose detection for ${files.length} cameras... (加载${files.length}机位姿态检测)`,
        result: null,
        error: null,
      });

      try {
        const handleProgress = (p: ProcessingProgress) => {
          if (abortRef.current) return;
          setState((prev) =>
            prev.status === "error"
              ? prev
              : {
                  ...prev,
                  status:
                    p.pct < 5 ? "loading_model" : "processing",
                  progress: p.pct,
                  message: p.msg,
                }
          );
        };

        const result = await runMultiCameraAnalysis(
          files,
          { exerciseId, exerciseName },
          handleProgress
        );

        if (abortRef.current) return null;

        storeClientResult(result.analysis_id, result);

        setState({
          status: "completed",
          progress: 100,
          message: files.length >= 2
            ? "3D analysis complete! (3D分析完成)"
            : "Analysis complete! (分析完成)",
          result,
          error: null,
        });

        return result;
      } catch (err) {
        if (abortRef.current) return null;

        const msg =
          err instanceof Error
            ? err.message
            : "3D analysis failed. (3D分析失败)";

        setState({
          status: "error",
          progress: 0,
          message: "",
          result: null,
          error: msg,
        });

        return null;
      }
    },
    []
  );

  const abort = useCallback(() => {
    abortRef.current = true;
    setState((prev) =>
      prev.status === "completed" || prev.status === "error"
        ? prev
        : { ...prev, status: "idle", progress: 0, message: "", error: null }
    );
  }, []);

  const reset = useCallback(() => {
    abortRef.current = false;
    setState({
      status: "idle",
      progress: 0,
      message: "",
      result: null,
      error: null,
    });
  }, []);

  return {
    ...state,
    analyze,
    analyzeMulti,
    abort,
    reset,
  };
}
