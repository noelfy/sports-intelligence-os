"use client";

import { useState, useEffect } from "react";
import { getCalibrationSessions, type CalibrationSessionSummary } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, Camera, Crosshair } from "lucide-react";

interface CalibrationSessionPickerProps {
  value: string | null; // session_id or null for "none"
  onChange: (sessionId: string | null) => void;
}

export function CalibrationSessionPicker({
  value,
  onChange,
}: CalibrationSessionPickerProps) {
  const [sessions, setSessions] = useState<CalibrationSessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getCalibrationSessions();
        if (!cancelled) {
          setSessions(data.filter((s) => s.status === "completed"));
        }
      } catch {
        if (!cancelled) setError("Failed to load calibration sessions");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedSession = sessions.find((s) => s.session_id === value) ?? null;

  const qualityColor = (errorPx: number | null) => {
    if (errorPx === null) return "text-slate-500";
    if (errorPx < 0.5) return "text-emerald-400";
    if (errorPx < 1.0) return "text-amber-400";
    return "text-red-400";
  };

  const qualityLabel = (errorPx: number | null) => {
    if (errorPx === null) return "";
    if (errorPx < 0.5) return "Excellent";
    if (errorPx < 1.0) return "Good";
    return "Acceptable";
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-left transition-colors",
          "bg-slate-800/70 border border-slate-700/50 hover:border-amber-500/30"
        )}
      >
        {selectedSession ? (
          <div className="flex items-center gap-3 min-w-0">
            <Crosshair className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {selectedSession.name}
              </p>
              <p className="text-xs text-slate-500">
                {selectedSession.camera_count} cameras ·{" "}
                <span className={qualityColor(selectedSession.reprojection_error)}>
                  {qualityLabel(selectedSession.reprojection_error)}
                  {selectedSession.reprojection_error != null &&
                    ` (${selectedSession.reprojection_error.toFixed(2)}px)`}
                </span>
              </p>
            </div>
          </div>
        ) : value === null ? (
          <div className="flex items-center gap-3">
            <Camera className="w-4 h-4 text-slate-500" />
            <span className="text-slate-400 text-sm">
              No calibration — basic 3D (无标定，基础3D)
            </span>
          </div>
        ) : (
          <span className="text-slate-500 text-sm">Select calibration... (选择标定数据)</span>
        )}
        <ChevronDown
          className={cn(
            "w-4 h-4 text-slate-500 transition-transform shrink-0",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-full bg-slate-850 border border-slate-700/50 rounded-xl overflow-hidden shadow-xl">
          {/* "No calibration" option */}
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-amber-500/10 transition-colors border-b border-slate-800",
              value === null && "bg-amber-500/10 border-l-2 border-amber-400"
            )}
          >
            <Camera className="w-4 h-4 text-slate-500" />
            <div>
              <p className="text-sm text-slate-300">No Calibration (无标定)</p>
              <p className="text-xs text-slate-500">
                Basic 3D reconstruction — works without calibration but less accurate
              </p>
            </div>
            {value === null && <Check className="w-4 h-4 text-amber-400 ml-auto shrink-0" />}
          </button>

          {/* Loading / Error / Empty states */}
          {loading && (
            <div className="px-4 py-6 text-center">
              <div className="w-5 h-5 mx-auto border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500 mt-2">Loading sessions...</p>
            </div>
          )}
          {error && (
            <p className="px-4 py-4 text-sm text-red-400 text-center">{error}</p>
          )}
          {!loading && !error && sessions.length === 0 && (
            <p className="px-4 py-6 text-sm text-slate-500 text-center">
              No completed calibration sessions found.
              <br />
              <span className="text-xs">
                Calibrate first, or use basic 3D mode above.
              </span>
            </p>
          )}

          {/* Session list */}
          {sessions.map((session) => (
            <button
              key={session.session_id}
              type="button"
              onClick={() => {
                onChange(session.session_id);
                setOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-amber-500/10 transition-colors",
                value === session.session_id &&
                  "bg-amber-500/10 border-l-2 border-amber-400"
              )}
            >
              <Crosshair className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white truncate">{session.name}</p>
                <p className="text-xs text-slate-500">
                  {session.camera_count} cameras ·{" "}
                  <span className={qualityColor(session.reprojection_error)}>
                    {qualityLabel(session.reprojection_error)}
                    {session.reprojection_error != null &&
                      ` (${session.reprojection_error.toFixed(2)}px)`}
                  </span>
                </p>
              </div>
              {value === session.session_id && (
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Click outside to close */}
      {open && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
}
