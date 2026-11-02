import nodemailer, { type Transporter } from "nodemailer";

let cached: Transporter | null = null;

export function isMailConfigured(): boolean {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

function transporter(): Transporter {
  if (!isMailConfigured()) {
    throw new Error(
      "SMTP not configured — set SMTP_USER (your Gmail) and SMTP_PASS (16-char app password)"
    );
  }
  if (!cached) {
    cached = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!,
      },
    });
  }
  return cached;
}

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  await transporter().sendMail({
    from: `"Expense Tracker" <${process.env.SMTP_USER}>`,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
}