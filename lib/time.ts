// All day bucketing in this app is IST (Asia/Kolkata) — regardless of what
// timezone the server or Vercel's cron clock runs in. 12 AM IST = 18:30 UTC.

const YMD_FMT = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Current calendar date in IST as "YYYY-MM-DD". */
export function istYMD(d: Date = new Date()): string {
  return YMD_FMT.format(d); // en-CA gives ISO-like yyyy-mm-dd
}

export function dayBounds(ymd: string): { start: Date; end: Date } {
  return {
    start: new Date(`${ymd}T00:00:00+05:30`),
    end: new Date(`${ymd}T23:59:59.999+05:30`),
  };
}

/** Shift a "YYYY-MM-DD" by whole days (calendar math, not timezone math). */
export function shiftYMD(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export function monthStartYMD(ymd: string): string {
  return `${ymd.slice(0, 7)}-01`;
}

export function nextMonthStartYMD(ymd: string): string {
  const y = Number(ymd.slice(0, 4));
  const m = Number(ymd.slice(5, 7));
  const ny = m === 12 ? y + 1 : y;
  const nm = m === 12 ? 1 : m + 1;
  return `${ny}-${String(nm).padStart(2, "0")}-01`;
}

/** "2026-11-01" -> "Mon, 1 November" (for mail subjects etc.) */
export function prettyYMD(ymd: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "numeric",
    month: "long",
  }).format(new Date(`${ymd}T12:00:00+05:30`));
}