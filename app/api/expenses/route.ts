import { NextResponse, type NextRequest } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { CATEGORIES } from "@/lib/categories";
import { toPaise } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (userId === null) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const name = String(body.name ?? "").trim().slice(0, 80);
  const paise = toPaise(String(body.amount ?? ""));
  const categoryRaw = String(body.category ?? "").trim();
  const category = (CATEGORIES as readonly string[]).includes(categoryRaw)
    ? categoryRaw
    : "Other";
  const spentAtRaw = body.spentAt ? new Date(String(body.spentAt)) : new Date();

  if (!name) {
    return NextResponse.json({ error: "Add a short name for the expense" }, { status: 400 });
  }
  if (!Number.isFinite(paise) || paise <= 0) {
    return NextResponse.json({ error: "Amount must be a number above zero" }, { status: 400 });
  }
  if (isNaN(spentAtRaw.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  try {
    const expense = await prisma.expense.create({
      data: { userId, paise, name, category, spentAt: spentAtRaw },
    });
    return NextResponse.json({ ok: true, id: expense.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not save — is the database reachable?" }, { status: 500 });
  }
}