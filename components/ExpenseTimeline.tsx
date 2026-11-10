"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EditRow, type ExpenseRowData } from "./ExpenseList";
import { categoryMeta } from "@/lib/categories";
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
      void router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  if (months.length === 0) {
    return (
      <section className="animate-fade-up rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/40 p-10 text-center">
        <p className="text-3xl">🗓️</p>
        <p className="mt-3 text-sm text-zinc-400">Nothing logged yet</p>
        <p className="mt-1 text-xs text-zinc-600">Your history builds up here month by month</p>
      </section>
    );
  }

  return (
    <div>
      {error && <p className="mb-2 text-xs text-red-400">{error}</p>}
      {months.map((m) => (
        <section key={m.key} className="mb-9 animate-fade-up">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h2 className="text-lg font-semibold tracking-tight text-zinc-50">{m.label}</h2>
            <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-bold tabular-nums text-emerald-300">
              {formatRupees(m.totalPaise)}
            </span>
          </div>

          {m.days.map((d) => {
            const prefix = relativeDayPrefix(d.ymd);
            return (
              <div
                key={d.ymd}
                className="mt-4 rounded-2xl border border-zinc-800/70 bg-zinc-900/40 p-4"
              >
                <div className="flex items-baseline justify-between">
                  <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                    {d.label}
                    {prefix && (
                      <span className="ml-2 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold normal-case tracking-normal text-emerald-300">
                        {prefix}
                      </span>
                    )}
                  </p>
                  <p className="text-xs font-semibold tabular-nums text-zinc-400">
                    {formatRupees(d.totalPaise)}
                  </p>
                </div>

                <ul className="mt-1 divide-y divide-zinc-800/50">
                  {d.rows.map((row) => {
                    const meta = categoryMeta(row.category);
                    return (
                      <li key={row.id} className="py-3">
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
                            <span className="w-16 shrink-0 text-xs tabular-nums text-zinc-500">
                              {timeOf(row.spentAt)}
                            </span>
                            <span className="shrink-0 text-base">{meta.emoji}</span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-zinc-100">
                                {row.name}
                              </p>
                              <span className={`text-[11px] ${meta.color}`}>{row.category}</span>
                            </div>
                            <p className="shrink-0 text-sm font-semibold tabular-nums text-zinc-100">
                              {formatRupees(row.paise)}
                            </p>
                            <button
                              onClick={() => setEditingId(row.id)}
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-xs text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                              aria-label="Edit"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => del(row.id)}
                              disabled={busyId === row.id}
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-xs text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-red-400 disabled:opacity-40"
                              aria-label="Delete"
                            >
                              🗑️
                            </button>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}