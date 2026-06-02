"use client";

import { cn } from "@/lib/utils";
import { getMuscleGroup, getMusclesByGroup } from "@/data/muscles";
import { getExercisesByMuscle } from "@/data/exercises";
import type { MuscleGroupId } from "@/data/muscles";
import {
  Dumbbell,
  MoveUpRight,
  Footprints,
  Target,
  UserCheck,
  Activity,
  ChevronsUp,
} from "lucide-react";

interface MuscleCardProps {
  groupId: string;
  onClick?: () => void;
}

const groupIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  chest: Dumbbell,
  back: ChevronsUp,
  shoulders: MoveUpRight,
  arms: Dumbbell,
  core: Target,
  legs: Footprints,
  glutes: UserCheck,
  "full-body": Activity,
};

function getGroupIcon(groupId: string) {
  const Component = groupIconMap[groupId] || Activity;
  return Component;
}

export function MuscleCard({ groupId, onClick }: MuscleCardProps) {
  const group = getMuscleGroup(groupId as MuscleGroupId);
  const muscles = getMusclesByGroup(groupId as MuscleGroupId);

  if (!group) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900/50 border border-white/5">
        <p className="text-slate-400 text-sm">Muscle group not found</p>
      </div>
    );
  }

  // Count unique exercises across all muscles in this group
  const exerciseIds = new Set<string>();
  muscles.forEach((m) => {
    const exs = getExercisesByMuscle(m.id);
    exs.forEach((e) => exerciseIds.add(e.id));
  });

  const IconComponent = getGroupIcon(groupId);

  return (
    <div
      onClick={onClick}
      className={cn(
        "p-5 rounded-2xl transition-all duration-300",
        "bg-slate-900/50 backdrop-blur-sm border border-white/5",
        onClick && "cursor-pointer hover:border-white/10 hover:shadow-lg hover:shadow-amber-500/5 hover:-translate-y-0.5"
      )}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-3">
        <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
          <IconComponent className="w-5 h-5 text-amber-500" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-white">{group.nameZh}</h4>
          <p className="text-xs text-slate-400 mt-0.5">{group.name}</p>
        </div>

        {/* Exercise count badge */}
        {exerciseIds.size > 0 && (
          <span className="flex-shrink-0 px-2 py-0.5 text-[10px] font-medium rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
            {exerciseIds.size} exercises
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-xs text-slate-400 leading-relaxed mb-3 line-clamp-2">
        {group.description}
      </p>

      {/* Muscle tags */}
      {muscles.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {muscles.map((muscle) => (
            <span
              key={muscle.id}
              className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-slate-800/60 text-slate-300 border border-white/5"
            >
              {muscle.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
