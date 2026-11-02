import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchUpdates, findChatIdForCode, isTelegramConfigured } from "@/lib/telegram";
import { sendTelegramMessage } from "@/lib/telegram";

export async function POST(_req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  if (!isTelegramConfigured()) {
    return NextResponse.json(
      { error: "The bot token is not set yet (TELEGRAM_BOT_TOKEN) — README step 1" },
      { status: 503 }
    );
  }

  const code = user.telegramLinkCode;
  if (!code) {
    return NextResponse.json(
      { ok: false, found: false, message: "Tap 'Get bot link' first — it creates a fresh one-time code." },
      { status: 400 }
    );
  }

  try {
    const updates = await fetchUpdates();
    const chatId = findChatIdForCode(updates, code);
    if (chatId === null) {
      return NextResponse.json({
        ok: false,
        found: false,
        message:
          "Can't see your chat yet — open the bot link, press Start in Telegram, then tap 'Check connection' again.",
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { telegramChatId: String(chatId), telegramLinkCode: null },
    });

    // Best-effort welcome — non-fatal if it fails.
    try {
      await sendTelegramMessage(
        String(chatId),
        "✅ <b>Expense Tracker connected!</b>\nYour nightly 12:00 AM IST summary will land here."
      );
    } catch {
      /* welcome is decoration */
    }

    return NextResponse.json({ ok: true, chatId });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: `Telegram check failed: ${(e as Error).message}` },
      { status: 500 }
    );
  }
}