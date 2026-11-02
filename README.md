# Expense Tracker

Personal UPI expense journal: log every payment in a few seconds, see your totals,
get a summary mail at **12:00 AM IST nightly**. Multi-user from day one — each
account sees only its own expenses.

Stack: **Next.js 16** (App Router) · **Prisma 7** + driver adapter · **PostgreSQL on Aiven (free)** · **nodemailer/Gmail SMTP** · **Vercel cron**.

## What's built

- **Login / signup** — bcrypt password hashing, JWT session in an httpOnly cookie
- **Quick add** — amount + name (+ editable date), category auto-guessed from the
  note (`swiggy → Food`, `uber → Travel`…), defaults to your last-used category
- **Dashboard** — spent today, yesterday, this month (IST day boundaries)
- **Recent list** — edit / delete any entry (fixes wrong double-logs in two taps)
- **Settings** — nightly summary email (defaults to your signup email) +
  **"Send test mail now"** so delivery is proven before the nightly job matters
- **Nightly job** — `/api/cron/daily-mail` at 18:30 UTC (= 00:00 IST), guarded by
  `CRON_SECRET` (Vercel sends `Authorization: Bearer`; local test: `?key=<secret>`)
  - mails each user: day total, day-before, month-so-far, category split, biggest expense
- **Money safety** — amounts stored as integer paise, Indian digit grouping `₹1,23,456`

Key files: `prisma/schema.prisma` (User, Expense) · `lib/time.ts` (IST day math — do
not change to server-local) · `lib/prisma.ts` (shared client, pool capped at 4
because Aiven free allows max 20 connections and has no pooler) ·
`lib/mail.ts` · `app/api/cron/daily-mail/route.ts` · `vercel.json` (cron schedule).

## One-time setup (only you can do these)

**1. Telegram bot — the nightly channel (60 seconds)**

1. Open Telegram → search **@BotFather** (blue check) → send `/newbot`
2. Pick any display name; then any username ending in `bot` (e.g. `shashank_expense_tracker_bot`)
3. BotFather replies with the **bot token** — put it in `TELEGRAM_BOT_TOKEN`
4. In the running app: Settings → **Get bot link** → **Open bot in Telegram** → press **START** → back in app: **Check connection** → **Send test message now**

**2. Postgres on Aiven (free)**
1. https://console.aiven.io → sign up (no credit card, no time limit)
2. + Create service → PostgreSQL → the free plan → region Mumbai (`ap-south-1`)
3. Wait till it shows ACTIVE (~5 min) → copy **Service URI**
4. Replace `DATABASE_URL` in `.env`, and make sure it ends with
   `?sslmode=require&connection_limit=5`

**3. Gmail app password — optional back-up channel** (Telegram alone is enough; skip unless you also want mail)
- myaccount.google.com → Security → search **"App passwords"** → create one
- `.env`: `SMTP_USER = your gmail address`, `SMTP_PASS = the 16-char password`

**4. Secrets** — `JWT_SECRET` and `CRON_SECRET` are already random-generated in
local `.env`; re-use the exact same values later in Vercel's env vars.

**5. Create the tables + run it (after step 2)**
```bash
npx prisma migrate deploy   # applies prisma/migrations to Aiven (no shadow DB needed)
npm run dev                 # http://localhost:3000
```
Then: sign up → add an expense → Settings → **Send test mail now**.

## Deploy to Vercel

1. Push to GitHub (a repo on your account), then Vercel → New Project → import
2. Add **all 6 env vars** (Settings → Environment Variables):
   `DATABASE_URL`, `JWT_SECRET`, `CRON_SECRET`, `TELEGRAM_BOT_TOKEN`, `SMTP_USER`, `SMTP_PASS`
   (SMTP vars can be skipped if you only use the Telegram channel)
3. Deploy — the build script already runs `prisma generate && next build`
4. Cron is pre-wired in `vercel.json` (18:30 UTC). Test on prod:
   `curl https://<your-app>.vercel.app/api/cron/daily-mail -H "Authorization: Bearer $CRON_SECRET"`
   and check your mail.

## Gotchas (re-written from real hits)

- **12 AM IST = 18:30 UTC** on Vercel's cron clock; all day-boundary math in the
  app is IST (`lib/time.ts`). Don't "fix" it to server-local.
- **Aiven free = 20 connections, no pooling** — the app keeps its own pool at 4
  (`lib/prisma.ts`). Never open a client per request.
- **Aiven can power off an idle free DB** (they mail you first; console → power
  back on). The nightly cron + daily use keep it awake.
- **1 GB disk** — never store receipt images in this DB.
- Free-tier backups exist, but stay paranoid: add the CSV export (phase 2) and
  download monthly.
- Prisma 7 CLI: `migrate diff --to-schema` (the old `--to-schema-datamodel` flag
  was removed), and generated client lives in `generated/prisma` (auto-built).

## Deliberately NOT built yet

Budgets, charts, merchant leaderboard, search/filters, CSV export, Telegram
quick-add (logging an expense by sending a bot message — the nightly Telegram
push is already wired). Add only after a month of real usage tells you which you
actually miss.