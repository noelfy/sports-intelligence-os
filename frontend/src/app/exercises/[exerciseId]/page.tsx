"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { getExerciseById } from "@/data/exercises";
import { getMuscleById, getMuscleGroup } from "@/data/muscles";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Target,
  ListOrdered,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  Wrench,
  Dumbbell,
  Play,
  Video,
} from "lucide-react";
import type { Difficulty } from "@/data/exercises";
import { ExerciseModel3D } from "@/components/fitness/ExerciseModel3D";
import { ExerciseVisualBreakdown } from "@/components/fitness/ExerciseAnimation";

const difficultyConfig: Record<
  Difficulty,
  { label: string; labelZh: string; className: string; icon: string }
> = {
  beginner: {
    label: "Beginner",
    labelZh: "初级",
    className: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
    icon: "🟢",
  },
  intermediate: {
    label: "Intermediate",
    labelZh: "中级",
    className: "border-amber-500/30 text-amber-400 bg-amber-500/10",
    icon: "🟡",
  },
  advanced: {
    label: "Advanced",
    labelZh: "高级",
    className: "border-red-500/30 text-red-400 bg-red-500/10",
    icon: "🔴",
  },
  elite: {
    label: "Elite",
    labelZh: "精英",
    className: "border-purple-500/30 text-purple-400 bg-purple-500/10",
    icon: "👑",
  },
};

const categoryLabels: Record<string, string> = {
  push: "推",
  pull: "拉",
  squat: "蹲",
  hinge: "铰链",
  carry: "搬运",
  core: "核心",
  isolation: "孤立",
};

export default function ExerciseDetailPage() {
  const params = useParams();
  const exerciseId = params.exerciseId as string;

  const exercise = getExerciseById(exerciseId);

  if (!exercise) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <p className="text-5xl">404</p>
          <h1 className="text-2xl font-bold text-white">Exercise Not Found</h1>
          <p className="text-slate-400">The exercise you are looking for does not exist.</p>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-xl hover:bg-amber-500/20 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Explore
          </Link>
        </div>
      </div>
    );
  }

  const diff = difficultyConfig[exercise.difficulty];

  return (
    <div className="min-h-screen max-w-4xl mx-auto">
      {/* Back Button */}
      <div className="px-4 pt-6">
        <Link
          href="/explore"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-amber-400 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm">Back to Explore</span>
        </Link>
      </div>

      {/* Hero Section */}
      <section className="relative py-12 px-4">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative text-center space-y-4">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            <span className="gradient-text-amber">{exercise.name}</span>
          </h1>
          <p className="text-2xl text-amber-300/80 font-medium">{exercise.nameZh}</p>
          <div className="flex items-center justify-center gap-3">
            <span
              className={cn(
                "px-3 py-1 rounded-full border text-sm font-medium",
                diff.className
              )}
            >
              {diff.icon} {diff.labelZh} / {diff.label}
            </span>
            <span className="px-3 py-1 rounded-full border border-amber-500/20 bg-amber-500/5 text-amber-400 text-sm">
              {categoryLabels[exercise.category] ?? exercise.category} /{" "}
              {exercise.category}
            </span>
          </div>
        </div>
      </section>

      {/* ===== 3D MOVEMENT DEMONSTRATION ===== */}
      <section className="px-4 pb-12">
        <div className="flex items-center gap-2 mb-4">
          <Play className="w-5 h-5 text-amber-400" />
          <h2 className="text-xl font-semibold text-white">
            3D Movement Demo
            <span className="text-amber-400 text-sm font-normal ml-2">动作演示</span>
          </h2>
          <span className="text-[10px] text-slate-600 ml-auto">🖱 Drag to rotate · Scroll to zoom</span>
        </div>
        <ExerciseModel3D exerciseId={exerciseId} />
      </section>

      {/* Target Muscles */}
      <section className="px-4 pb-12">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-amber-400" />
          Target Muscles
          <span className="text-amber-400 text-sm font-normal ml-1">目标肌群</span>
        </h2>

        {/* Primary Muscles */}
        <div className="mb-4">
          <h3 className="text-sm text-slate-400 font-medium mb-2">Primary Muscles (主要肌群)</h3>
          <div className="flex flex-wrap gap-2">
            {exercise.primaryMuscles.map((muscleId) => {
              const muscle = getMuscleById(muscleId);
              const group = muscle ? getMuscleGroup(muscle.group) : null;
              return (
                <Link
                  key={muscleId}
                  href={`/muscles/${muscle?.group ?? ""}`}
                  className="px-3 py-1.5 rounded-full text-sm border border-amber-500/30 bg-amber-500/5 text-amber-400 hover:bg-amber-500/15 transition-colors"
                >
                  {muscle?.name ?? muscleId}
                  {group ? (
                    <span className="ml-1.5 text-[10px] opacity-60">
                      ({group.nameZh})
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Secondary Muscles */}
        {exercise.secondaryMuscles.length > 0 && (
          <div>
            <h3 className="text-sm text-slate-400 font-medium mb-2">Secondary Muscles (辅助肌群)</h3>
            <div className="flex flex-wrap gap-2">
              {exercise.secondaryMuscles.map((muscleId) => {
                const muscle = getMuscleById(muscleId);
                const group = muscle ? getMuscleGroup(muscle.group) : null;
                return (
                  <Link
                    key={muscleId}
                    href={`/muscles/${muscle?.group ?? ""}`}
                    className="px-3 py-1.5 rounded-full text-sm border border-slate-600/30 bg-slate-800/50 text-slate-300 hover:border-amber-500/30 hover:text-amber-400 transition-colors"
                  >
                    {muscle?.name ?? muscleId}
                    {group ? (
                      <span className="ml-1.5 text-[10px] opacity-60">
                        ({group.nameZh})
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* ===== VISUAL BREAKDOWN ===== */}
      <section className="px-4 pb-8">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-amber-400" />
          Key Positions
          <span className="text-amber-400 text-sm font-normal ml-1">关键姿势</span>
        </h2>
        <ExerciseVisualBreakdown exerciseId={exerciseId} />
      </section>

      {/* How to Perform */}
      <section className="px-4 pb-12">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <ListOrdered className="w-5 h-5 text-amber-400" />
          How to Perform
          <span className="text-amber-400 text-sm font-normal ml-1">动作步骤</span>
        </h2>
        <div className="bg-slate-900/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
          <ol className="space-y-3 text-slate-300 list-none">
            {exercise.instructions.map((step, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="shrink-0 w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm flex items-center justify-center font-semibold">
                  {idx + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Pro Tips */}
      {exercise.tips.length > 0 && (
        <section className="px-4 pb-12">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            Pro Tips
            <span className="text-amber-400 text-sm font-normal ml-1">专业提示</span>
          </h2>
          <div className="bg-slate-900/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
            <ul className="space-y-2.5">
              {exercise.tips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="text-amber-400 mt-0.5 shrink-0">&#x2022;</span>
                  <span className="text-slate-300 text-sm">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Common Mistakes */}
      {exercise.commonMistakes.length > 0 && (
        <section className="px-4 pb-12">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            Common Mistakes to Avoid
            <span className="text-red-400 text-sm font-normal ml-1">常见错误</span>
          </h2>
          <div className="bg-slate-900/50 backdrop-blur-sm border border-red-500/10 rounded-2xl p-6">
            <ul className="space-y-2.5">
              {exercise.commonMistakes.map((mistake, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="text-red-400 mt-0.5 shrink-0">&#x2716;</span>
                  <span className="text-slate-300 text-sm">{mistake}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Benefits */}
      {exercise.benefits.length > 0 && (
        <section className="px-4 pb-12">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            Benefits
            <span className="text-emerald-400 text-sm font-normal ml-1">动作好处</span>
          </h2>
          <div className="bg-slate-900/50 backdrop-blur-sm border border-emerald-500/10 rounded-2xl p-6">
            <ul className="space-y-2.5">
              {exercise.benefits.map((benefit, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="text-emerald-400 mt-0.5 shrink-0">&#x2714;</span>
                  <span className="text-slate-300 text-sm">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Equipment Needed */}
      <section className="px-4 pb-12">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Wrench className="w-5 h-5 text-amber-400" />
          Equipment Needed
          <span className="text-amber-400 text-sm font-normal ml-1">所需器械</span>
        </h2>
        <div className="flex flex-wrap gap-2">
          {exercise.equipment.map((eq) => (
            <span
              key={eq}
              className="px-3 py-1.5 rounded-full text-sm bg-slate-800/70 text-slate-300 border border-slate-700/50"
            >
              {eq === "bodyweight" ? "自体重 / Bodyweight" : eq}
            </span>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-4 pb-20">
        <div className="bg-gradient-to-br from-amber-500/5 to-amber-600/5 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-8 text-center">
          <Video className="w-10 h-10 text-amber-400 mx-auto mb-4" />
          <p className="text-white font-semibold text-lg mb-2">Ready to check your form?</p>
          <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
            Record yourself performing {exercise.name} and our AI will analyze your
            movement, comparing it against proper form to give you personalized feedback.
          </p>
          <Link
            href={`/upload?exercise=${exerciseId}`}
            className="inline-flex items-center gap-2 px-8 py-3 btn-amber rounded-xl text-base font-semibold"
          >
            <Video className="w-5 h-5" />
            Record &amp; Analyze Your Form
          </Link>
          <p className="text-slate-600 text-xs mt-3">支持上传训练视频，AI 自动分析动作标准度</p>
        </div>
      </section>
    </div>
  );
}
