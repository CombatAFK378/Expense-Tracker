"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
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
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Signup failed");
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
      <div className="w-full max-w-sm">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-2xl">
            ₹
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-zinc-50">Expense Tracker</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Create your account — each user sees only their own expenses
          </p>
        </div>

        <form
          onSubmit={submit}
          className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur"
        >
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="you@gmail.com"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950/70 px-3 py-2.5 text-sm text-zinc-100 focus:border-emerald-500/60 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password (min 6 characters)"
            className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950/70 px-3 py-2.5 text-sm text-zinc-100 focus:border-emerald-500/60 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
          />
          <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">
            You'll connect your Telegram for the nightly 12 AM IST summary — email here is just
            your login.
          </p>
          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="mt-3 w-full rounded-xl bg-emerald-500 py-3 text-sm font-bold text-zinc-950 transition-colors hover:bg-emerald-400 disabled:opacity-50"
          >
            {busy ? "Creating…" : "Create account"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-zinc-500">
          Already have one?{" "}
          <Link href="/login" className="font-medium text-emerald-300 underline">
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}