"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

// Maps SVG zone names to muscle group IDs
export const svgZoneToMuscleGroup: Record<string, string> = {
  chest: "chest",
  shoulders: "shoulders",
  biceps: "arms",
  triceps: "arms",
  forearms: "arms",
  abs: "core",
  obliques: "core",
  "upper-back": "back",
  lats: "back",
  "lower-back": "back",
  traps: "back",
  glutes: "glutes",
  quads: "legs",
  hamstrings: "legs",
  calves: "legs",
};

interface BodyExplorerProps {
  selectedGroup?: string;
  onSelectGroup: (groupId: string) => void;
}

type ViewMode = "front" | "back";

interface ZoneDefinition {
  id: string;
  label: string;
  front: boolean;
  back: boolean;
}

const zones: ZoneDefinition[] = [
  { id: "chest", label: "Chest", front: true, back: false },
  { id: "shoulders", label: "Shoulders", front: true, back: false },
  { id: "biceps", label: "Biceps", front: true, back: false },
  { id: "abs", label: "Abs", front: true, back: false },
  { id: "obliques", label: "Obliques", front: true, back: false },
  { id: "quads", label: "Quads", front: true, back: false },
  { id: "calves", label: "Calves", front: true, back: true },
  { id: "traps", label: "Traps", front: false, back: true },
  { id: "lats", label: "Lats", front: false, back: true },
  { id: "glutes", label: "Glutes", front: false, back: true },
  { id: "hamstrings", label: "Hamstrings", front: false, back: true },
];

export function BodyExplorer({ selectedGroup, onSelectGroup }: BodyExplorerProps) {
  const [view, setView] = useState<ViewMode>("front");

  const filteredZones = zones.filter((z) => (view === "front" ? z.front : z.back));

  function isZoneSelected(zoneId: string): boolean {
    const groupId = svgZoneToMuscleGroup[zoneId];
    return selectedGroup === groupId;
  }

  function handleZoneClick(zoneId: string) {
    const groupId = svgZoneToMuscleGroup[zoneId];
    if (groupId) {
      onSelectGroup(groupId);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Segmented control for front/back toggle */}
      <div className="inline-flex rounded-xl bg-slate-800/60 border border-white/5 p-1">
        <button
          type="button"
          onClick={() => setView("front")}
          className={cn(
            "px-5 py-2 text-sm font-medium rounded-lg transition-all duration-300 cursor-pointer",
            view === "front"
              ? "bg-amber-500/20 text-amber-500"
              : "text-slate-400 hover:text-white"
          )}
        >
          Front
        </button>
        <button
          type="button"
          onClick={() => setView("back")}
          className={cn(
            "px-5 py-2 text-sm font-medium rounded-lg transition-all duration-300 cursor-pointer",
            view === "back"
              ? "bg-amber-500/20 text-amber-500"
              : "text-slate-400 hover:text-white"
          )}
        >
          Back
        </button>
      </div>

      {/* SVG Body Map */}
      <svg
        viewBox="0 0 200 440"
        className="w-full max-w-[280px] h-auto select-none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="amber-glow-filter">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feFlood floodColor="#f59e0b" floodOpacity="0.4" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* --- BACKGROUND SILHOUETTE --- */}
        {/* Head */}
        <ellipse cx="100" cy="28" rx="22" ry="25" className="fill-slate-800/40 stroke-white/5" strokeWidth="1" />

        {/* Neck */}
        <rect x="91" y="50" width="18" height="16" rx="4" className="fill-slate-800/40 stroke-white/5" strokeWidth="1" />

        {/* Torso */}
        <path
          d="M70 66 L68 155 Q68 165 75 170 L82 174 L100 176 L118 174 L125 170 Q132 165 132 155 L130 66 Q120 58 100 58 Q80 58 70 66Z"
          className="fill-slate-800/40 stroke-white/5"
          strokeWidth="1"
        />

        {/* Arms - upper */}
        <rect x="52" y="72" width="18" height="42" rx="9" className="fill-slate-800/40 stroke-white/5" strokeWidth="1" />
        <rect x="130" y="72" width="18" height="42" rx="9" className="fill-slate-800/40 stroke-white/5" strokeWidth="1" />

        {/* Arms - lower */}
        <rect x="54" y="112" width="14" height="38" rx="7" className="fill-slate-800/40 stroke-white/5" strokeWidth="1" />
        <rect x="132" y="112" width="14" height="38" rx="7" className="fill-slate-800/40 stroke-white/5" strokeWidth="1" />

        {/* Hands */}
        <ellipse cx="61" cy="153" rx="8" ry="6" className="fill-slate-800/40 stroke-white/5" strokeWidth="1" />
        <ellipse cx="139" cy="153" rx="8" ry="6" className="fill-slate-800/40 stroke-white/5" strokeWidth="1" />

        {/* Legs - upper */}
        <rect x="78" y="174" width="19" height="58" rx="9" className="fill-slate-800/40 stroke-white/5" strokeWidth="1" />
        <rect x="103" y="174" width="19" height="58" rx="9" className="fill-slate-800/40 stroke-white/5" strokeWidth="1" />

        {/* Legs - lower */}
        <rect x="79" y="230" width="17" height="52" rx="8" className="fill-slate-800/40 stroke-white/5" strokeWidth="1" />
        <rect x="104" y="230" width="17" height="52" rx="8" className="fill-slate-800/40 stroke-white/5" strokeWidth="1" />

        {/* Feet */}
        <ellipse cx="87" cy="285" rx="11" ry="5" className="fill-slate-800/40 stroke-white/5" strokeWidth="1" />
        <ellipse cx="113" cy="285" rx="11" ry="5" className="fill-slate-800/40 stroke-white/5" strokeWidth="1" />

        {/* --- INTERACTIVE ZONES --- */}

        {/* Front view zones */}
        {view === "front" && (
          <>
            {/* Chest */}
            <path
              d="M75 70 L73 110 Q73 118 78 122 L82 126 L100 128 L118 126 L122 122 Q127 118 127 110 L125 70 Q118 64 100 64 Q82 64 75 70Z"
              className={cn(
                "transition-all duration-300 cursor-pointer",
                isZoneSelected("chest")
                  ? "fill-amber-500/20 stroke-amber-500"
                  : "fill-transparent stroke-white/5 hover:fill-amber-500/10 hover:stroke-amber-500/40"
              )}
              strokeWidth="1.5"
              onClick={() => handleZoneClick("chest")}
            />

            {/* Shoulders - left */}
            <ellipse
              cx="64"
              cy="78"
              rx="10"
              ry="10"
              className={cn(
                "transition-all duration-300 cursor-pointer",
                isZoneSelected("shoulders")
                  ? "fill-amber-500/20 stroke-amber-500"
                  : "fill-transparent stroke-white/5 hover:fill-amber-500/10 hover:stroke-amber-500/40"
              )}
              strokeWidth="1.5"
              onClick={() => handleZoneClick("shoulders")}
            />
            {/* Shoulders - right */}
            <ellipse
              cx="136"
              cy="78"
              rx="10"
              ry="10"
              className={cn(
                "transition-all duration-300 cursor-pointer",
                isZoneSelected("shoulders")
                  ? "fill-amber-500/20 stroke-amber-500"
                  : "fill-transparent stroke-white/5 hover:fill-amber-500/10 hover:stroke-amber-500/40"
              )}
              strokeWidth="1.5"
              onClick={() => handleZoneClick("shoulders")}
            />

            {/* Biceps - left */}
            <rect
              x="52"
              y="72"
              width="18"
              height="42"
              rx="9"
              className={cn(
                "transition-all duration-300 cursor-pointer",
                isZoneSelected("biceps")
                  ? "fill-amber-500/20 stroke-amber-500"
                  : "fill-transparent stroke-white/5 hover:fill-amber-500/10 hover:stroke-amber-500/40"
              )}
              strokeWidth="1.5"
              onClick={() => handleZoneClick("biceps")}
            />
            {/* Biceps - right */}
            <rect
              x="130"
              y="72"
              width="18"
              height="42"
              rx="9"
              className={cn(
                "transition-all duration-300 cursor-pointer",
                isZoneSelected("biceps")
                  ? "fill-amber-500/20 stroke-amber-500"
                  : "fill-transparent stroke-white/5 hover:fill-amber-500/10 hover:stroke-amber-500/40"
              )}
              strokeWidth="1.5"
              onClick={() => handleZoneClick("biceps")}
            />

            {/* Abs - center */}
            <rect
              x="84"
              y="110"
              width="32"
              height="40"
              rx="6"
              className={cn(
                "transition-all duration-300 cursor-pointer",
                isZoneSelected("abs")
                  ? "fill-amber-500/20 stroke-amber-500"
                  : "fill-transparent stroke-white/5 hover:fill-amber-500/10 hover:stroke-amber-500/40"
              )}
              strokeWidth="1.5"
              onClick={() => handleZoneClick("abs")}
            />

            {/* Obliques - left */}
            <path
              d="M74 112 L74 152 Q74 160 82 164 L100 167 L100 126 L82 122 Q74 118 74 112Z"
              className={cn(
                "transition-all duration-300 cursor-pointer",
                isZoneSelected("obliques")
                  ? "fill-amber-500/20 stroke-amber-500"
                  : "fill-transparent stroke-white/5 hover:fill-amber-500/10 hover:stroke-amber-500/40"
              )}
              strokeWidth="1.5"
              onClick={() => handleZoneClick("obliques")}
            />
            {/* Obliques - right */}
            <path
              d="M126 112 L126 152 Q126 160 118 164 L100 167 L100 126 L118 122 Q126 118 126 112Z"
              className={cn(
                "transition-all duration-300 cursor-pointer",
                isZoneSelected("obliques")
                  ? "fill-amber-500/20 stroke-amber-500"
                  : "fill-transparent stroke-white/5 hover:fill-amber-500/10 hover:stroke-amber-500/40"
              )}
              strokeWidth="1.5"
              onClick={() => handleZoneClick("obliques")}
            />

            {/* Quads - left */}
            <rect
              x="78"
              y="174"
              width="19"
              height="58"
              rx="9"
              className={cn(
                "transition-all duration-300 cursor-pointer",
                isZoneSelected("quads")
                  ? "fill-amber-500/20 stroke-amber-500"
                  : "fill-transparent stroke-white/5 hover:fill-amber-500/10 hover:stroke-amber-500/40"
              )}
              strokeWidth="1.5"
              onClick={() => handleZoneClick("quads")}
            />
            {/* Quads - right */}
            <rect
              x="103"
              y="174"
              width="19"
              height="58"
              rx="9"
              className={cn(
                "transition-all duration-300 cursor-pointer",
                isZoneSelected("quads")
                  ? "fill-amber-500/20 stroke-amber-500"
                  : "fill-transparent stroke-white/5 hover:fill-amber-500/10 hover:stroke-amber-500/40"
              )}
              strokeWidth="1.5"
              onClick={() => handleZoneClick("quads")}
            />

            {/* Calves - left */}
            <rect
              x="79"
              y="230"
              width="17"
              height="52"
              rx="8"
              className={cn(
                "transition-all duration-300 cursor-pointer",
                isZoneSelected("calves")
                  ? "fill-amber-500/20 stroke-amber-500"
                  : "fill-transparent stroke-white/5 hover:fill-amber-500/10 hover:stroke-amber-500/40"
              )}
              strokeWidth="1.5"
              onClick={() => handleZoneClick("calves")}
            />
            {/* Calves - right */}
            <rect
              x="104"
              y="230"
              width="17"
              height="52"
              rx="8"
              className={cn(
                "transition-all duration-300 cursor-pointer",
                isZoneSelected("calves")
                  ? "fill-amber-500/20 stroke-amber-500"
                  : "fill-transparent stroke-white/5 hover:fill-amber-500/10 hover:stroke-amber-500/40"
              )}
              strokeWidth="1.5"
              onClick={() => handleZoneClick("calves")}
            />
          </>
        )}

        {/* Back view zones */}
        {view === "back" && (
          <>
            {/* Traps - upper back */}
            <path
              d="M75 68 L73 95 Q73 100 78 104 L85 110 L100 112 L115 110 L122 104 Q127 100 127 95 L125 68 Q118 62 100 62 Q82 62 75 68Z"
              className={cn(
                "transition-all duration-300 cursor-pointer",
                isZoneSelected("traps")
                  ? "fill-amber-500/20 stroke-amber-500"
                  : "fill-transparent stroke-white/5 hover:fill-amber-500/10 hover:stroke-amber-500/40"
              )}
              strokeWidth="1.5"
              onClick={() => handleZoneClick("traps")}
            />

            {/* Lats - mid back sides */}
            <path
              d="M74 96 L72 148 Q72 156 80 162 L88 166 L100 168 L112 166 L120 162 Q128 156 128 148 L126 96 Q118 82 100 82 Q82 82 74 96Z"
              className={cn(
                "transition-all duration-300 cursor-pointer",
                isZoneSelected("lats")
                  ? "fill-amber-500/20 stroke-amber-500"
                  : "fill-transparent stroke-white/5 hover:fill-amber-500/10 hover:stroke-amber-500/40"
              )}
              strokeWidth="1.5"
              onClick={() => handleZoneClick("lats")}
            />

            {/* Glutes - left */}
            <ellipse
              cx="87"
              cy="178"
              rx="14"
              ry="16"
              className={cn(
                "transition-all duration-300 cursor-pointer",
                isZoneSelected("glutes")
                  ? "fill-amber-500/20 stroke-amber-500"
                  : "fill-transparent stroke-white/5 hover:fill-amber-500/10 hover:stroke-amber-500/40"
              )}
              strokeWidth="1.5"
              onClick={() => handleZoneClick("glutes")}
            />
            {/* Glutes - right */}
            <ellipse
              cx="113"
              cy="178"
              rx="14"
              ry="16"
              className={cn(
                "transition-all duration-300 cursor-pointer",
                isZoneSelected("glutes")
                  ? "fill-amber-500/20 stroke-amber-500"
                  : "fill-transparent stroke-white/5 hover:fill-amber-500/10 hover:stroke-amber-500/40"
              )}
              strokeWidth="1.5"
              onClick={() => handleZoneClick("glutes")}
            />

            {/* Hamstrings - left */}
            <rect
              x="78"
              y="196"
              width="19"
              height="48"
              rx="9"
              className={cn(
                "transition-all duration-300 cursor-pointer",
                isZoneSelected("hamstrings")
                  ? "fill-amber-500/20 stroke-amber-500"
                  : "fill-transparent stroke-white/5 hover:fill-amber-500/10 hover:stroke-amber-500/40"
              )}
              strokeWidth="1.5"
              onClick={() => handleZoneClick("hamstrings")}
            />
            {/* Hamstrings - right */}
            <rect
              x="103"
              y="196"
              width="19"
              height="48"
              rx="9"
              className={cn(
                "transition-all duration-300 cursor-pointer",
                isZoneSelected("hamstrings")
                  ? "fill-amber-500/20 stroke-amber-500"
                  : "fill-transparent stroke-white/5 hover:fill-amber-500/10 hover:stroke-amber-500/40"
              )}
              strokeWidth="1.5"
              onClick={() => handleZoneClick("hamstrings")}
            />

            {/* Calves - left (same as front, visible from both views) */}
            <rect
              x="79"
              y="242"
              width="17"
              height="40"
              rx="8"
              className={cn(
                "transition-all duration-300 cursor-pointer",
                isZoneSelected("calves")
                  ? "fill-amber-500/20 stroke-amber-500"
                  : "fill-transparent stroke-white/5 hover:fill-amber-500/10 hover:stroke-amber-500/40"
              )}
              strokeWidth="1.5"
              onClick={() => handleZoneClick("calves")}
            />
            {/* Calves - right */}
            <rect
              x="104"
              y="242"
              width="17"
              height="40"
              rx="8"
              className={cn(
                "transition-all duration-300 cursor-pointer",
                isZoneSelected("calves")
                  ? "fill-amber-500/20 stroke-amber-500"
                  : "fill-transparent stroke-white/5 hover:fill-amber-500/10 hover:stroke-amber-500/40"
              )}
              strokeWidth="1.5"
              onClick={() => handleZoneClick("calves")}
            />
          </>
        )}
      </svg>

      {/* Zone labels */}
      <div className="flex flex-wrap gap-1.5 justify-center max-w-[300px]">
        {filteredZones.map((zone) => (
          <button
            key={zone.id}
            type="button"
            onClick={() => handleZoneClick(zone.id)}
            className={cn(
              "px-2.5 py-1 text-xs rounded-full border transition-all duration-300 cursor-pointer",
              isZoneSelected(zone.id)
                ? "bg-amber-500/20 border-amber-500 text-amber-500"
                : "bg-slate-800/40 border-white/5 text-slate-400 hover:border-white/10 hover:text-white"
            )}
          >
            {zone.label}
          </button>
        ))}
      </div>
    </div>
  );
}
