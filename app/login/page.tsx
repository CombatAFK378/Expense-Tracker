"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }
      router.push("/");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm animate-fade-up">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-2xl font-bold text-zinc-950 shadow-xl shadow-emerald-500/20">
            ₹
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-50">Expense Tracker</h1>
          <p className="mt-1.5 text-sm text-zinc-500">Login to your expense log</p>
        </div>

        <form
          onSubmit={submit}
          className="mt-7 rounded-3xl border border-zinc-800/80 bg-zinc-900/70 p-6 shadow-2xl shadow-black/40 backdrop-blur"
        >
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="you@gmail.com"
            autoComplete="email"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            className="mt-3 w-full rounded-xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
          {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="mt-5 min-h-11 w-full rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 py-3 text-sm font-bold text-zinc-950 shadow-lg shadow-emerald-500/20 transition-all hover:from-emerald-300 hover:to-teal-300 active:scale-[0.98] disabled:opacity-50"
          >
            {busy ? "Logging in…" : "Login"}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-zinc-500">
          New here?{" "}
          <Link href="/signup" className="font-medium text-emerald-300 underline">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}