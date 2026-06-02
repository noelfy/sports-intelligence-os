"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { getMuscleGroup, getMusclesByGroup, type MuscleGroupId } from "@/data/muscles";
import { getExerciseById } from "@/data/exercises";
import { X, ChevronRight, Target, Activity, Dumbbell, StretchVertical, Search } from "lucide-react";

interface MuscleDetailSheetProps {
  groupId: string | null;
  onClose: () => void;
  onExerciseClick: (exerciseId: string) => void;
}

export function MuscleDetailSheet({
  groupId,
  onClose,
  onExerciseClick,
}: MuscleDetailSheetProps) {
  const [visible, setVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Mount when groupId becomes non-null
  useEffect(() => {
    if (groupId) {
      setIsMounted(true);
      // Trigger animation on next frame
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setVisible(true);
        });
      });
    }
  }, [groupId]);

  // Handle close with animation
  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      setIsMounted(false);
      onClose();
    }, 350);
  }, [onClose]);

  // Prevent background scroll when sheet is open
  useEffect(() => {
    if (isMounted) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isMounted]);

  // Group data
  const group = groupId ? getMuscleGroup(groupId as MuscleGroupId) : null;
  const muscles = groupId ? getMusclesByGroup(groupId as MuscleGroupId) : [];

  // Collect all unique exercises from muscles' primaryExercises
  const recommendedExercises = useMemo(() => {
    const ids = new Set<string>();
    muscles.forEach((m) => {
      m.primaryExercises.forEach((id) => ids.add(id));
    });
    return Array.from(ids)
      .map((id) => getExerciseById(id))
      .filter(Boolean);
  }, [muscles]);

  if (!isMounted || !group) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className={cn(
          "absolute inset-0 transition-all duration-300",
          visible ? "bg-black/60 backdrop-blur-sm" : "bg-transparent"
        )}
      />

      {/* Sheet panel */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto rounded-t-3xl",
          "bg-slate-900/95 backdrop-blur-xl border-t border-white/10 glass-scroll",
          "transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
          visible ? "translate-y-0" : "translate-y-full"
        )}
      >
        {/* Drag handle */}
        <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-xl pt-3 pb-1 rounded-t-3xl">
          <div className="w-10 h-1 rounded-full bg-slate-700 mx-auto mb-3" />

          {/* Header with close button */}
          <div className="flex items-center justify-between px-6 pb-3">
            <div>
              <h2 className="text-lg font-bold text-white">{group.nameZh}</h2>
              <p className="text-xs text-slate-400">{group.name}</p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 hover:bg-amber-500/20 transition-colors duration-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-6 pb-8 space-y-6">
          {/* Description */}
          <p className="text-sm text-slate-300 leading-relaxed">
            {group.description}
          </p>

          {/* Muscles in this group */}
          {muscles.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-amber-500" />
                Muscles ({muscles.length})
              </h3>
              <div className="space-y-3">
                {muscles.map((muscle) => (
                  <div
                    key={muscle.id}
                    className="p-4 rounded-xl bg-slate-800/40 border border-white/5"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h4 className="text-sm font-medium text-white">
                        {muscle.name}
                      </h4>
                      <span className="flex-shrink-0 px-1.5 py-0.5 text-[9px] font-medium rounded bg-amber-500/10 text-amber-500/80 border border-amber-500/10">
                        {muscle.region === "upper"
                          ? "Upper"
                          : muscle.region === "lower"
                          ? "Lower"
                          : "Core"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 italic mb-2">
                      {muscle.scientificName}
                    </p>

                    {/* Function */}
                    <div className="flex items-start gap-1.5 mb-2">
                      <Activity className="w-3 h-3 text-amber-500/60 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {muscle.function}
                      </p>
                    </div>

                    {/* Daily use */}
                    <div className="flex items-start gap-1.5 mb-2">
                      <Search className="w-3 h-3 text-slate-500 mt-0.5 flex-shrink-0" />
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        {muscle.dailyUse}
                      </p>
                    </div>

                    {/* Stretch tip - collapsed */}
                    <details className="group mt-2">
                      <summary className="text-[11px] text-amber-500/70 cursor-pointer hover:text-amber-500 transition-colors flex items-center gap-1">
                        <StretchVertical className="w-3 h-3" />
                        Stretch tip
                      </summary>
                      <p className="text-[11px] text-slate-400 mt-1.5 pl-4 leading-relaxed">
                        {muscle.stretchTips}
                      </p>
                    </details>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Recommended exercises */}
          {recommendedExercises.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Dumbbell className="w-3.5 h-3.5 text-amber-500" />
                Recommended Exercises ({recommendedExercises.length})
              </h3>
              <div className="space-y-2">
                {recommendedExercises.map((ex) => {
                  if (!ex) return null;
                  return (
                    <button
                      key={ex.id}
                      type="button"
                      onClick={() => onExerciseClick(ex.id)}
                      className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-800/40 border border-white/5 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all duration-300 cursor-pointer text-left group"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white truncate">
                          {ex.nameZh}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {ex.name}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0 ml-2 group-hover:text-amber-500 transition-colors duration-300" />
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Safe area padding for mobile */}
          <div className="h-4" />
        </div>
      </div>
    </div>
  );
}
