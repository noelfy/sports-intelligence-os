"use client";

import { cn } from "@/lib/utils";
import { getMuscleById } from "@/data/muscles";
import type { ExerciseData } from "@/types";
import {
  Dumbbell,
  TrendingUp,
  Target,
  Activity,
  Grip,
} from "lucide-react";

interface ExerciseCardProps {
  exercise: ExerciseData;
  onClick?: () => void;
}

const difficultyConfig: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  beginner: {
    label: "Beginner",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/20",
  },
  intermediate: {
    label: "Intermediate",
    bg: "bg-amber-500/10",
    text: "text-amber-500",
    border: "border-amber-500/20",
  },
  advanced: {
    label: "Advanced",
    bg: "bg-red-500/10",
    text: "text-red-400",
    border: "border-red-500/20",
  },
};

const categoryConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  push: { label: "Push", icon: TrendingUp },
  pull: { label: "Pull", icon: Activity },
  squat: { label: "Squat", icon: TrendingUp },
  hinge: { label: "Hinge", icon: Activity },
  carry: { label: "Carry", icon: Grip },
  core: { label: "Core", icon: Target },
  isolation: { label: "Isolation", icon: Dumbbell },
};

const equipmentLabels: Record<string, string> = {
  bodyweight: "Bodyweight",
  dumbbells: "Dumbbells",
  barbell: "Barbell",
  cable: "Cable",
  kettlebell: "Kettlebell",
  machine: "Machine",
  "resistance-band": "Band",
  "pull-up-bar": "Pull-Up Bar",
  bench: "Bench",
  "ez-bar": "EZ Bar",
};

export function ExerciseCard({ exercise, onClick }: ExerciseCardProps) {
  const diffConfig = difficultyConfig[exercise.difficulty] || difficultyConfig.beginner;
  const catConfig = categoryConfig[exercise.category];

  return (
    <div
      onClick={onClick}
      className={cn(
        "p-5 rounded-2xl transition-all duration-300",
        "bg-slate-900/50 backdrop-blur-sm border border-white/5",
        onClick &&
          "cursor-pointer hover:border-white/10 hover:shadow-lg hover:shadow-amber-500/5 hover:-translate-y-0.5"
      )}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-white truncate">
            {exercise.nameZh}
          </h4>
          <p className="text-xs text-slate-400 truncate mt-0.5">
            {exercise.name}
          </p>
        </div>

        {/* Difficulty badge */}
        <span
          className={cn(
            "flex-shrink-0 px-2 py-0.5 text-[10px] font-medium rounded-full border",
            diffConfig.bg,
            diffConfig.text,
            diffConfig.border
          )}
        >
          {diffConfig.label}
        </span>
      </div>

      {/* Equipment tags */}
      {exercise.equipment.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {exercise.equipment.map((eq) => (
            <span
              key={eq}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-md bg-slate-800/60 text-slate-300 border border-white/5"
            >
              <Dumbbell className="w-3 h-3 text-slate-500" />
              {equipmentLabels[eq] || eq}
            </span>
          ))}
        </div>
      )}

      {/* Target muscle tags */}
      {exercise.primaryMuscles.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {exercise.primaryMuscles.map((muscleId) => {
            const muscle = getMuscleById(muscleId);
            return (
              <span
                key={muscleId}
                className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-amber-500/5 text-amber-400/80 border border-amber-500/10"
              >
                {muscle?.name || muscleId}
              </span>
            );
          })}
        </div>
      )}

      {/* Category badge */}
      {catConfig && (
        <div className="flex items-center gap-1.5">
          {(() => {
            const CatIcon = catConfig.icon;
            return <CatIcon className="w-3 h-3 text-slate-500" />;
          })()}
          <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
            {catConfig.label}
          </span>
        </div>
      )}
    </div>
  );
}
