import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CATEGORIES } from "@/lib/categories";
import { formatRupees } from "@/lib/format";
import { getSummary } from "@/lib/summary";
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
            <p className="px-1 text-[11px] leading-relaxed text-zinc-600">
              Log every UPI payment right after paying — the tracker only works if logging is
              instant.
            </p>
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
    // ONE month-range query (inside getSummary) computes today/yesterday/month in JS.
    const s = await getSummary(userId, istYMD());
    return (
      <>
        <section className="relative overflow-hidden rounded-3xl border border-emerald-500/25 bg-gradient-to-br from-zinc-900 via-zinc-900 to-emerald-950/40 p-6 shadow-2xl shadow-black/50 ring-1 ring-inset ring-white/5">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
            Spent today
          </p>
          <p className="mt-3 text-5xl font-bold tracking-tight tabular-nums text-emerald-300">
            {formatRupees(s.dayTotalPaise)}
          </p>
          <p className="mt-3 text-xs leading-relaxed text-zinc-500">
            {s.dayCount} entries today · {s.monthCount} this month · nightly report at 12:00 AM IST
          </p>
        </section>

        <section className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-xs text-zinc-500">This month</p>
            <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-zinc-50">
              {formatRupees(s.monthTotalPaise)}
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-xs text-zinc-500">Yesterday</p>
            <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-zinc-50">
              {formatRupees(s.yesterdayPaise)}
            </p>
          </div>
        </section>
      </>
    );
  } catch {
    return <DbError />;
  }
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
      <div className="h-44 animate-pulse rounded-3xl border border-zinc-800 bg-zinc-900/70" />
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="h-24 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/70" />
        <div className="h-24 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/70" />
      </div>
    </>
  );
}

function ListSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
      <div className="h-12 animate-pulse border-b border-zinc-800 bg-zinc-900/80" />
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-14 animate-pulse border-b border-zinc-800/60 bg-zinc-900/40" />
      ))}
    </div>
  );
}