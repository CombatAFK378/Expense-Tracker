import { NextResponse, type NextRequest } from "next/server";
import { hashPassword, issueSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const EMAIL_RE = /^\S+@\S+\.\S+$/;

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "Use at least 6 characters for the password" },
      { status: 400 }
    );
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "This email is already registered — login instead" },
        { status: 409 }
      );
    }
    const user = await prisma.user.create({
      data: { email, passwordHash: await hashPassword(password) },
    });
    await issueSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    if ((e as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "This email is already registered" }, { status: 409 });
    }
    return NextResponse.json(
      { error: "Signup failed — is DATABASE_URL set and reachable?" },
      { status: 500 }
    );
  }
}