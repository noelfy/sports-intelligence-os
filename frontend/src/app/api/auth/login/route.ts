import { findUserByEmail } from "@/lib/api-store";

export async function POST(req: Request) {
  const body = await req.json();
  const { email, password } = body;

  const user = findUserByEmail(email);
  if (!user || user.password !== password) {
    return Response.json({ detail: "Invalid email or password" }, { status: 401 });
  }

  // Simple mock JWT (demo purpose — use real JWT in production)
  const token = Buffer.from(JSON.stringify({ sub: user.id, email: user.email })).toString("base64");

  return Response.json({
    access_token: token,
    token_type: "bearer",
    user: { id: user.id, email: user.email, username: user.username },
  });
}
