import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CATEGORIES } from "@/lib/categories";
import { formatRupees } from "@/lib/format";
import { getSummary, type DaySummary } from "@/lib/summary";
import { istYMD } from "@/lib/time";
import QuickAdd from "@/components/QuickAdd";
import ExpenseList, { type ExpenseRowData } from "@/components/ExpenseList";
import NavBar from "@/components/NavBar";
import DbError from "@/components/DbError";

export const dynamic = "force-dynamic";

const IST_TODAY = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  weekday: "long",
  day: "numeric",
  month: "long",
});

export default async function Dashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <>
      <NavBar />
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6">
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-500">{IST_TODAY.format(new Date())} · IST</p>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-300">
            ₹ INR
          </span>
        </div>

        <div className="mt-7 grid gap-4 lg:grid-cols-[380px_1fr] lg:gap-6">
          <div className="flex flex-col gap-4">
            <Suspense fallback={<StatsSkeleton />}>
              <StatsCards userId={user.id} />
            </Suspense>
            <QuickAdd categories={[...CATEGORIES]} />
          </div>

          <div className="flex flex-col gap-4">
            <Suspense fallback={<ListSkeleton />}>
              <RecentSection userId={user.id} />
            </Suspense>
          </div>
        </div>
      </main>
    </>
  );
}

async function StatsCards({ userId }: { userId: number }) {
  try {
    // ONE month-range query (inside getSummary) computes every number below.
    const s = await getSummary(userId, istYMD());
    return (
      <>
        <HeroCard s={s} />

        <section className="mt-4 grid grid-cols-2 gap-3">
          <div className="animate-fade-up rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-4">
            <p className="text-xs text-zinc-500">This month</p>
            <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-zinc-50">
              {formatRupees(s.monthTotalPaise)}
            </p>
            <p className="mt-1 text-[11px] text-zinc-500">
              {s.monthCount} entries · on pace {formatRupees(s.projectedMonthPaise)}
            </p>
          </div>
          <div className="animate-fade-up rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-4">
            <p className="text-xs text-zinc-500">Daily average</p>
            <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-zinc-50">
              {formatRupees(s.dailyAvgPaise)}
            </p>
            <p className="mt-1 text-[11px] text-zinc-500">
              Yesterday {formatRupees(s.yesterdayPaise)}
            </p>
          </div>
        </section>
      </>
    );
  } catch {
    return <DbError />;
  }
}

function HeroCard({ s }: { s: DaySummary }) {
  const max = Math.max(...s.last7.map((d) => d.paise), 1);
  const delta =
    s.yesterdayPaise > 0
      ? Math.round(((s.dayTotalPaise - s.yesterdayPaise) / s.yesterdayPaise) * 100)
      : null;

  return (
    <section className="animate-fade-up relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-zinc-900/80 p-6 shadow-2xl shadow-black/40 ring-1 ring-inset ring-white/5">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-emerald-500/15 blur-3xl"
      />
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">Spent today</p>
      <p className="mt-3 bg-gradient-to-br from-emerald-200 to-emerald-400 bg-clip-text text-5xl font-bold tracking-tight tabular-nums text-transparent">
        {formatRupees(s.dayTotalPaise)}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {delta !== null && (
          <span
            className={
              "rounded-full px-2.5 py-1 text-[11px] font-semibold " +
              (delta <= 0
                ? "bg-emerald-500/10 text-emerald-300"
                : "bg-rose-500/10 text-rose-300")
            }
          >
            {delta <= 0 ? "↓" : "↑"} {Math.abs(delta)}% vs yesterday
          </span>
        )}
        <span className="text-[11px] text-zinc-500">
          {s.dayCount} entries · report at 12:00 AM IST
        </span>
      </div>

      <div className="mt-6">
        <div className="flex h-14 items-end gap-1.5">
          {s.last7.map((d, i) => (
            <div
              key={d.ymd}
              title={`${d.ymd}: ${formatRupees(d.paise)}`}
              className={
                "flex-1 rounded-t-md " +
                (i === 6 ? "bg-gradient-to-t from-emerald-500 to-teal-300" : "bg-zinc-700/60")
              }
              style={{ height: `${Math.max(5, Math.round((d.paise / max) * 100))}%` }}
            />
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-zinc-600">
          <span>7 days ago</span>
          <span className="text-emerald-400/80">Today</span>
        </div>
      </div>
    </section>
  );
}

async function RecentSection({ userId }: { userId: number }) {
  try {
    const recent = await prisma.expense.findMany({
      where: { userId },
      orderBy: { spentAt: "desc" },
      take: 30,
    });
    const rows: ExpenseRowData[] = recent.map((e) => ({
      id: e.id,
      name: e.name,
      category: e.category,
      paise: e.paise,
      spentAt: e.spentAt.toISOString(),
    }));
    return <ExpenseList rows={rows} categories={[...CATEGORIES]} />;
  } catch {
    return <DbError />;
  }
}

function StatsSkeleton() {
  return (
    <>
      <div className="h-72 animate-pulse rounded-3xl border border-zinc-800 bg-zinc-900/70" />
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="h-24 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/70" />
        <div className="h-24 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/70" />
      </div>
    </>
  );
}

function ListSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/70">
      <div className="h-12 animate-pulse border-b border-zinc-800 bg-zinc-900/80" />
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-16 animate-pulse border-b border-zinc-800/60 bg-zinc-900/40" />
      ))}
    </div>
  );
}