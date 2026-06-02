"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { getMuscleGroup, getMusclesByGroup, getMuscleById } from "@/data/muscles";
import { exercises } from "@/data/exercises";
import { cn } from "@/lib/utils";
import { ArrowLeft, Dumbbell, StretchVertical, Brain, Zap } from "lucide-react";
import type { Difficulty } from "@/data/exercises";

const difficultyConfig: Record<Difficulty, { label: string; labelZh: string; className: string }> = {
  beginner: {
    label: "Beginner",
    labelZh: "初级",
    className: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
  },
  intermediate: {
    label: "Intermediate",
    labelZh: "中级",
    className: "border-amber-500/30 text-amber-400 bg-amber-500/10",
  },
  advanced: {
    label: "Advanced",
    labelZh: "高级",
    className: "border-red-500/30 text-red-400 bg-red-500/10",
  },
  elite: {
    label: "Elite",
    labelZh: "精英",
    className: "border-purple-500/30 text-purple-400 bg-purple-500/10",
  },
};

export default function MuscleGroupPage() {
  const params = useParams();
  const groupId = params.groupId as string;

  const group = getMuscleGroup(groupId as Parameters<typeof getMuscleGroup>[0]);
  const groupMuscles = group
    ? getMusclesByGroup(groupId as Parameters<typeof getMusclesByGroup>[0])
    : [];

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <p className="text-5xl">404</p>
          <h1 className="text-2xl font-bold text-white">Muscle Group Not Found</h1>
          <p className="text-slate-400">The muscle group you are looking for does not exist.</p>
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

  // Find exercises that target muscles in this group
  const groupMuscleIds = groupMuscles.map((m) => m.id);
  const relevantExercises = exercises.filter(
    (ex) =>
      ex.primaryMuscles.some((id) => groupMuscleIds.includes(id)) ||
      ex.secondaryMuscles.some((id) => groupMuscleIds.includes(id))
  );

  return (
    <div className="min-h-screen">
      {/* Back Button */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
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
        <div className="relative max-w-4xl mx-auto text-center space-y-4">
          <div className="text-6xl mb-4">{group.icon}</div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            <span className="gradient-text-amber">{group.name}</span>
          </h1>
          <p className="text-2xl text-amber-300/80 font-medium">{group.nameZh}</p>
          <p className="text-slate-400 max-w-2xl mx-auto">{group.description}</p>
        </div>
      </section>

      {/* Muscles in this Group */}
      <section className="px-4 pb-16 max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-amber-400" />
          Muscles in this Group
          <span className="text-amber-400 text-base font-normal ml-1">本肌群肌肉</span>
        </h2>
        <div className="space-y-5">
          {groupMuscles.map((muscle) => (
            <div
              key={muscle.id}
              className="bg-slate-900/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6 hover:border-amber-500/20 transition-all duration-300"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {muscle.name}
                  </h3>
                  <p className="text-slate-500 text-sm italic">{muscle.scientificName}</p>
                </div>
                <span className="self-start shrink-0 px-2.5 py-1 rounded-full text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {muscle.region === "upper" ? "上肢" : muscle.region === "lower" ? "下肢" : "核心"}
                </span>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-amber-400/80 font-medium">Function:</span>
                  <p className="text-slate-400 mt-0.5">{muscle.function}</p>
                </div>
                <p className="text-slate-400">{muscle.description}</p>
                <div>
                  <span className="text-amber-400/80 font-medium">Daily Use:</span>
                  <p className="text-slate-400 mt-0.5">{muscle.dailyUse}</p>
                </div>
              </div>

              {/* Stretch Tips */}
              <div className="mt-4 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium mb-1">
                  <StretchVertical className="w-4 h-4" />
                  Stretch Tips
                </div>
                <p className="text-slate-400 text-sm">{muscle.stretchTips}</p>
              </div>

              {/* Synergists & Antagonists */}
              <div className="flex flex-wrap gap-6 mt-4">
                {muscle.synergists.length > 0 && (
                  <div>
                    <span className="text-xs text-slate-500 font-medium">Synergists (协同肌)</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {muscle.synergists.map((id) => {
                        const m = getMuscleById(id);
                        return (
                          <span
                            key={id}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          >
                            {m?.name ?? id}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
                {muscle.antagonists.length > 0 && (
                  <div>
                    <span className="text-xs text-slate-500 font-medium">Antagonists (拮抗肌)</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {muscle.antagonists.map((id) => {
                        const m = getMuscleById(id);
                        return (
                          <span
                            key={id}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20"
                          >
                            {m?.name ?? id}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recommended Exercises */}
      {relevantExercises.length > 0 && (
        <section className="px-4 pb-16 max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            Recommended Exercises
            <span className="text-amber-400 text-base font-normal ml-1">推荐动作</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {relevantExercises.map((exercise) => {
              const diff = difficultyConfig[exercise.difficulty];
              return (
                <Link
                  key={exercise.id}
                  href={`/exercises/${exercise.id}`}
                  className={cn(
                    "group bg-slate-900/50 backdrop-blur-sm border border-white/5 rounded-2xl p-5",
                    "hover:border-amber-500/30 hover:bg-slate-900/70",
                    "transition-all duration-300 hover:-translate-y-1"
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-white font-semibold group-hover:text-amber-400 transition-colors">
                        {exercise.name}
                      </h3>
                      <p className="text-amber-300/80 text-sm">{exercise.nameZh}</p>
                    </div>
                    <span
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full border font-medium whitespace-nowrap",
                        diff.className
                      )}
                    >
                      {diff.labelZh}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {exercise.equipment.map((eq) => (
                      <span
                        key={eq}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800/70 text-slate-400 border border-slate-700/50"
                      >
                        {eq}
                      </span>
                    ))}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Professional Training Tips */}
      <section className="px-4 pb-20 max-w-4xl mx-auto">
        <div className="bg-slate-900/50 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-semibold text-white">
              Professional Training Tips
              <span className="text-amber-400 text-sm font-normal ml-2">专业训练建议</span>
            </h3>
          </div>
          <ul className="space-y-2 text-sm text-slate-400">
            <li className="flex items-start gap-2">
              <span className="text-amber-400 mt-0.5 shrink-0">&#x2022;</span>
              Warm up properly before targeting this muscle group with 5-10 minutes of light cardio and dynamic stretching.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 mt-0.5 shrink-0">&#x2022;</span>
              Focus on mind-muscle connection — concentrate on feeling the target muscle contract during each rep.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 mt-0.5 shrink-0">&#x2022;</span>
              Train this muscle group 2-3 times per week with at least 48 hours of recovery between sessions.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 mt-0.5 shrink-0">&#x2022;</span>
              Progressive overload is key — gradually increase weight, reps, or sets over time for continued growth.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 mt-0.5 shrink-0">&#x2022;</span>
              Balance push and pull exercises to prevent muscle imbalances and reduce injury risk.
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
