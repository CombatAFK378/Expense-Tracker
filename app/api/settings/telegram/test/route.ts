import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isTelegramConfigured, sendTelegramMessage, telegramSummaryText } from "@/lib/telegram";
import { getSummary } from "@/lib/summary";
import { istYMD } from "@/lib/time";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  if (!isTelegramConfigured()) {
    return NextResponse.json(
      { error: "The bot token is not set yet (TELEGRAM_BOT_TOKEN) — README step 1" },
      { status: 503 }
    );
  }
  if (!user.telegramChatId) {
    return NextResponse.json(
      { error: "Connect Telegram first (steps 1-3 above the button)" },
      { status: 400 }
    );
  }

  try {
    const today = istYMD();
    const s = await getSummary(user.id, today);
    await sendTelegramMessage(user.telegramChatId, telegramSummaryText(today, s));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: `Telegram send failed: ${(e as Error).message}` },
      { status: 500 }
    );
  }
}