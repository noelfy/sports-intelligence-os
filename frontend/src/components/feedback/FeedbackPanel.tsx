"use client";

import type { FeedbackData } from "@/types";
import { GlassCard } from "@/components/common/GlassCard";

interface FeedbackPanelProps {
  feedback: FeedbackData;
}

export function FeedbackPanel({ feedback }: FeedbackPanelProps) {
  const score = feedback.overall_score || 0;
  const scoreColor =
    score >= 80 ? "text-green-400" : score >= 60 ? "text-yellow-400" : "text-red-400";
  const scoreRing =
    score >= 80 ? "stroke-green-400" : score >= 60 ? "stroke-yellow-400" : "stroke-red-400";

  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <GlassCard className="space-y-6">
      {/* Overall Score */}
      <div className="flex items-center gap-6">
        <div className="relative w-32 h-32 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
            <circle
              cx="60" cy="60" r="54"
              fill="none"
              className={scoreRing}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 1s ease-out" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-3xl font-bold ${scoreColor}`}>{Math.round(score)}</span>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Movement Score</h3>
          <p className="text-sm text-slate-400 mt-1">{feedback.summary}</p>
        </div>
      </div>

      {/* Metric Bars */}
      {feedback.metrics && (
        <div className="space-y-3">
          {Object.entries(feedback.metrics).map(([key, value]) => (
            <div key={key} className="flex items-center gap-3">
              <span className="w-24 text-sm text-slate-400 capitalize">{key}</span>
              <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    value >= 80
                      ? "bg-gradient-to-r from-green-400 to-emerald-500"
                      : value >= 60
                      ? "bg-gradient-to-r from-yellow-400 to-orange-500"
                      : "bg-gradient-to-r from-red-400 to-pink-500"
                  }`}
                  style={{ width: `${value}%` }}
                />
              </div>
              <span className="w-10 text-sm text-right text-slate-300">{Math.round(value)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-semibold text-green-400 mb-2">Strengths</h4>
          <ul className="space-y-1">
            {feedback.strengths.map((s, i) => (
              <li key={i} className="text-sm text-slate-300 flex gap-2">
                <span className="text-green-400">+</span> {s}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-amber-400 mb-2">Areas to Improve</h4>
          <ul className="space-y-1">
            {feedback.improvements.map((s, i) => (
              <li key={i} className="text-sm text-slate-300 flex gap-2">
                <span className="text-amber-400">→</span> {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Detailed Feedback */}
      <div>
        <h4 className="text-sm font-semibold text-sky-400 mb-2">AI Analysis</h4>
        <p className="text-sm text-slate-300 leading-relaxed">{feedback.detailed_feedback}</p>
      </div>
    </GlassCard>
  );
}
