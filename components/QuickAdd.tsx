"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { categoryMeta, guessCategory } from "@/lib/categories";
import { formatRupees, toLocalInput } from "@/lib/format";
import { parseEntry } from "@/lib/parse";

const LAST_CAT_KEY = "et_last_category";

export default function QuickAdd({ categories }: { categories: string[] }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [category, setCategory] = useState("Other");
  const [catTouched, setCatTouched] = useState(false);
  const [dateMode, setDateMode] = useState<"now" | "custom">("now");
  const [dateLocal, setDateLocal] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const parsed = useMemo(() => parseEntry(text), [text]);
  const meta = categoryMeta(category);

  useEffect(() => {
    const savedCat = window.localStorage.getItem(LAST_CAT_KEY);
    if (savedCat && categories.includes(savedCat)) setCategory(savedCat);
  }, [categories]);

  useEffect(() => {
    if (!catTouched && parsed.hasAmount && parsed.name) {
      setCategory(guessCategory(parsed.name));
    }
  }, [parsed, catTouched]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);
    if (!parsed.hasAmount) {
      setError("Missing the amount — type like “swiggy lunch 120”");
      return;
    }
    if (!parsed.name) {
      setError("Missing what it was for — type like “swiggy 120”");
      return;
    }
    setBusy(true);

    const spentAt = dateMode === "custom" && dateLocal ? new Date(dateLocal) : new Date();
    const optimisticRow = {
      id: -Date.now(),
      name: parsed.name,
      category,
      paise: parsed.paise,
      spentAt: spentAt.toISOString(),
    };

    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: parsed.name,
          amount: parsed.paise / 100,
          category,
          spentAt: spentAt.toISOString(),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not save the expense");
        return;
      }

      window.localStorage.setItem(LAST_CAT_KEY, category);
      window.dispatchEvent(new CustomEvent("et:expense-added", { detail: optimisticRow }));

      setText("");
      setDateMode("now");
      setSaved(true);
      void router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="animate-fade-up rounded-3xl border border-zinc-800/80 bg-zinc-900/70 p-5 shadow-xl shadow-black/30 backdrop-blur"
    >
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-zinc-200">Add expense</h2>
        {saved && <span className="toast-in text-xs font-semibold text-emerald-400">Saved ✓</span>}
      </div>

      <input
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setSaved(false);
        }}
        placeholder="swiggy lunch 120"
        className="mt-3 w-full rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3.5 text-lg font-medium tracking-wide text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        autoComplete="off"
      />

      <div className="mt-3 flex items-center gap-2.5">
        <span
          className={
            "min-w-24 text-right text-2xl font-bold tabular-nums tracking-tight " +
            (parsed.hasAmount ? "text-emerald-300" : "text-zinc-700")
          }
        >
          {parsed.hasAmount ? formatRupees(parsed.paise) : "₹—"}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm text-zinc-300">
          {parsed.name || <span className="text-zinc-600">what it was for…</span>}
        </span>
        <span className={`shrink-0 rounded-lg border px-1.5 py-1 text-sm ${meta.bg}`}>
          {meta.emoji}
        </span>
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setCatTouched(true);
          }}
          className="shrink-0 rounded-lg border border-zinc-800 bg-zinc-950/70 px-2.5 py-2.5 text-xs text-zinc-300 focus:border-emerald-500/60 focus:outline-none"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setDateMode("now");
            setDateLocal("");
          }}
          className={
            "min-h-9 rounded-lg px-3 py-2 text-xs font-semibold transition-colors " +
            (dateMode === "now"
              ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
              : "border border-zinc-800 bg-zinc-950/70 text-zinc-400 hover:text-zinc-200")
          }
        >
          Now
        </button>
        <button
          type="button"
          onClick={() => {
            if (dateMode !== "custom" && !dateLocal) setDateLocal(toLocalInput(new Date()));
            setDateMode("custom");
          }}
          className={
            "min-h-9 rounded-lg px-3 py-2 text-xs font-semibold transition-colors " +
            (dateMode === "custom"
              ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
              : "border border-zinc-800 bg-zinc-950/70 text-zinc-400 hover:text-zinc-200")
          }
        >
          Custom date
        </button>
        {dateMode === "custom" && (
          <input
            type="datetime-local"
            value={dateLocal}
            onChange={(e) => setDateLocal(e.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-zinc-800 bg-zinc-950/70 px-2.5 py-2 text-xs text-zinc-300 focus:border-emerald-500/60 focus:outline-none"
          />
        )}
      </div>

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="mt-4 min-h-11 w-full rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 py-3 text-sm font-bold text-zinc-950 shadow-lg shadow-emerald-500/20 transition-all hover:from-emerald-300 hover:to-teal-300 active:scale-[0.98] disabled:opacity-50"
      >
        {busy ? "Saving…" : "Add expense"}
      </button>
    </form>
  );
}