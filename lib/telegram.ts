import { formatRupees } from "./format";
import { prettyYMD } from "./time";
import type { DaySummary } from "./summary";

const API = "https://api.telegram.org";

export function isTelegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN);
}

export type TgUpdate = {
  update_id: number;
  message?: {
    chat: { id: number; type: string };
    from?: { id: number; is_bot: boolean };
    text?: string;
    date: number;
  };
};

export type TgChat = { id: number; first_name?: string };

async function tgCall<T>(method: string, body?: unknown): Promise<T> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set");
  const res = await fetch(`${API}/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  const data = (await res.json()) as { ok: boolean; result?: T; description?: string };
  if (!data.ok) throw new Error(data.description ?? "Telegram API error");
  return data.result as T;
}

/** Bot's @username (from Telegram itself, so deploy settings need only the token). */
export async function botUsername(): Promise<string | null> {
  try {
    const me = await tgCall<{ username: string }>("getMe");
    return me.username;
  } catch {
    return null;
  }
}

export async function fetchUpdates(): Promise<TgUpdate[]> {
  return tgCall<TgUpdate[]>("getUpdates", {
    offset: 0,
    limit: 50,
    allowed_updates: ["message"],
  });
}

/** Latest private chat that message-text contains our one-time code. */
export function findChatIdForCode(updates: TgUpdate[], code: string): number | null {
  for (let i = updates.length - 1; i >= 0; i--) {
    const msg = updates[i].message;
    if (!msg || !msg.text) continue;
    if (!msg.text.includes(code)) continue;
    if (msg.from?.is_bot) continue;
    return msg.chat.id;
  }
  return null;
}

export async function sendTelegramMessage(
  chatId: string | number,
  html: string
): Promise<void> {
  await tgCall("sendMessage", {
    chat_id: chatId,
    text: html,
    parse_mode: "HTML",
    disable_web_page_preview: true,
  });
}

export function telegramSummaryText(dayYMD: string, s: DaySummary): string {
  const lines: string[] = [];
  lines.push(`📊 <b>Daily summary — ${prettyYMD(dayYMD)}</b>`);
  lines.push("");
  if (s.dayTotalPaise > 0) {
    lines.push(`You spent <b>${formatRupees(s.dayTotalPaise)}</b> (${s.dayCount} entries)`);
    for (const c of s.byCategory.slice(0, 5)) {
      lines.push(`  • ${c.category}: ${formatRupees(c.paise)}`);
    }
    if (s.topExpense) {
      lines.push(`Biggest: ${s.topExpense.name} — ${formatRupees(s.topExpense.paise)}`);
    }
  } else {
    lines.push("No expenses logged that day — either a no-spend day or a few entries waiting in your head.");
  }
  lines.push("");
  lines.push(`Day before: ${formatRupees(s.yesterdayPaise)}`);
  lines.push(`This month so far: ${formatRupees(s.monthTotalPaise)} (${s.monthCount} entries)`);
  lines.push("");
  lines.push("— sent nightly at 12:00 AM IST by your Expense Tracker");
  return lines.join("\n");
}