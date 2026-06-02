"use client";

import { useState } from "react";
import Link from "next/link";
import { muscleGroups, getMusclesByGroup, getMuscleById } from "@/data/muscles";
import { exercises } from "@/data/exercises";
import { cn } from "@/lib/utils";
import type { Difficulty } from "@/data/exercises";

const difficultyConfig: Record<Difficulty, { label: string; labelZh: string; className: string }> = {
  beginner: {
    label: "Beginner",
    labelZh: "初级",
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  },
  intermediate: {
    label: "Intermediate",
    labelZh: "中级",
    className: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  },
  advanced: {
    label: "Advanced",
    labelZh: "高级",
    className: "bg-red-500/10 text-red-400 border-red-500/30",
  },
  elite: {
    label: "Elite",
    labelZh: "精英",
    className: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  },
};

type FilterTab = "all" | Difficulty;

export default function ExplorePage() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  const filteredExercises =
    activeFilter === "all"
      ? exercises
      : exercises.filter((e) => e.difficulty === activeFilter);

  const tabs: { key: FilterTab; label: string; labelZh: string }[] = [
    { key: "all", label: "All", labelZh: "全部" },
    { key: "beginner", label: "Beginner", labelZh: "初级" },
    { key: "intermediate", label: "Intermediate", labelZh: "中级" },
    { key: "advanced", label: "Advanced", labelZh: "高级" },
    { key: "elite", label: "Elite", labelZh: "精英" },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-16 px-4">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-4xl mx-auto text-center space-y-4">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            <span className="gradient-text-amber">Explore Your Body</span>
          </h1>
          <p className="text-lg text-slate-400">探索你的身体</p>
          <p className="text-sm text-slate-500 max-w-xl mx-auto">
            Discover every muscle group and exercise. Understand how your body works to train smarter.
          </p>
        </div>
      </section>

      {/* Muscle Groups Grid */}
      <section className="px-4 pb-16 max-w-6xl mx-auto">
        <h2 className="text-2xl font-semibold text-white mb-6 text-center">
          Muscle Groups <span className="text-amber-400 text-lg ml-1">肌群</span>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {muscleGroups.map((group) => {
            const count = getMusclesByGroup(group.id).length;
            return (
              <Link
                key={group.id}
                href={`/muscles/${group.id}`}
                className={cn(
                  "group relative bg-slate-900/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6",
                  "hover:border-amber-500/30 hover:bg-slate-900/70",
                  "transition-all duration-300 hover:-translate-y-1",
                  "hover:shadow-lg hover:shadow-amber-500/5"
                )}
              >
                <div className="text-3xl mb-3">{group.icon}</div>
                <h3 className="text-white font-semibold text-lg group-hover:text-amber-400 transition-colors">
                  {group.name}
                </h3>
                <p className="text-amber-300/80 text-sm mb-2">{group.nameZh}</p>
                <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">
                  {group.description}
                </p>
                <span className="inline-block mt-3 text-xs text-slate-500 bg-slate-800/50 rounded-full px-2.5 py-0.5">
                  {count} muscles
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Exercise Library */}
      <section className="px-4 pb-20 max-w-6xl mx-auto">
        <h2 className="text-2xl font-semibold text-white mb-2 text-center">
          Exercise Library <span className="text-amber-400 text-lg ml-1">动作库</span>
        </h2>
        <p className="text-slate-500 text-sm text-center mb-8">
          Browse {exercises.length} exercises with professional instructions
        </p>

        {/* Filter Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                activeFilter === tab.key
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  : "bg-slate-800/50 text-slate-400 border border-white/5 hover:border-amber-500/20 hover:text-slate-300"
              )}
            >
              {tab.labelZh} / {tab.label}
            </button>
          ))}
        </div>

        {/* Exercise Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExercises.map((exercise) => {
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
                  {exercise.primaryMuscles.slice(0, 3).map((muscleId) => {
                    const muscle = getMuscleById(muscleId);
                    return (
                      <span
                        key={muscleId}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800/70 text-slate-400 border border-slate-700/50"
                      >
                        {muscle?.name ?? muscleId}
                      </span>
                    );
                  })}
                  {exercise.primaryMuscles.length > 3 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full text-slate-500">
                      +{exercise.primaryMuscles.length - 3}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {filteredExercises.length === 0 && (
          <div className="text-center py-16">
            <p className="text-slate-500">No exercises found for this filter.</p>
          </div>
        )}
      </section>
    </div>
  );
}
