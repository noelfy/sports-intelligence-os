export async function GET() {
  // Return mock progress data for demo
  return Response.json({
    progress: {
      sessions: 0,
      average_score: 0,
      trend: "stable",
    },
  });
}
