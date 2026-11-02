import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isMailConfigured, sendMail } from "@/lib/mail";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }
  if (!isMailConfigured()) {
    return NextResponse.json(
      {
        error:
          "SMTP is not set up yet — add SMTP_USER (your Gmail) and SMTP_PASS (16-char Google app password) in .env. Steps are in the README.",
      },
      { status: 503 }
    );
  }

  const to = user.reportEmail || user.email;
  try {
    await sendMail({
      to,
      subject: "Expense Tracker — test mail ✅",
      html: `<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#f4f4f5;padding:24px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e4e4e7;padding:24px">
    <h2 style="margin:0 0 8px">Test mail ✅</h2>
    <p style="margin:0 0 12px;color:#374151">SMTP is wired up — this is exactly the channel your nightly 12:00 AM IST summary will use. If you can read this in your inbox, the daily mail will work.</p>
    <p style="margin:0;color:#9ca3af;font-size:12px">Sent from your Expense Tracker. Check spam once — mark as "not spam" so future nightly mails land in the inbox.</p>
  </div>
</div>`,
    });
    return NextResponse.json({ ok: true, to });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: `Mail failed: ${(e as Error).message}` },
      { status: 500 }
    );
  }
}