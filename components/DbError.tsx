"use client";

import { useRouter } from "next/navigation";

export default function DbError() {
  const router = useRouter();
  return (
    <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
      <p className="text-sm font-semibold text-amber-300">Database is napping 💤</p>
      <p className="mt-1 text-xs leading-relaxed text-zinc-400">
        Aiven free databases briefly go down during weekly maintenance windows. Your data is safe —
        the connection usually returns within a minute.
      </p>
      <button
        onClick={() => router.refresh()}
        className="mt-3 min-h-9 rounded-lg border border-amber-500/40 px-4 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/10"
      >
        Retry
      </button>
    </section>
  );
}