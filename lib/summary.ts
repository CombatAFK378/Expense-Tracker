import { prisma } from "./prisma";
import { dayBounds, monthStartYMD, nextMonthStartYMD, shiftYMD } from "./time";

export type DaySummary = {
  day: string;
  dayTotalPaise: number;
  dayCount: number;
  yesterdayPaise: number;
  monthTotalPaise: number;
  monthCount: number;
  byCategory: { category: string; paise: number }[];
  topExpense: { name: string; paise: number } | null;
};

/**
 * Everything the nightly mail (and the dashboard) needs for one user,
 * anchored to one IST day. Aggregated in JS — data volumes here are tiny,
 * no need for fancy SQL.
 */
export async function getSummary(userId: number, ymd: string): Promise<DaySummary> {
  const day = dayBounds(ymd);
  const yesterday = dayBounds(shiftYMD(ymd, -1));
  const monthStart = dayBounds(monthStartYMD(ymd)).start;
  const monthEnd = dayBounds(nextMonthStartYMD(ymd)).end;

  const rows = await prisma.expense.findMany({
    where: { userId, spentAt: { gte: monthStart, lte: monthEnd } },
    select: { paise: true, name: true, category: true, spentAt: true },
    orderBy: { spentAt: "desc" },
  });

  let dayTotalPaise = 0;
  let dayCount = 0;
  let yesterdayPaise = 0;
  let monthTotalPaise = 0;
  let monthCount = 0;
  const catTotals = new Map<string, number>();
  let topExpense: { name: string; paise: number } | null = null;

  for (const row of rows) {
    monthTotalPaise += row.paise;
    monthCount += 1;
    const at = row.spentAt.getTime();
    const isToday = at >= day.start.getTime() && at <= day.end.getTime();
    const isYesterday = at >= yesterday.start.getTime() && at <= yesterday.end.getTime();
    if (isToday) {
      dayTotalPaise += row.paise;
      dayCount += 1;
      catTotals.set(row.category, (catTotals.get(row.category) ?? 0) + row.paise);
      if (!topExpense || row.paise > topExpense.paise) {
        topExpense = { name: row.name, paise: row.paise };
      }
    }
    if (isYesterday) yesterdayPaise += row.paise;
  }

  const byCategory = [...catTotals.entries()]
    .map(([category, p]) => ({ category, paise: p }))
    .sort((a, b) => b.paise - a.paise);

  return {
    day: ymd,
    dayTotalPaise,
    dayCount,
    yesterdayPaise,
    monthTotalPaise,
    monthCount,
    byCategory,
    topExpense,
  };
}