"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { getHistory } from "@/lib/api";
import { getExerciseById } from "@/data/exercises";
import type { HistoryItem } from "@/types";

export default function HistoryPage() {
  const { user } = useStore();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getHistory(page)
      .then((data) => {
        setItems(data.items);
        setTotalPages(data.pages);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, page]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-slate-900/50 backdrop-blur-sm border border-white/5 rounded-2xl p-8 text-center space-y-4 max-w-md">
          <h2 className="text-xl font-semibold text-white">Sign in to view history</h2>
          <p className="text-slate-400 text-sm">Your movement analysis history will appear here.</p>
          <Link
            href="/auth/login"
            className="inline-block px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Analysis History</h1>
          <p className="text-amber-400 text-sm mt-1">动作分析历史</p>
        </div>
        <Link
          href="/upload"
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium transition-colors"
        >
          New Analysis
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-slate-900/50 backdrop-blur-sm border border-white/5 rounded-2xl p-16 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
            <span className="text-2xl">📹</span>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No analyses yet</h3>
          <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">
            Upload your first exercise video and get AI-powered feedback on your form.
          </p>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium transition-colors"
          >
            Analyze Your First Exercise
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => {
              const exercise = item.sport_type ? getExerciseById(item.sport_type) : null;
              const scoreColor = item.overall_score != null
                ? item.overall_score >= 80 ? "text-emerald-400" : item.overall_score >= 60 ? "text-amber-400" : "text-red-400"
                : "";
              return (
                <Link
                  key={item.analysis_id}
                  href={`/results/${item.analysis_id}`}
                  className="bg-slate-900/50 backdrop-blur-sm border border-white/5 rounded-2xl p-5 hover:border-amber-500/20 hover:bg-slate-900/70 transition-all group space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                      {exercise ? exercise.name : (item.sport_type || "Exercise")}
                    </span>
                    <div className="flex items-center gap-2">
                      {item.overall_score != null && item.overall_score > 0 && (
                        <span className={`text-xs font-bold ${scoreColor}`}>
                          {item.overall_score}
                        </span>
                      )}
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          item.status === "completed"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : item.status === "failed"
                            ? "bg-red-500/10 text-red-400 border border-red-500/20"
                            : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>
                  {exercise && (
                    <p className="text-xs text-slate-500">{exercise.nameZh}</p>
                  )}
                  <p className="text-sm text-slate-300 truncate">{item.video_filename}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-600">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : ""}
                    </p>
                    <span className="text-xs text-amber-400/0 group-hover:text-amber-400/70 transition-colors">
                      View →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                    page === i + 1
                      ? "bg-amber-500 text-white"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
