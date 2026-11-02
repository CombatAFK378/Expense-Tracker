import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CATEGORIES } from "@/lib/categories";
import { formatRupees } from "@/lib/format";
import { isMailConfigured } from "@/lib/mail";
import { isTelegramConfigured } from "@/lib/telegram";
import { dayBounds, istYMD, monthStartYMD, shiftYMD } from "@/lib/time";
import QuickAdd from "@/components/QuickAdd";
import ExpenseList, { type ExpenseRowData } from "@/components/ExpenseList";
import SettingsCard from "@/components/SettingsCard";
import NavBar from "@/components/NavBar";

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

  const ymd = istYMD();
  const { start: dayStart, end: dayEnd } = dayBounds(ymd);
  const { start: yStart, end: yEnd } = dayBounds(shiftYMD(ymd, -1));
  const monthStart = dayBounds(monthStartYMD(ymd)).start;

  const [todayAgg, yesterdayAgg, monthAgg, recent] = await Promise.all([
    prisma.expense.aggregate({
      where: { userId: user.id, spentAt: { gte: dayStart, lte: dayEnd } },
      _sum: { paise: true },
      _count: true,
    }),
    prisma.expense.aggregate({
      where: { userId: user.id, spentAt: { gte: yStart, lte: yEnd } },
      _sum: { paise: true },
      _count: true,
    }),
    prisma.expense.aggregate({
      where: { userId: user.id, spentAt: { gte: monthStart, lte: dayEnd } },
      _sum: { paise: true },
      _count: true,
    }),
    prisma.expense.findMany({
      where: { userId: user.id },
      orderBy: { spentAt: "desc" },
      take: 30,
    }),
  ]);

  const todayPaise = todayAgg._sum.paise ?? 0;
  const yesterdayPaise = yesterdayAgg._sum.paise ?? 0;
  const monthPaise = monthAgg._sum.paise ?? 0;

  const rows: ExpenseRowData[] = recent.map((e) => ({
    id: e.id,
    name: e.name,
    category: e.category,
    paise: e.paise,
    spentAt: e.spentAt.toISOString(),
  }));
  const lastCategory = recent[0]?.category ?? "Other";

  return (
    <>
      <NavBar />
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6">
      <div className="mt-1 flex items-center justify-between">
        <p className="text-xs text-zinc-500">{IST_TODAY.format(new Date())} · IST</p>
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-300">
          ₹ INR
        </span>
      </div>

      <div className="mt-7 grid gap-4 lg:grid-cols-[380px_1fr] lg:gap-6">
        {/* Left column — the numbers + the one action */}
        <div className="flex flex-col gap-4">
          <section className="rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6 shadow-2xl shadow-black/50">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
              Spent today
            </p>
            <p className="mt-3 text-5xl font-bold tracking-tight text-emerald-300">
              {formatRupees(todayPaise)}
            </p>
            <p className="mt-3 text-xs leading-relaxed text-zinc-500">
              {todayAgg._count} entries today · {monthAgg._count} this month · nightly report at
              12:00 AM IST
            </p>
          </section>

          <section className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
              <p className="text-xs text-zinc-500">This month</p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-zinc-50">
                {formatRupees(monthPaise)}
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
              <p className="text-xs text-zinc-500">Yesterday</p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-zinc-50">
                {formatRupees(yesterdayPaise)}
              </p>
            </div>
          </section>

          <QuickAdd categories={[...CATEGORIES]} initialCategory={lastCategory} />

          <p className="px-1 text-[11px] leading-relaxed text-zinc-600">
            Log every UPI payment right after paying — the tracker only works if logging is
            instant.
          </p>
        </div>

        {/* Right column — history + settings */}
        <div className="flex flex-col gap-4">
          <ExpenseList rows={rows} categories={[...CATEGORIES]} />

          <SettingsCard
            accountEmail={user.email}
            reportEmail={user.reportEmail}
            mailConfigured={isMailConfigured()}
            telegramChatId={user.telegramChatId}
            telegramConfigured={isTelegramConfigured()}
          />
        </div>
      </div>
    </main>
    </>
  );
}