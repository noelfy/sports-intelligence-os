import { createAnalysis, updateAnalysis } from "@/lib/api-store";

export async function POST(req: Request) {
  try {
    let filename = "video.mp4";
    let exerciseId: string | null = null;
    let userId: string | null = null;

    // Try JSON first (Vercel-compatible demo mode — avoids 4.5MB body limit)
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await req.json();
      filename = body.filename || "video.mp4";
      exerciseId = body.exercise_id || null;
    } else {
      // Multipart form data (works locally with Python backend proxy)
      try {
        const formData = await req.formData();
        const video = formData.get("video") as File | null;
        if (video) filename = video.name;
        exerciseId = (formData.get("exercise_id") as string) || null;
      } catch {
        // Vercel body size limit hit — fall through to demo mode
        console.warn("Upload: multipart parse failed, falling back to demo mode");
      }
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

    // Validate extension for demo mode (multipart already validated by frontend)
    if (contentType.includes("application/json")) {
      const ext = filename.split(".").pop()?.toLowerCase();
      if (!ext || !["mp4", "mov"].includes(ext)) {
        return Response.json(
          { detail: "Only MP4 and MOV files are supported (仅支持 MP4 或 MOV 格式)" },
          { status: 400 }
        );
      }
    }

    // Create analysis record
    const sportType = exerciseId || "general";
    const analysis = createAnalysis(userId, filename, sportType);

    // Simulate processing → completed after 3s (no Python backend on Vercel)
    setTimeout(() => {
      const overallScore = Math.round(60 + Math.random() * 35);
      updateAnalysis(analysis.id, {
        status: "completed",
        overall_score: overallScore,
        metrics: {
          stability: Math.round(60 + Math.random() * 35),
          symmetry: Math.round(60 + Math.random() * 35),
          range_of_motion: Math.round(60 + Math.random() * 35),
          tempo: Math.round(60 + Math.random() * 35),
          posture: Math.round(60 + Math.random() * 35),
        },
        feedback: buildFeedback(overallScore, sportType),
        completed_at: new Date().toISOString(),
      });
    }, 3000);

    return Response.json({
      analysis_id: analysis.id,
      status: "processing",
      message: "Video uploaded. Analysis in progress.",
    });
  } catch (err) {
    console.error("Upload error:", err);
    return Response.json(
      { detail: "Upload failed (上传失败)" },
      { status: 500 }
    );
  }
}

function buildFeedback(score: number, _sportType: string) {
  if (score >= 80) {
    return {
      summary: "Great form! Minor adjustments can make it even better.",
      strengths: [
        "Good overall movement pattern",
        "Stable posture throughout the exercise",
        "Controlled tempo",
      ],
      improvements: [
        "Consider increasing range of motion slightly",
        "Watch for slight asymmetry between left and right sides",
      ],
      detailed_feedback:
        "Your movement form is very good with a score of " +
        score +
        "/100. " +
        "The key areas to focus on are range of motion and left-right symmetry. " +
        "Keep practicing with the same controlled tempo — consistency is key to long-term improvement.",
    };
  }

  if (score >= 70) {
    return {
      summary:
        "Decent form overall. A few areas need attention to reach the next level.",
      strengths: ["Consistent movement rhythm", "Good body awareness"],
      improvements: [
        "Work on joint alignment — knees should track over toes",
        "Maintain a more neutral spine during the movement",
        "Try to achieve fuller range of motion",
      ],
      detailed_feedback:
        "Your form scored " +
        score +
        "/100. " +
        "The main areas for improvement are joint alignment and spine position. " +
        "Try filming yourself from the side and check if your knees are caving inward or your back is rounding. " +
        "Focus on bracing your core before each repetition.",
    };
  }

  return {
    summary:
      "Several form issues detected. Focus on the fundamentals before increasing weight.",
    strengths: ["You completed the movement"],
    improvements: [
      "Keep knees aligned with toes — avoid knee valgus",
      "Maintain a neutral spine — avoid rounding your lower back",
      "Control the eccentric (lowering) phase more",
      "Reduce momentum and focus on muscle engagement",
    ],
    detailed_feedback:
      "Your form scored " +
      score +
      "/100, indicating several areas need work. " +
      "Start with lighter weight or bodyweight variations to build proper movement patterns. " +
      "Focus on keeping your knees tracking over your toes, maintaining a braced neutral spine, " +
      "and controlling every phase of the movement. Consider working with a coach or using " +
      "our exercise reference guide for correct form cues.",
  };
}
