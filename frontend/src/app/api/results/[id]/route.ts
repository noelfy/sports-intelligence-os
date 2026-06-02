import { getAnalysis } from "@/lib/api-store";
import type { AnalysisResult } from "@/types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const analysis = getAnalysis(id);

  if (!analysis) {
    return Response.json({ detail: "Result not found" }, { status: 404 });
  }

  // Map store record to frontend AnalysisResult type
  const result: AnalysisResult = {
    analysis_id: analysis.id,
    status: analysis.status,
    video_url: `/api/files/videos/${analysis.id}/original.mp4`,
    overlay_url: `/api/files/videos/${analysis.id}/overlay.mp4`,
    keypoints_url: analysis.is_3d
      ? `/api/files/keypoints/${analysis.id}/keypoints_3d.json`
      : `/api/files/keypoints/${analysis.id}/keypoints.json`,
    metadata: {
      video_filename: analysis.video_filename,
      video_fps: 30,
      video_duration_ms: 0,
      total_frames: 0,
      frames_processed: 0,
      frames_with_pose: 0,
      width: 1920,
      height: 1080,
    },
    feedback: analysis.feedback
      ? mapFeedback(analysis.feedback, analysis.overall_score ?? 0)
      : null,
    sport_type: analysis.sport_type,
    overall_score: analysis.overall_score ?? undefined,
    capture_mode: analysis.capture_mode ?? "2d",
    is_3d: analysis.is_3d,
    camera_count: analysis.camera_count,
    created_at: analysis.created_at,
    completed_at: analysis.completed_at,
  };

  return Response.json(result);
}

function mapFeedback(
  raw: Record<string, unknown>,
  overallScore: number
): AnalysisResult["feedback"] {
  return {
    summary:
      (raw.summary as string) ||
      `Analysis complete with score ${overallScore}/100.`,
    strengths: (raw.strengths as string[]) || [],
    improvements: (raw.improvements as string[]) || [],
    detailed_feedback:
      (raw.detailed_feedback as string) || JSON.stringify(raw, null, 2),
  };
}
