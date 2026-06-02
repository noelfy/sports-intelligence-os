import { createAnalysis, updateAnalysis } from "@/lib/api-store";

export async function POST(req: Request) {
  try {
    let filenames: string[] = ["camera1.mp4", "camera2.mp4"];
    let cameraCount = 2;
    let exerciseId: string | null = null;
    let userId: string | null = null;

    // Try JSON first (Vercel-compatible demo mode)
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await req.json();
      if (body.filenames && Array.isArray(body.filenames)) {
        filenames = body.filenames;
      }
      cameraCount = body.camera_count || filenames.length;
      exerciseId = body.exercise_id || null;
    } else {
      // Multipart form data (works locally with Python backend proxy)
      try {
        const formData = await req.formData();
        const videos = formData.getAll("videos") as File[];
        filenames = videos.map((v) => v.name);
        cameraCount = videos.length;
        exerciseId = (formData.get("exercise_id") as string) || null;
      } catch {
        console.warn("Multi-upload: multipart parse failed, falling back to demo mode");
      }
    }

    if (cameraCount < 1) {
      return Response.json(
        { detail: "At least 1 video required (至少需要1个视频)" },
        { status: 400 }
      );
    }

    // Extract user ID from auth header
    const auth = req.headers.get("Authorization");
    if (auth?.startsWith("Bearer ")) {
      try {
        const payload = JSON.parse(
          Buffer.from(auth.slice(7), "base64").toString()
        );
        userId = payload.sub;
      } catch {
        // ignore
      }
    }

    // Create 3D analysis record
    const sportType = exerciseId || "general";
    const is3D = cameraCount >= 2;
    const analysis = createAnalysis(userId, filenames.join(", "), sportType, is3D, cameraCount);

    // Simulate 3D processing (takes longer)
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
          summary: is3D
            ? "3D analysis complete. Multi-camera reconstruction provides detailed biomechanical insights."
            : "Single-camera 3D analysis complete using monocular depth estimation.",
          strengths: is3D
            ? [
                "Multi-angle joint tracking confirmed",
                "3D spatial positioning within normal range",
                "Good synchronization across all camera views",
              ]
            : [
                "Movement captured successfully",
                "Key joint angles detected",
                "Good range of motion",
              ],
          improvements: is3D
            ? [
                "Minor depth variation in lateral movement",
                "Slight rotational asymmetry detected in 3D space",
              ]
            : [
                "Consider using 2+ cameras for more accurate 3D analysis",
                "Side-angle video would improve spine alignment detection",
              ],
          detailed_feedback: is3D
            ? `3D analysis completed with score ${overallScore}/100. ` +
              `${cameraCount} cameras used for spatial reconstruction. ` +
              "The 3D data reveals subtle patterns not visible in single-camera analysis."
            : `Monocular 3D analysis completed with score ${overallScore}/100. ` +
              "For higher accuracy, use 2+ synchronized cameras from different angles.",
        },
        completed_at: new Date().toISOString(),
      });
    }, 5000);

    return Response.json({
      analysis_id: analysis.id,
      status: "processing",
      camera_count: cameraCount,
      message: `${cameraCount} video(s) uploaded. ${is3D ? "3D" : "Single-camera"} analysis in progress.`,
    });
  } catch (err) {
    console.error("Multi-upload error:", err);
    return Response.json(
      { detail: "Upload failed (上传失败)" },
      { status: 500 }
    );
  }
}
