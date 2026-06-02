"use client";

import type { FeedbackData } from "@/types";
import { GlassCard } from "@/components/common/GlassCard";

interface FeedbackPanelProps {
  feedback: FeedbackData;
  overallScore?: number | null;
}

function scoreColor(score: number): string {
  if (score >= 85) return "text-emerald-400";
  if (score >= 70) return "text-amber-400";
  if (score >= 50) return "text-orange-400";
  return "text-red-400";
}

function scoreLabel(score: number): string {
  if (score >= 90) return "Excellent 优秀";
  if (score >= 80) return "Great 良好";
  if (score >= 70) return "Good 不错";
  if (score >= 60) return "Fair 一般";
  if (score >= 40) return "Needs Work 需改进";
  return "Poor 差";
}

export function FeedbackPanel({ feedback, overallScore }: FeedbackPanelProps) {
  return (
    <GlassCard className="space-y-6">
      {/* Overall Score */}
      {overallScore != null && overallScore > 0 && (
        <div className="flex items-center gap-4 pb-4 border-b border-white/5">
          <div className="flex items-baseline gap-1">
            <span className={`text-4xl font-bold ${scoreColor(overallScore)}`}>
              {overallScore}
            </span>
            <span className="text-sm text-slate-500">/100</span>
          </div>
          <div>
            <p className={`text-sm font-semibold ${scoreColor(overallScore)}`}>
              {scoreLabel(overallScore)}
            </p>
            <p className="text-xs text-slate-500">综合评分</p>
          </div>
        </div>
      )}

      {/* Summary */}
      <div>
        <h3 className="text-lg font-semibold text-white">Movement Analysis</h3>
        <p className="text-sm text-slate-400 mt-2 leading-relaxed">{feedback.summary}</p>
      </div>

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {feedback.strengths && feedback.strengths.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-green-400 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              What You&apos;re Doing Well
            </h4>
            <ul className="space-y-2">
              {feedback.strengths.map((s, i) => (
                <li key={i} className="text-sm text-slate-300 flex gap-2">
                  <span className="text-green-400 flex-shrink-0 mt-0.5">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {feedback.improvements && feedback.improvements.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-sky-400 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              Focus Areas
            </h4>
            <ul className="space-y-2">
              {feedback.improvements.map((s, i) => (
                <li key={i} className="text-sm text-slate-300 flex gap-2">
                  <span className="text-sky-400 flex-shrink-0 mt-0.5">→</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Detailed Feedback */}
      {feedback.detailed_feedback && (
        <div>
          <h4 className="text-sm font-semibold text-slate-400 mb-2">Detailed Analysis</h4>
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
            {feedback.detailed_feedback}
          </p>
        </div>
      )}
    </GlassCard>
  );
}
