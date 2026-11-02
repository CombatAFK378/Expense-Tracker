import { NextResponse, type NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { botUsername, isTelegramConfigured } from "@/lib/telegram";

export async function POST(_req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  if (!isTelegramConfigured()) {
    return NextResponse.json(
      { error: "The bot token is not set yet (TELEGRAM_BOT_TOKEN) — README step 1" },
      { status: 503 }
    );
  }

  const username = await botUsername();
  if (!username) {
    return NextResponse.json(
      { error: "Couldn't validate the bot with Telegram — is TELEGRAM_BOT_TOKEN correct?" },
      { status: 500 }
    );
  }

  // Fresh one-time code each "Get bot link" tap; binds the next /start message to this user.
  const code = randomBytes(4).toString("hex");
  await prisma.user.update({ where: { id: user.id }, data: { telegramLinkCode: code } });

  return NextResponse.json({
    ok: true,
    code,
    deepLink: `https://t.me/${username}?start=${code}`,
  });
}