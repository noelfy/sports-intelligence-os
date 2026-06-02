import { ResultsClient } from "./ResultsClient";
import { getResult } from "@/lib/api";
import Link from "next/link";

export default async function ResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Try to fetch initial data (may fail if the backend is unreachable server-side)
  let initialResult;
  let fetchError: string | null = null;

  try {
    initialResult = await getResult(id);
  } catch {
    fetchError = "Analysis not found. It may have been deleted or never existed.";
  }

  if (fetchError || !initialResult) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-slate-900/50 backdrop-blur-sm border border-white/5 rounded-2xl p-8 text-center space-y-4 max-w-md">
          <h2 className="text-xl font-semibold text-red-400">Not Found</h2>
          <p className="text-slate-400 text-sm">{fetchError}</p>
          <Link
            href="/upload"
            className="inline-block px-4 py-2 text-sm text-amber-400 hover:text-amber-300 border border-amber-500/30 rounded-lg hover:bg-amber-500/10 transition-colors"
          >
            Try a New Analysis
          </Link>
        </div>
      </div>
    );
  }

  // Render client component that handles polling and display
  return <ResultsClient analysisId={id} initialResult={initialResult} />;
}
