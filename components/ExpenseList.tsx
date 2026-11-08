"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatRupees, toLocalInput } from "@/lib/format";
import { istYMD, shiftYMD } from "@/lib/time";
import { parseEntry } from "@/lib/parse";

export type ExpenseRowData = {
  id: number;
  name: string;
  category: string;
  paise: number;
  spentAt: string; // ISO
};

const timeFmt = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});
const dateFmt = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});
const ymdFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const rowYmd = ymdFmt.format(d);
  const now = istYMD();
  if (rowYmd === now) return `Today, ${timeFmt.format(d)}`;
  if (rowYmd === shiftYMD(now, -1)) return `Yesterday, ${timeFmt.format(d)}`;
  return dateFmt.format(d);
}

export default function ExpenseList({
  rows,
  categories,
}: {
  rows: ExpenseRowData[];
  categories: string[];
}) {
  const router = useRouter();
  const [rowsState, setRowsState] = useState<ExpenseRowData[]>(rows);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");

  // Server refresh lands authoritative rows.
  useEffect(() => setRowsState(rows), [rows]);

  // Optimistic add from QuickAdd: appears instantly, before the server roundtrip.
  useEffect(() => {
    function onAdd(e: Event) {
      const row = (e as CustomEvent<ExpenseRowData>).detail;
      if (row) setRowsState((prev) => [row, ...prev].slice(0, 30));
    }
    window.addEventListener("et:expense-added", onAdd);
    return () => window.removeEventListener("et:expense-added", onAdd);
  }, []);

  async function del(id: number) {
    if (!confirm("Delete this expense?")) return;
    setRowsState((prev) => prev.filter((r) => r.id !== id)); // instant local removal
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

  if (rowsState.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-8 text-center text-sm text-zinc-500">
        Nothing logged yet — add your first payment 👆
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
      <h2 className="border-b border-zinc-800/80 px-4 py-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">
        Recent expenses
      </h2>
      {error && <p className="px-4 pt-2 text-xs text-red-400">{error}</p>}
      <ul className="divide-y divide-zinc-800/60">
        {rowsState.map((row) => (
          <li key={row.id} className="px-4 py-3.5">
            {editingId === row.id ? (
              <EditRow
                row={row}
                categories={categories}
                busy={busyId === row.id}
                onCancel={() => setEditingId(null)}
                onDone={() => {
                  setEditingId(null);
                  void router.refresh();
                }}
                onError={(msg) => setError(msg)}
              />
            ) : (
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-100">{row.name}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
                    <span>{dayLabel(row.spentAt)}</span>
                    <span className="rounded-md bg-zinc-800/80 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
                      {row.category}
                    </span>
                  </p>
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
        ))}
      </ul>
    </section>
  );
}

export function EditRow({
  row,
  categories,
  busy,
  onCancel,
  onDone,
  onError,
}: {
  row: ExpenseRowData;
  categories: string[];
  busy: boolean;
  onCancel: () => void;
  onDone: () => void;
  onError: (msg: string) => void;
}) {
  const [text, setText] = useState(`${row.name} ${row.paise / 100}`);
  const [category, setCategory] = useState(row.category);
  const [dateLocal, setDateLocal] = useState(toLocalInput(new Date(row.spentAt)));

  async function save() {
    onError("");
    const parsed = parseEntry(text);
    if (!parsed.hasAmount || !parsed.name) {
      onError("Type it like “swiggy lunch 120”");
      return;
    }
    try {
      const res = await fetch(`/api/expenses/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: parsed.name,
          amount: parsed.paise / 100,
          category,
          spentAt: new Date(dateLocal).toISOString(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        onError((data as { error?: string }).error ?? "Update failed");
        return;
      }
      onDone();
    } catch {
      onError("Update failed");
    }
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="swiggy lunch 120"
        className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-500/60 focus:outline-none"
      />
      <div className="mt-2 flex gap-2">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-2.5 text-xs text-zinc-300 focus:border-emerald-500/60 focus:outline-none"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          type="datetime-local"
          value={dateLocal}
          onChange={(e) => setDateLocal(e.target.value)}
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-2 text-xs text-zinc-300 focus:border-emerald-500/60 focus:outline-none"
        />
      </div>
      <div className="mt-2 flex justify-end gap-2">
        <button onClick={onCancel} className="rounded-lg px-3 py-2 text-xs text-zinc-500 hover:text-zinc-300">
          Cancel
        </button>
        <button
          onClick={save}
          disabled={busy}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-zinc-950 disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}