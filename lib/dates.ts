import { istYMD, shiftYMD } from "./time";

export type ExpenseRowLike = {
  id: number;
  name: string;
  category: string;
  paise: number;
  spentAt: string; // ISO
};

export type DayGroup = { ymd: string; label: string; totalPaise: number; rows: ExpenseRowLike[] };
export type MonthGroup = { key: string; label: string; totalPaise: number; days: DayGroup[] };

const MONTH_FMT = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  month: "long",
  year: "numeric",
});
const DAY_FMT = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  weekday: "long",
  day: "numeric",
  month: "short",
});
const TIME_FMT = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});
const YMD_FMT = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function ymdOf(iso: string): string {
  return YMD_FMT.format(new Date(iso));
}

export function timeOf(iso: string): string {
  return TIME_FMT.format(new Date(iso));
}

export function relativeDayPrefix(ymd: string): string | null {
  if (ymd === istYMD()) return "Today";
  if (ymd === shiftYMD(istYMD(), -1)) return "Yesterday";
  return null;
}

/**
 * ISO-sorted (newest first) rows -> month groups -> day groups, all bucketed
 * in IST. Order preserved from the input.
 */
export function groupByMonth(rows: ExpenseRowLike[]): MonthGroup[] {
  const months = new Map<string, MonthGroup>();
  const days = new Map<string, DayGroup>();

  for (const row of rows) {
    const ymd = ymdOf(row.spentAt);
    let day = days.get(ymd);
    if (!day) {
      const anchor = new Date(`${ymd}T12:00:00+05:30`);
      day = { ymd, label: DAY_FMT.format(anchor), totalPaise: 0, rows: [] };
      days.set(ymd, day);

      const mkey = ymd.slice(0, 7);
      let month = months.get(mkey);
      if (!month) {
        month = { key: mkey, label: MONTH_FMT.format(anchor), totalPaise: 0, days: [] };
        months.set(mkey, month);
      }
      month.days.push(day);
    }
    day.rows.push(row);
    day.totalPaise += row.paise;
    months.get(ymd.slice(0, 7))!.totalPaise += row.paise;
  }

  return [...months.values()];
}