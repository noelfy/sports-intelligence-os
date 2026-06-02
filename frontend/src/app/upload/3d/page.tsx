"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { exercises, getExerciseById } from "@/data/exercises";
import { getMuscleById } from "@/data/muscles";
import { MultiVideoUploader } from "@/components/upload/MultiVideoUploader";
import { CalibrationSessionPicker } from "@/components/upload/CalibrationSessionPicker";
import {
  ArrowLeft,
  Search,
  Dumbbell,
  Target,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Camera,
  Crosshair,
  Info,
} from "lucide-react";
import type { Exercise } from "@/data/exercises";

export default function Upload3DPage() {
  const router = useRouter();
  const { upload } = useStore();

  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [calibrationId, setCalibrationId] = useState<string | null>(null);

  // Auto-redirect to results on completion
  useEffect(() => {
    if (upload.status === "completed" && upload.analysisId) {
      router.push(`/results/${upload.analysisId}`);
    }
  }, [upload.status, upload.analysisId, router]);

  // Filter exercises by search
  const filteredExercises = useMemo(() => {
    if (!searchQuery.trim()) return exercises;
    const q = searchQuery.toLowerCase();
    return exercises.filter(
      (ex) =>
        ex.name.toLowerCase().includes(q) ||
        ex.nameZh.includes(q) ||
        ex.category.includes(q) ||
        ex.primaryMuscles.some((mId) => {
          const muscle = getMuscleById(mId);
          return muscle?.name.toLowerCase().includes(q);
        })
    );
  }, [searchQuery]);

  const difficultyBadge = (d: string) => {
    switch (d) {
      case "beginner":
        return { label: "初级", color: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" };
      case "intermediate":
        return { label: "中级", color: "border-amber-500/30 text-amber-400 bg-amber-500/10" };
      case "advanced":
        return { label: "高级", color: "border-red-500/30 text-red-400 bg-red-500/10" };
      default:
        return { label: d, color: "border-slate-500/30 text-slate-400 bg-slate-500/10" };
    }
  };

  return (
    <div className="min-h-screen max-w-2xl mx-auto px-4 py-8">
      {/* Back Link */}
      <Link
        href="/upload"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-amber-400 transition-colors group mb-8"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm">Back to Single-Camera Upload</span>
      </Link>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 mb-4">
          <Camera className="w-4 h-4 text-emerald-400" />
          <span className="text-emerald-400 text-xs font-medium">3D Motion Capture</span>
          <span className="text-slate-500 text-xs">三维动作捕捉</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">
          3D Motion Analysis
          <span className="text-amber-400 text-lg font-normal ml-2">3D 动作分析</span>
        </h1>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          Upload 1-4 videos. Single camera uses MediaPipe monocular 3D.
          2+ synchronized cameras from different angles enable full triangulated 3D reconstruction.
        </p>
      </div>

      {/* Exercise Selector */}
      <div className="bg-slate-900/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <Dumbbell className="w-4 h-4 text-amber-400" />
          Select Exercise
          <span className="text-amber-400 text-xs font-normal">选择动作</span>
        </h2>

        <div>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-slate-800/70 border border-slate-700/50 rounded-xl text-left hover:border-amber-500/30 transition-colors"
          >
            {selectedExercise ? (
              <div className="flex items-center gap-3">
                <span className="text-white font-medium">{selectedExercise.name}</span>
                <span className="text-slate-400 text-sm">{selectedExercise.nameZh}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] border ${difficultyBadge(selectedExercise.difficulty).color}`}
                >
                  {difficultyBadge(selectedExercise.difficulty).label}
                </span>
              </div>
            ) : (
              <span className="text-slate-500">General movement analysis (通用动作分析)</span>
            )}
            <ChevronDown
              className={`w-4 h-4 text-slate-500 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {dropdownOpen && (
            <div className="mt-2 bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden">
              <div className="p-3 border-b border-slate-800">
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-lg">
                  <Search className="w-4 h-4 text-slate-500 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search exercises... (搜索动作)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent text-sm text-white placeholder:text-slate-600 w-full outline-none"
                    autoFocus
                  />
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {/* General option */}
                <button
                  onClick={() => {
                    setSelectedExercise(null);
                    setSearchQuery("");
                    setDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-amber-500/10 transition-colors ${
                    !selectedExercise ? "bg-amber-500/10 border-l-2 border-amber-400" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-300 font-medium">General Movement (通用)</p>
                    <p className="text-xs text-slate-500">No exercise-specific analysis</p>
                  </div>
                </button>
                {filteredExercises.map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => {
                      setSelectedExercise(ex);
                      setSearchQuery("");
                      setDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-amber-500/10 transition-colors ${
                      selectedExercise?.id === ex.id ? "bg-amber-500/10 border-l-2 border-amber-400" : ""
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{ex.name}</p>
                      <p className="text-xs text-slate-500">{ex.nameZh}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] border shrink-0 ${difficultyBadge(ex.difficulty).color}`}
                    >
                      {difficultyBadge(ex.difficulty).label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {selectedExercise && !dropdownOpen && (
          <div className="mt-4 pt-4 border-t border-slate-800/50">
            <button
              onClick={() => setShowDetail(!showDetail)}
              className="w-full flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <Target className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                {selectedExercise.primaryMuscles.slice(0, 3).map((mId) => {
                  const muscle = getMuscleById(mId);
                  return (
                    <span
                      key={mId}
                      className="px-1.5 py-0.5 rounded-full text-[10px] border border-amber-500/20 bg-amber-500/5 text-amber-400"
                    >
                      {muscle?.name ?? mId}
                    </span>
                  );
                })}
              </div>
              {showDetail ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              )}
            </button>

            {showDetail && (
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-xs text-slate-500 mb-2 flex items-center gap-1.5">
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                    Correct Form (正确姿势)
                  </p>
                  <ul className="space-y-1">
                    {selectedExercise.instructions.slice(0, 3).map((step, i) => (
                      <li key={i} className="text-xs text-slate-400 flex items-start gap-2">
                        <span className="text-amber-400 shrink-0 mt-0.5">•</span>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3 text-red-400" />
                    Common Mistakes (常见错误)
                  </p>
                  <ul className="space-y-1">
                    {selectedExercise.commonMistakes.map((mistake, i) => (
                      <li key={i} className="text-xs text-slate-500 flex items-start gap-2">
                        <span className="text-red-400 shrink-0 mt-0.5">✕</span>
                        {mistake}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Calibration Session Picker */}
      <div className="bg-slate-900/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-amber-400" />
          Calibration (Optional)
          <span className="text-amber-400 text-xs font-normal">相机标定 (可选)</span>
        </h2>
        <CalibrationSessionPicker value={calibrationId} onChange={setCalibrationId} />
        <div className="mt-3 flex items-start gap-2 px-3 py-2 bg-slate-800/30 rounded-lg">
          <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-500 leading-relaxed">
            Calibration improves 3D accuracy by using precise camera positions. Without it,
            we still reconstruct 3D using basic assumptions — works for casual analysis but
            measurements won&apos;t be metric-accurate.
          </p>
        </div>
      </div>

      {/* Multi-Video Uploader */}
      <div className="mb-8">
        <MultiVideoUploader
          calibrationSessionId={calibrationId}
          exerciseId={selectedExercise?.id}
          onComplete={(analysisId) => {
            router.push(`/results/${analysisId}`);
          }}
        />
      </div>

      {/* Recording Tips */}
      <div className="bg-slate-900/30 border border-white/5 rounded-xl p-4 space-y-3">
        <p className="text-xs text-slate-500 font-medium">🎥 Tips (拍摄建议)</p>
        <ul className="space-y-1.5">
          <li className="text-xs text-slate-600 flex items-start gap-2">
            <span className="text-amber-400 shrink-0">1.</span>
            Single camera: just upload any video — we use MediaPipe&apos;s built-in 3D pose estimation
          </li>
          <li className="text-xs text-slate-600 flex items-start gap-2">
            <span className="text-amber-400 shrink-0">2.</span>
            For best 3D accuracy, use 2+ cameras positioned 45-90° apart around the subject
          </li>
          <li className="text-xs text-slate-600 flex items-start gap-2">
            <span className="text-amber-400 shrink-0">3.</span>
            Start all cameras at the same time (use a clap or visible sync cue)
          </li>
          <li className="text-xs text-slate-600 flex items-start gap-2">
            <span className="text-amber-400 shrink-0">4.</span>
            Keep the subject fully visible with good lighting and plain background
          </li>
          <li className="text-xs text-slate-600 flex items-start gap-2">
            <span className="text-amber-400 shrink-0">5.</span>
            Each video should be 5-30 seconds showing one complete movement
          </li>
        </ul>
      </div>
    </div>
  );
}
