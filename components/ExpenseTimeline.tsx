"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EditRow, type ExpenseRowData } from "./ExpenseList";
import { formatRupees } from "@/lib/format";
import { relativeDayPrefix, timeOf, type MonthGroup } from "@/lib/dates";

export default function ExpenseTimeline({
  months,
  categories,
}: {
  months: MonthGroup[];
  categories: string[];
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function del(id: number) {
    if (!confirm("Delete this expense?")) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? "Delete failed");
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  if (months.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40 p-8 text-center text-sm text-zinc-500">
        Nothing logged yet — your history will build up here month by month.
      </section>
    );
  }

  return (
    <div>
      {error && <p className="mb-2 text-xs text-red-400">{error}</p>}
      {months.map((m) => (
        <section key={m.key} className="mb-9">
          <div className="flex items-baseline justify-between border-b border-zinc-800 pb-2.5">
            <h2 className="text-lg font-semibold tracking-tight text-zinc-50">{m.label}</h2>
            <p className="text-base font-bold text-emerald-300">{formatRupees(m.totalPaise)}</p>
          </div>

          {m.days.map((d) => {
            const prefix = relativeDayPrefix(d.ymd);
            return (
              <div key={d.ymd} className="mt-5">
                <div className="flex items-baseline justify-between">
                  <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                    {d.label}
                    {prefix && (
                      <span className="ml-2 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold normal-case tracking-normal text-emerald-300">
                        {prefix}
                      </span>
                    )}
                  </p>
                  <p className="text-xs font-semibold text-zinc-400">
                    {formatRupees(d.totalPaise)}
                  </p>
                </div>

                <ul className="mt-1 divide-y divide-zinc-800/60">
                  {d.rows.map((row) => (
                    <li key={row.id} className="py-3.5">
                      {editingId === row.id ? (
                        <EditRow
                          row={row as ExpenseRowData}
                          busy={busyId === row.id}
                          categories={categories}
                          onCancel={() => setEditingId(null)}
                          onDone={() => {
                            setEditingId(null);
                            void router.refresh();
                          }}
                          onError={(msg) => setError(msg)}
                        />
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className="w-20 shrink-0 text-xs text-zinc-500">
                            {timeOf(row.spentAt)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-zinc-100">{row.name}</p>
                            <span className="mt-1 inline-block rounded-md bg-zinc-800/80 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
                              {row.category}
                            </span>
                          </div>
                          <p className="shrink-0 text-sm font-semibold text-zinc-100">
                            {formatRupees(row.paise)}
                          </p>
                          <button
                            onClick={() => setEditingId(row.id)}
                            className="text-xs text-zinc-600 transition-colors hover:text-zinc-300"
                            aria-label="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => del(row.id)}
                            disabled={busyId === row.id}
                            className="text-xs text-zinc-600 transition-colors hover:text-red-400 disabled:opacity-40"
                            aria-label="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}