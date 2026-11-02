import { NextResponse, type NextRequest } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { CATEGORIES } from "@/lib/categories";
import { toPaise } from "@/lib/format";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const userId = await getSessionUserId();
  if (userId === null) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }
  const { id: idRaw } = await params;
  const id = Number(idRaw);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const data: { name?: string; category?: string; paise?: number; spentAt?: Date } = {};

  if (body.name !== undefined) {
    const n = String(body.name).trim().slice(0, 80);
    if (!n) return NextResponse.json({ error: "Name can't be empty" }, { status: 400 });
    data.name = n;
  }
  if (body.category !== undefined) {
    const c = String(body.category).trim();
    data.category = (CATEGORIES as readonly string[]).includes(c) ? c : "Other";
  }
  if (body.amount !== undefined && String(body.amount) !== "") {
    const p = toPaise(String(body.amount));
    if (!Number.isFinite(p) || p <= 0) {
      return NextResponse.json({ error: "Amount must be a number above zero" }, { status: 400 });
    }
    data.paise = p;
  }
  if (body.spentAt) {
    const d = new Date(String(body.spentAt));
    if (isNaN(d.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }
    data.spentAt = d;
  }

  try {
    const updated = await prisma.expense.updateMany({ where: { id, userId }, data });
    if (updated.count === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const userId = await getSessionUserId();
  if (userId === null) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }
  const { id: idRaw } = await params;
  const id = Number(idRaw);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const deleted = await prisma.expense.deleteMany({ where: { id, userId } });
    if (deleted.count === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}