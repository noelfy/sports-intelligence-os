export async function GET() {
  return Response.json({ status: "ok", app: "NeuroVolley AI", version: "0.1.0" });
}
