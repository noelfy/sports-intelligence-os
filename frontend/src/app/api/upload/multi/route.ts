import { createAnalysis, updateAnalysis } from "@/lib/api-store";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const videos = formData.getAll("videos") as File[];
    const exerciseId = formData.get("exercise_id") as string | null;

    if (!videos || videos.length === 0) {
      return Response.json(
        { detail: "No video files provided (请上传视频文件)" },
        { status: 400 }
      );
    }

    if (videos.length < 2) {
      return Response.json(
        {
          detail:
            "Multi-camera 3D analysis requires at least 2 synchronized videos (3D分析需要至少2个同步视频)",
        },
        { status: 400 }
      );
    }

    // Extract user ID from auth header if present
    let userId: string | null = null;
    const auth = req.headers.get("Authorization");
    if (auth?.startsWith("Bearer ")) {
      try {
        const payload = JSON.parse(
          Buffer.from(auth.slice(7), "base64").toString()
        );
        userId = payload.sub;
      } catch {
        // ignore invalid token
      }
    }

    // Create analysis record for 3D
    const sportType = exerciseId || "general";
    const analysis = createAnalysis(
      userId,
      `3D: ${videos.length} cameras`,
      sportType,
      true,
      videos.length
    );

    // Simulate 3D processing (takes slightly longer than 2D)
    setTimeout(() => {
      const overallScore = Math.round(65 + Math.random() * 30);
      updateAnalysis(analysis.id, {
        status: "completed",
        overall_score: overallScore,
        metrics: {
          stability: Math.round(65 + Math.random() * 30),
          symmetry: Math.round(65 + Math.random() * 30),
          range_of_motion: Math.round(65 + Math.random() * 30),
          tempo: Math.round(65 + Math.random() * 30),
          posture: Math.round(65 + Math.random() * 30),
          depth_3d: Math.round(65 + Math.random() * 30),
        },
        feedback: {
          summary:
            "3D analysis complete. Multi-camera reconstruction provides detailed biomechanical insights.",
          strengths: [
            "Multi-angle joint tracking confirmed",
            "3D spatial positioning within normal range",
            "Good synchronization across all camera views",
          ],
          improvements: [
            "Minor depth variation in lateral movement",
            "Slight rotational asymmetry detected in 3D space",
          ],
          detailed_feedback:
            "3D analysis completed with an overall score of " +
            overallScore +
            "/100. " +
            videos.length +
            " synchronized cameras were used for full spatial reconstruction. " +
            "The 3D data reveals subtle patterns not visible in single-camera analysis. " +
            "Your movement in the sagittal plane is good, with minor deviations in the coronal and transverse planes.",
        },
        completed_at: new Date().toISOString(),
      });
    }, 5000);

    return Response.json({
      analysis_id: analysis.id,
      status: "processing",
      camera_count: videos.length,
      message: `${videos.length} videos uploaded. 3D analysis in progress.`,
    });
  } catch (err) {
    console.error("Multi-upload error:", err);
    return Response.json(
      { detail: "Upload failed (上传失败)" },
      { status: 500 }
    );
  }
}
