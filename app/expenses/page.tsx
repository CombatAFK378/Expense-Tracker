import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { groupByMonth } from "@/lib/dates";
import { CATEGORIES } from "@/lib/categories";
import { formatRupees } from "@/lib/format";
import NavBar from "@/components/NavBar";
import ExpenseTimeline from "@/components/ExpenseTimeline";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const all = await prisma.expense.findMany({
    where: { userId: user.id },
    orderBy: { spentAt: "desc" },
    take: 1000,
  });

  const rows = all.map((e) => ({
    id: e.id,
    name: e.name,
    category: e.category,
    paise: e.paise,
    spentAt: e.spentAt.toISOString(),
  }));
  const totalPaise = rows.reduce((sum, r) => sum + r.paise, 0);
  const months = groupByMonth(rows);

  return (
    <>
      <NavBar />
      <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-7 sm:px-6">
        <div className="flex items-baseline justify-between">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-50">My expenses</h1>
          <p className="text-xs text-zinc-500">
            All time: {formatRupees(totalPaise)} · {rows.length} entries
          </p>
        </div>
        <div className="mt-6">
          <ExpenseTimeline months={months} categories={[...CATEGORIES]} />
        </div>
      </main>
    </>
  );
}