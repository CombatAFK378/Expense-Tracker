import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatRupees } from "@/lib/format";
import { isMailConfigured, sendMail } from "@/lib/mail";
import {
  isTelegramConfigured,
  sendTelegramMessage,
  telegramSummaryText,
} from "@/lib/telegram";
import { getSummary, type DaySummary } from "@/lib/summary";
import { istYMD, prettyYMD, shiftYMD } from "@/lib/time";

export const dynamic = "force-dynamic";

function summaryHtml(s: DaySummary): string {
  const catRows = s.byCategory
    .map(
      ({ category, paise }) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#4b5563">${category}</td><td style="text-align:right;font-weight:600">${formatRupees(paise)}</td></tr>`
    )
    .join("");

  const zeroNote =
    s.dayTotalPaise === 0
      ? `<p style="margin:0 0 12px;font-size:13px;color:#6b7280">No expenses were logged for this day — either a no-spend day or a few entries waiting in your head.</p>`
      : "";

  const topRow = s.topExpense
    ? `<p style="margin:12px 0 0;color:#374151">Biggest one: <strong>${s.topExpense.name}</strong> — ${formatRupees(s.topExpense.paise)}</p>`
    : "";

  return `<!doctype html><html><body style="margin:0;background:#f4f4f5;padding:24px;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e4e4e7;padding:24px">
    <p style="margin:0 0 4px;color:#a1a1aa;font-size:11px;letter-spacing:1px">DAILY SUMMARY · ${prettyYMD(s.day)}</p>
    <h1 style="margin:0 0 12px;font-size:22px">You spent ${formatRupees(s.dayTotalPaise)}</h1>
    ${zeroNote}
    <p style="margin:0 0 16px;color:#6b7280;font-size:13px">Day before: ${formatRupees(s.yesterdayPaise)} &nbsp;·&nbsp; Same month so far: ${formatRupees(s.monthTotalPaise)} (${s.monthCount} entries)</p>
    ${catRows ? `<table style="border-collapse:collapse;width:100%;font-size:14px">${catRows}</table>` : ""}
    ${topRow}
    <p style="margin:24px 0 0;color:#d4d4d8;font-size:11px;border-top:1px solid #f4f4f5;padding-top:12px">Sent nightly at 12:00 AM IST by your Expense Tracker · change the target email in the app's Settings section</p>
  </div>
</body></html>`;
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const header = req.headers.get("authorization");
    const qp = req.nextUrl.searchParams.get("key");
    if (header !== `Bearer ${secret}` && qp !== secret) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (!isMailConfigured() && !isTelegramConfigured()) {
    return Response.json(
      { error: "No notification channel configured (TELEGRAM_BOT_TOKEN and/or SMTP creds)" },
      { status: 503 }
    );
  }

  // Vercel fires this at 18:30 UTC = 00:00 IST. The day that just ended is
  // yesterday in IST terms right at midnight.
  const day = shiftYMD(istYMD(), -1);

  let users: { id: number; email: string; reportEmail: string | null; telegramChatId: string | null }[] = [];
  try {
    users = await prisma.user.findMany({
      select: { id: true, email: true, reportEmail: true, telegramChatId: true },
    });
  } catch (e) {
    return Response.json(
      { error: `Database unreachable (Aiven maintenance?) — ${(e as Error).message}` },
      { status: 503 }
    );
  }

  let mailed = 0;
  let messaged = 0;
  const failures: string[] = [];

  // Channel 1 (optional): e-mail summary for users with a target inbox.
  if (isMailConfigured()) {
    for (const u of users) {
      const to = u.reportEmail || u.email;
      try {
        const s = await getSummary(u.id, day);
        const label =
          s.dayTotalPaise > 0
            ? `${formatRupees(s.dayTotalPaise)} spent on ${prettyYMD(day)}`
            : `No expenses logged on ${prettyYMD(day)}`;
        await sendMail({ to, subject: `Expense Tracker — ${label}`, html: summaryHtml(s) });
        mailed += 1;
      } catch (e) {
        failures.push(`mail:${u.email} — ${(e as Error).message}`);
      }
    }
  }

  // Channel 2 (primary): Telegram push for linked users.
  if (isTelegramConfigured()) {
    for (const u of users) {
      if (!u.telegramChatId) continue;
      try {
        const s = await getSummary(u.id, day);
        await sendTelegramMessage(u.telegramChatId, telegramSummaryText(day, s));
        messaged += 1;
      } catch (e) {
        failures.push(`telegram:${u.email} — ${(e as Error).message}`);
      }
    }
  }

  return Response.json({ day, users: users.length, mailed, messaged, failures });
}