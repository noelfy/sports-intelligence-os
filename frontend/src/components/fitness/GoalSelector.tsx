"use client";

import { cn } from "@/lib/utils";
import { goals } from "@/data/goals";
import { Dumbbell, MoveUpRight, Footprints, Target, UserCheck, Activity } from "lucide-react";

interface GoalSelectorProps {
  onSelect: (goalId: string) => void;
  selectedId?: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "build-chest": Dumbbell,
  "wider-back": MoveUpRight,
  "powerful-legs": Footprints,
  "core-stability": Target,
  "better-posture": UserCheck,
  "full-body": Activity,
};

function getGoalIcon(goalId: string) {
  const Component = iconMap[goalId] || Dumbbell;
  return Component;
}

export function GoalSelector({ onSelect, selectedId }: GoalSelectorProps) {
  return (
    <div className="scroll-x pb-2">
      <div className="flex gap-4 px-1 py-2">
        {goals.map((goal) => {
          const isSelected = selectedId === goal.id;
          const IconComponent = getGoalIcon(goal.id);

          return (
            <button
              key={goal.id}
              onClick={() => onSelect(goal.id)}
              type="button"
              className={cn(
                "flex-shrink-0 min-w-[200px] p-5 rounded-2xl text-left transition-all duration-300 cursor-pointer",
                "bg-slate-900/50 backdrop-blur-sm border",
                isSelected
                  ? "border-amber-500 amber-glow"
                  : "border-white/5 hover:border-white/10 hover:shadow-lg hover:shadow-amber-500/5"
              )}
            >
              <div
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors duration-300",
                  isSelected
                    ? "bg-amber-500/20 text-amber-500"
                    : "bg-slate-800/50 text-slate-400"
                )}
              >
                <IconComponent className="w-6 h-6" />
              </div>

              <h3
                className={cn(
                  "text-sm font-semibold mb-1 transition-colors duration-300",
                  isSelected ? "text-amber-500" : "text-white"
                )}
              >
                {goal.titleZh}
              </h3>
              <p className="text-xs text-slate-400 line-clamp-2">{goal.subtitle}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
