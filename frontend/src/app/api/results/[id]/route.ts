import { getAnalysis } from "@/lib/api-store";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const analysis = getAnalysis(id);
  if (!analysis) {
    return Response.json({ detail: "Result not found" }, { status: 404 });
  }
  return Response.json(analysis);
}
