"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { getHistory } from "@/lib/api";
import { GlassCard } from "@/components/common/GlassCard";
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
      <div className="min-h-screen flex items-center justify-center">
        <GlassCard className="text-center space-y-4 max-w-md">
          <h2 className="text-xl font-semibold text-white">Sign in to view history</h2>
          <p className="text-slate-400 text-sm">Your movement analysis history will appear here.</p>
          <Link
            href="/auth/login"
            className="inline-block px-6 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-sm font-medium transition-colors"
          >
            Sign In
          </Link>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-white mb-8">Analysis History</h1>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <GlassCard className="text-center py-16">
          <p className="text-slate-400">No analyses yet.</p>
          <Link href="/" className="text-sky-400 hover:text-sky-300 text-sm mt-2 inline-block">
            Upload your first video
          </Link>
        </GlassCard>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <GlassCard key={item.analysis_id} hover className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    {item.sport_type}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      item.status === "completed"
                        ? "bg-green-500/10 text-green-400 border border-green-500/20"
                        : item.status === "failed"
                        ? "bg-red-500/10 text-red-400 border border-red-500/20"
                        : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                <p className="text-sm text-slate-300 truncate">{item.video_filename}</p>
                {item.overall_score !== null && (
                  <p className="text-2xl font-bold text-sky-400">{Math.round(item.overall_score)}</p>
                )}
                <p className="text-xs text-slate-500">
                  {item.created_at ? new Date(item.created_at).toLocaleDateString() : ""}
                </p>
              </GlassCard>
            ))}
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
                      ? "bg-sky-500 text-white"
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
