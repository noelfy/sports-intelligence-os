import { getAnalyses } from "@/lib/api-store";

export async function GET() {
  const results = getAnalyses().map((a) => ({
    id: a.id,
    status: a.status,
    video_filename: a.video_filename,
    sport_type: a.sport_type,
    overall_score: a.overall_score,
    metrics: a.metrics,
    created_at: a.created_at,
  }));
  return Response.json({ results, total: results.length });
}
