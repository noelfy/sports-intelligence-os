import { findUserByEmail } from "@/lib/api-store";

export async function GET(req: Request) {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) {
    return Response.json({ detail: "Not authenticated" }, { status: 401 });
  }

  try {
    const payload = JSON.parse(Buffer.from(auth.slice(7), "base64").toString());
    const user = findUserByEmail(payload.email);
    if (!user) {
      return Response.json({ detail: "User not found" }, { status: 404 });
    }
    return Response.json({ id: user.id, email: user.email, username: user.username });
  } catch {
    return Response.json({ detail: "Invalid token" }, { status: 401 });
  }
}
