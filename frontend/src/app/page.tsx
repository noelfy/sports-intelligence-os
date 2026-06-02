"use client";

import { useState } from "react";
import Link from "next/link";
import { goals } from "@/data/goals";
import { exercises } from "@/data/exercises";
import { muscleGroups, getMusclesByGroup, getMuscleById } from "@/data/muscles";
import { cn } from "@/lib/utils";
import { ChevronRight, ArrowRight, Activity, Video } from "lucide-react";
import type { Difficulty } from "@/data/exercises";
import { ExerciseAnimation } from "@/components/fitness/ExerciseAnimation";

const difficultyConfig: Record<Difficulty, { labelZh: string; className: string }> = {
  beginner: { labelZh: "初级", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  intermediate: { labelZh: "中级", className: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  advanced: { labelZh: "高级", className: "bg-red-500/10 text-red-400 border-red-500/30" },
  elite: { labelZh: "精英", className: "bg-purple-500/10 text-purple-400 border-purple-500/30" },
};

// Featured exercise IDs to highlight on homepage
const featuredExerciseIds = ["barbell-squats", "pull-ups", "bench-press", "deadlifts"];

const featuredExercises = featuredExerciseIds
  .map((id) => exercises.find((e) => e.id === id))
  .filter(Boolean) as typeof exercises;

// SVG Body Map — abstract geometric zones for each muscle group
// Each zone maps to a MuscleGroupId
const bodyZonesFront = [
  { id: "chest", d: "M 95 60 Q 105 40 120 35 L 160 35 Q 175 40 185 60 L 180 110 Q 175 130 160 140 L 120 140 Q 105 130 100 110 Z", label: "Chest / 胸部" },
  { id: "shoulders", d: "M 75 55 Q 80 35 95 35 L 95 55 Z M 185 55 Q 200 35 205 55 L 185 55 Z", label: "Shoulders / 肩部" },
  { id: "arms", d: "M 65 60 L 85 60 L 85 120 L 65 120 Z M 195 60 L 215 60 L 215 120 L 195 120 Z", label: "Arms / 手臂" },
  { id: "core", d: "M 105 145 Q 110 165 115 180 L 140 185 L 165 180 L 170 145 Q 165 135 155 135 L 125 135 Q 115 135 105 145 Z", label: "Core / 核心" },
  { id: "legs", d: "M 105 250 L 125 235 L 140 235 L 155 250 L 155 380 L 145 390 L 135 390 L 125 380 L 125 250 Z M 160 250 L 175 235 L 190 235 L 200 250 L 200 380 L 190 390 L 180 390 L 170 380 L 170 250 Z", label: "Legs / 腿部" },
  { id: "glutes", d: "M 125 180 L 140 185 L 165 180 L 155 220 L 140 225 L 125 220 Z", label: "Glutes / 臀部" },
] as const;

const bodyZonesBack = [
  { id: "back", d: "M 95 60 Q 105 40 120 35 L 160 35 Q 175 40 185 60 L 180 140 Q 175 160 160 170 L 120 170 Q 105 160 100 140 Z", label: "Back / 背部" },
  { id: "shoulders", d: "M 75 55 Q 80 35 95 35 L 95 55 Z M 185 55 Q 200 35 205 55 L 185 55 Z", label: "Shoulders / 肩部" },
  { id: "arms", d: "M 65 60 L 85 60 L 85 120 L 65 120 Z M 195 60 L 215 60 L 215 120 L 195 120 Z", label: "Arms / 手臂" },
  { id: "glutes", d: "M 125 180 L 140 185 L 165 180 L 155 220 L 140 225 L 125 220 Z", label: "Glutes / 臀部" },
  { id: "legs", d: "M 105 250 L 125 235 L 140 235 L 155 250 L 155 380 L 145 390 L 135 390 L 125 380 L 125 250 Z M 160 250 L 175 235 L 190 235 L 200 250 L 200 380 L 190 390 L 180 390 L 170 380 L 170 250 Z", label: "Legs / 腿部" },
] as const;

export default function HomePage() {
  const [bodyView, setBodyView] = useState<"front" | "back">("front");
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  const zones = bodyView === "front" ? bodyZonesFront : bodyZonesBack;

  return (
    <div className="min-h-screen">
      {/* ============================================================ */}
      {/* HERO SECTION                                              */}
      {/* ============================================================ */}
      <section className="relative py-24 sm:py-32 px-4 overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none animate-breathe" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-amber-500/3 rounded-full blur-2xl pointer-events-none animate-breathe" style={{ animationDelay: "1s" }} />

        <div className="relative max-w-4xl mx-auto text-center space-y-6 animate-breathe">
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold tracking-tight leading-none">
            <span className="gradient-text-amber">训练即科学</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-medium">
            了解每一块肌肉，掌握每一个动作
          </p>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Understand every muscle, master every movement
          </p>
          <p className="text-sm text-slate-600 max-w-lg mx-auto">
            专业健身知识，触手可及
          </p>
          <div className="pt-4 flex items-center justify-center gap-4">
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 px-6 py-3 btn-amber rounded-xl text-sm"
            >
              Start Exploring
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="#goals"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm text-slate-400 hover:text-amber-400 transition-colors rounded-xl border border-slate-800 hover:border-amber-500/30"
            >
              Find Your Goal
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* GOAL SELECTOR SECTION                                      */}
      {/* ============================================================ */}
      <section id="goals" className="px-4 pb-20 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            你的目标是什么？
          </h2>
          <p className="text-slate-400 text-sm">
            What is your goal? Choose one to get started with expert guidance.
          </p>
        </div>

        {/* Horizontal scrollable goal cards */}
        <div className="scroll-x flex gap-4 pb-4">
          {goals.map((goal) => {
            const firstTargetGroup = goal.targetGroups[0];
            const muscleCount =
              firstTargetGroup === "full-body"
                ? "All Groups"
                : `${getMusclesByGroup(firstTargetGroup).length} Muscles`;

            return (
              <Link
                key={goal.id}
                href={`/muscles/${firstTargetGroup}`}
                className={cn(
                  "shrink-0 w-[280px] sm:w-[320px] group",
                  "bg-slate-900/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6",
                  "hover:border-amber-500/30 hover:bg-slate-900/70",
                  "transition-all duration-500 hover:-translate-y-2",
                  "hover:shadow-xl hover:shadow-amber-500/5"
                )}
              >
                <div className="text-4xl mb-4">{goal.icon}</div>
                <h3 className="text-lg font-semibold text-white group-hover:text-amber-400 transition-colors mb-1">
                  {goal.titleZh}
                </h3>
                <p className="text-slate-400 text-sm mb-3">{goal.subtitle}</p>
                <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 mb-4">
                  {goal.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {muscleCount}
                  </span>
                  <span className="text-amber-400 text-xs flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Explore <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ============================================================ */}
      {/* BODY EXPLORER SECTION                                      */}
      {/* ============================================================ */}
      <section className="px-4 pb-20 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            探索你的身体
          </h2>
          <p className="text-slate-400 text-sm">
            Explore Your Body — click any zone to learn about that muscle group.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex justify-center gap-2 mb-8">
          <button
            onClick={() => setBodyView("front")}
            className={cn(
              "px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200",
              bodyView === "front"
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                : "bg-slate-800/50 text-slate-400 border border-white/5 hover:border-amber-500/20"
            )}
          >
            Front / 正面
          </button>
          <button
            onClick={() => setBodyView("back")}
            className={cn(
              "px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200",
              bodyView === "back"
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                : "bg-slate-800/50 text-slate-400 border border-white/5 hover:border-amber-500/20"
            )}
          >
            Back / 背面
          </button>
        </div>

        {/* SVG Body Diagram */}
        <div className="flex justify-center">
          <Link
            href={hoveredZone ? `/muscles/${hoveredZone}` : "/explore"}
            className="block"
          >
            <svg
              viewBox="30 0 230 420"
              className="w-full max-w-[280px] h-auto"
              role="img"
              aria-label="Interactive body diagram showing muscle groups"
            >
              {/* Silhouette background */}
              {bodyView === "front" ? (
                <>
                  {/* Head */}
                  <ellipse cx="140" cy="22" rx="25" ry="28" fill="transparent" stroke="rgba(148,163,184,0.2)" strokeWidth="1.5" />
                  {/* Torso outline */}
                  <path
                    d="M 95 60 Q 105 40 120 35 L 160 35 Q 175 40 185 60 L 180 180 Q 175 200 160 210 L 120 210 Q 105 200 100 180 Z"
                    fill="transparent"
                    stroke="rgba(148,163,184,0.15)"
                    strokeWidth="1.5"
                  />
                  {/* Arms */}
                  <path d="M 95 60 L 75 145 L 70 160 M 185 60 L 205 145 L 210 160" fill="transparent" stroke="rgba(148,163,184,0.15)" strokeWidth="1.5" />
                  {/* Legs */}
                  <path d="M 120 210 L 115 340 L 105 400 M 160 210 L 165 340 L 175 400" fill="transparent" stroke="rgba(148,163,184,0.15)" strokeWidth="1.5" />
                </>
              ) : (
                <>
                  {/* Head */}
                  <ellipse cx="140" cy="22" rx="25" ry="28" fill="transparent" stroke="rgba(148,163,184,0.2)" strokeWidth="1.5" />
                  {/* Torso outline */}
                  <path
                    d="M 95 60 Q 105 40 120 35 L 160 35 Q 175 40 185 60 L 180 180 Q 175 200 160 210 L 120 210 Q 105 200 100 180 Z"
                    fill="transparent"
                    stroke="rgba(148,163,184,0.15)"
                    strokeWidth="1.5"
                  />
                  {/* Arms */}
                  <path d="M 95 60 L 75 145 L 70 160 M 185 60 L 205 145 L 210 160" fill="transparent" stroke="rgba(148,163,184,0.15)" strokeWidth="1.5" />
                  {/* Legs */}
                  <path d="M 120 210 L 115 340 L 105 400 M 160 210 L 165 340 L 175 400" fill="transparent" stroke="rgba(148,163,184,0.15)" strokeWidth="1.5" />
                </>
              )}

              {/* Interactive Zones */}
              {zones.map((zone) => {
                const group = muscleGroups.find((g) => g.id === zone.id);
                const isHovered = hoveredZone === zone.id;
                return (
                  <g
                    key={zone.id}
                    onMouseEnter={() => setHoveredZone(zone.id)}
                    onMouseLeave={() => setHoveredZone(null)}
                    className="cursor-pointer"
                  >
                    <path
                      d={zone.d}
                      fill={isHovered ? "rgba(245,158,11,0.25)" : "rgba(245,158,11,0.06)"}
                      stroke={isHovered ? "rgba(245,158,11,0.6)" : "rgba(245,158,11,0.15)"}
                      strokeWidth={isHovered ? 2 : 1}
                      className="transition-all duration-300"
                    />
                    {/* Label on hover */}
                    {isHovered && group && (
                      <text
                        x={140}
                        y={zone.id === "chest" || zone.id === "back" ? 95 : zone.id === "shoulders" ? 52 : zone.id === "arms" ? 85 : zone.id === "core" ? 170 : zone.id === "glutes" ? 200 : 320}
                        textAnchor="middle"
                        fill="#f59e0b"
                        fontSize="9"
                        fontWeight="600"
                        className="pointer-events-none"
                      >
                        {group.nameZh}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </Link>
        </div>

        {/* Zone indicator */}
        {hoveredZone && (
          <div className="text-center mt-4">
            <span className="text-sm text-amber-400">
              {muscleGroups.find((g) => g.id === hoveredZone)?.name} —{" "}
              {muscleGroups.find((g) => g.id === hoveredZone)?.nameZh}
            </span>
          </div>
        )}

        {!hoveredZone && (
          <p className="text-center text-slate-500 text-xs mt-4">
            Hover over a zone to explore muscle groups
          </p>
        )}
      </section>

      {/* ============================================================ */}
      {/* FEATURED EXERCISES SECTION                                 */}
      {/* ============================================================ */}
      <section className="px-4 pb-20 max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              精选动作
            </h2>
            <p className="text-slate-400 text-sm">
              Featured Exercises — curated compound movements for total body development.
            </p>
          </div>
          <Link
            href="/explore"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm text-amber-400 hover:text-amber-300 transition-colors group"
          >
            View All
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featuredExercises.map((exercise) => {
            const diff = difficultyConfig[exercise.difficulty];
            return (
              <Link
                key={exercise.id}
                href={`/exercises/${exercise.id}`}
                className={cn(
                  "group bg-slate-900/50 backdrop-blur-sm border border-white/5 rounded-2xl p-5",
                  "hover:border-amber-500/30 hover:bg-slate-900/70",
                  "transition-all duration-300 hover:-translate-y-1",
                  "hover:shadow-lg hover:shadow-amber-500/5"
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-white font-semibold group-hover:text-amber-400 transition-colors text-sm">
                      {exercise.name}
                    </h3>
                    <p className="text-amber-300/80 text-xs mt-0.5">{exercise.nameZh}</p>
                  </div>
                  <span
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full border font-medium shrink-0",
                      diff.className
                    )}
                  >
                    {diff.labelZh}
                  </span>
                </div>
                {/* Mini animation preview */}
                <div className="mb-3 rounded-lg overflow-hidden bg-slate-950/40 border border-white/[0.03]">
                  <ExerciseAnimation exerciseId={exercise.id} size="sm" autoPlay={false} />
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
                </div>
              </Link>
            );
          })}
        </div>

        {/* Mobile View All link */}
        <div className="text-center mt-6 sm:hidden">
          <Link
            href="/explore"
            className="inline-flex items-center gap-1.5 text-sm text-amber-400 hover:text-amber-300 transition-colors"
          >
            View All Exercises <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ============================================================ */}
      {/* ANALYZE YOUR FORM CTA                                       */}
      {/* ============================================================ */}
      <section className="px-4 pb-20 max-w-3xl mx-auto">
        <div className="relative bg-gradient-to-br from-amber-500/5 to-amber-600/5 backdrop-blur-sm border border-amber-500/10 rounded-3xl p-10 sm:p-14 text-center overflow-hidden group hover:border-amber-500/20 transition-all duration-500">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-amber-500/3 rounded-full blur-2xl pointer-events-none" />
          <div className="relative space-y-5">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Video className="w-7 h-7 text-amber-400" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              AI 动作分析
            </h2>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              Record your exercise and let our AI analyze your form. Get personalized feedback
              on what you&apos;re doing right and what needs improvement — just like having a personal coach.
            </p>
            <p className="text-slate-500 text-xs max-w-md mx-auto">
              上传训练视频，AI 自动检测动作标准度，提供专业改进建议
            </p>
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 px-8 py-3.5 btn-amber rounded-xl text-base font-semibold"
            >
              Analyze Your Form
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* BOTTOM CTA                                                 */}
      {/* ============================================================ */}
      <section className="px-4 pb-24 max-w-3xl mx-auto">
        <div className="relative bg-slate-900/50 backdrop-blur-sm border border-amber-500/10 rounded-3xl p-10 sm:p-14 text-center overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-amber-500/3 rounded-full blur-2xl pointer-events-none" />
          <div className="relative space-y-5">
            <Activity className="w-10 h-10 text-amber-400 mx-auto" />
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              开始你的训练之旅
            </h2>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              Start Your Training Journey — explore every muscle, discover the right exercises, and
              build the body you want with science-backed knowledge.
            </p>
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 px-8 py-3.5 btn-amber rounded-xl text-base font-semibold"
            >
              Start Exploring
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
