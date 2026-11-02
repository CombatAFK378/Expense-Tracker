import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const EMAIL_RE = /^\S+@\S+\.\S+$/;

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const raw = String(body.reportEmail ?? "").trim().toLowerCase();
  if (raw && !EMAIL_RE.test(raw)) {
    return NextResponse.json({ error: "That doesn't look like a valid email" }, { status: 400 });
  }

  // Empty input = fall back to the account email.
  await prisma.user.update({ where: { id: user.id }, data: { reportEmail: raw || null } });
  return NextResponse.json({ ok: true, effectiveTarget: raw || user.email });
}