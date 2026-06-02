import { createUser, findUserByEmail } from "@/lib/api-store";

export async function POST(req: Request) {
  const body = await req.json();
  const { email, username, password } = body;

  if (!email || !username || !password) {
    return Response.json({ detail: "Email, username, and password required" }, { status: 400 });
  }

  if (findUserByEmail(email)) {
    return Response.json({ detail: "Email already registered" }, { status: 409 });
  }

  const user = createUser(email, username, password);
  return Response.json({ id: user.id, email: user.email, username: user.username });
}
