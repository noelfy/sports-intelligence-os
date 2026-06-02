import { getAnalyses } from "@/lib/api-store";

export async function GET(req: Request) {
  const auth = req.headers.get("Authorization");
  let userId: string | null = null;

  if (auth?.startsWith("Bearer ")) {
    try {
      const payload = JSON.parse(Buffer.from(auth.slice(7), "base64").toString());
      userId = payload.sub;
    } catch {
      // ignore invalid token
    }
  }

  const analyses = getAnalyses(userId).map((a) => ({
    id: a.id,
    status: a.status,
    video_filename: a.video_filename,
    sport_type: a.sport_type,
    overall_score: a.overall_score,
    created_at: a.created_at,
  }));
  return Response.json({ analyses, total: analyses.length });
}
