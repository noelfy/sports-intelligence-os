"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { exercises, getExerciseById } from "@/data/exercises";
import { getMuscleById } from "@/data/muscles";
import { VideoUploader } from "@/components/upload/VideoUploader";
import {
  ArrowLeft,
  Search,
  Dumbbell,
  Target,
  AlertTriangle,
  CheckCircle,
  Video,
  Camera,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { Exercise } from "@/data/exercises";

// Wrap the page content so useSearchParams works with Next.js Suspense boundary
function UploadPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { upload } = useStore();

  const preselectedId = searchParams.get("exercise") || "";
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  // Load preselected exercise on mount
  useEffect(() => {
    if (preselectedId) {
      const ex = getExerciseById(preselectedId);
      if (ex) setSelectedExercise(ex);
    }
  }, [preselectedId]);

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

  const handleSelectExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setSearchQuery("");
    setDropdownOpen(false);
  };

  // Difficulty badge
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

  // Render
  return (
    <div className="min-h-screen max-w-2xl mx-auto px-4 py-8">
      {/* Back Link */}
      <Link
        href="/explore"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-amber-400 transition-colors group mb-8"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm">Back to Explore</span>
      </Link>

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Analyze Your Form
          <span className="text-amber-400 text-lg font-normal ml-2">动作分析</span>
        </h1>
        <p className="text-slate-400 text-sm">
          Upload a video of your exercise and get AI-powered feedback on your form
        </p>
      </div>

      {/* 3D Multi-Camera Banner */}
      <Link
        href="/upload/3d"
        className="block mb-6 p-4 bg-gradient-to-r from-emerald-500/5 to-cyan-500/5 border border-emerald-500/20 rounded-2xl hover:border-emerald-500/40 transition-all group"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
            <Camera className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-emerald-400 group-hover:text-emerald-300 transition-colors">
              3D Motion Capture · 三维动作捕捉
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload 2-4 synchronized videos from different angles for full 3D biomechanical analysis
            </p>
          </div>
          <span className="text-emerald-400 text-lg group-hover:translate-x-1 transition-transform shrink-0">
            →
          </span>
        </div>
      </Link>

      {/* Exercise Selector + Reference (merged) */}
      <div className="bg-slate-900/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <Dumbbell className="w-4 h-4 text-amber-400" />
          Select Exercise
          <span className="text-amber-400 text-xs font-normal">选择动作</span>
        </h2>

        {/* Searchable Dropdown — flows naturally, pushes content down */}
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
                  className={`px-2 py-0.5 rounded-full text-[10px] border ${
                    difficultyBadge(selectedExercise.difficulty).color
                  }`}
                >
                  {difficultyBadge(selectedExercise.difficulty).label}
                </span>
              </div>
            ) : (
              <span className="text-slate-500">Choose an exercise... (选择训练动作)</span>
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
                {filteredExercises.length === 0 ? (
                  <p className="text-center text-slate-500 text-sm py-6">
                    No exercises found (未找到匹配动作)
                  </p>
                ) : (
                  filteredExercises.map((ex) => (
                    <button
                      key={ex.id}
                      onClick={() => handleSelectExercise(ex)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-amber-500/10 transition-colors ${
                        selectedExercise?.id === ex.id ? "bg-amber-500/10 border-l-2 border-amber-400" : ""
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{ex.name}</p>
                        <p className="text-xs text-slate-500">{ex.nameZh}</p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] border shrink-0 ${
                          difficultyBadge(ex.difficulty).color
                        }`}
                      >
                        {difficultyBadge(ex.difficulty).label}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Exercise Reference — compact, collapsible, hidden while dropdown open */}
        {selectedExercise && !dropdownOpen && (
          <div className="mt-4 pt-4 border-t border-slate-800/50">
            {/* Compact summary row — always visible */}
            <button
              onClick={() => setShowDetail(!showDetail)}
              className="w-full flex items-center justify-between gap-3 group/summary"
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
                <span className="text-[10px] text-slate-600">
                  {showDetail ? "收起详情" : "展开参考"}
                </span>
              </div>
              {showDetail ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-500 group-hover/summary:text-slate-400 transition-colors shrink-0" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover/summary:text-slate-400 transition-colors shrink-0" />
              )}
            </button>

            {/* Expandable detail */}
            {showDetail && (
              <div className="mt-4 space-y-4">
                {/* Correct Form Summary */}
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

                {/* Common Mistakes */}
                <div>
                  <p className="text-xs text-slate-500 mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3 text-red-400" />
                    Common Mistakes We&apos;ll Check For (常见错误检测)
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

      {/* Video Uploader */}
      <div className="mb-8">
        <VideoUploader
          exerciseId={selectedExercise?.id}
          exerciseName={selectedExercise?.name}
          onComplete={(analysisId) => {
            router.push(`/results/${analysisId}`);
          }}
        />
      </div>

      {/* Tips */}
      <div className="bg-slate-900/30 border border-white/5 rounded-xl p-4">
        <p className="text-xs text-slate-600 leading-relaxed">
          💡 <span className="text-slate-500">Tips for best results (获得最佳分析结果的建议):</span>{" "}
          Record in good lighting with your full body visible. Keep the camera stable
          at chest height. Wear fitted clothing so the AI can detect your joints
          accurately. Videos should be 5-30 seconds showing one complete set.
        </p>
      </div>
    </div>
  );
}

// Page wrapped in Suspense for useSearchParams
export default function UploadPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" />
        </div>
      }
    >
      <UploadPageContent />
    </Suspense>
  );
}
