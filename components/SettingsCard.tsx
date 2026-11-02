"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TelegramCard from "./TelegramCard";

export default function SettingsCard({
  accountEmail,
  reportEmail,
  mailConfigured,
  telegramChatId,
  telegramConfigured,
}: {
  accountEmail: string;
  reportEmail: string | null;
  mailConfigured: boolean;
  telegramChatId: string | null;
  telegramConfigured: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState(reportEmail ?? accountEmail);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [logingOut, setLogingOut] = useState(false);
  const [msg, setMsg] = useState("");
  const [testMsg, setTestMsg] = useState("");

  async function save() {
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportEmail: email.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        effectiveTarget?: string;
      };
      setMsg(
        res.ok
          ? `Saved ✓ — nightly mail goes to ${data.effectiveTarget}`
          : data.error ?? "Save failed"
      );
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function test() {
    setTesting(true);
    setTestMsg("");
    try {
      const res = await fetch("/api/settings/test-mail", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { error?: string; to?: string };
      setTestMsg(
        res.ok
          ? `Test mail sent to ${data.to} — check your inbox (and spam folder once)`
          : data.error ?? "Test mail failed"
      );
    } finally {
      setTesting(false);
    }
  }

  async function logout() {
    setLogingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setLogingOut(false);
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
      <h2 className="text-sm font-semibold text-zinc-200">Settings</h2>
      <p className="mt-1 text-xs text-zinc-500">Account: {accountEmail}</p>

      <div className="mt-3">
        <TelegramCard chatId={telegramChatId} configured={telegramConfigured} />
      </div>

      <p className="mt-4 text-xs text-zinc-500">
        Back-up channel — email. Needs the Gmail app password (README); Telegram alone is enough.
      </p>

      <label className="mt-2 block text-xs font-medium text-zinc-500">
        Nightly summary email (12:00 AM IST)
      </label>
      <div className="mt-1 flex gap-2">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-500/60 focus:outline-none"
        />
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-zinc-950 transition-colors hover:bg-emerald-400 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
      {msg && <p className="mt-2 text-xs text-zinc-400">{msg}</p>}

      <button
        onClick={test}
        disabled={testing || !mailConfigured}
        className="mt-3 w-full rounded-lg border border-zinc-800 bg-zinc-950/70 px-4 py-2 text-xs font-semibold text-zinc-300 disabled:opacity-50"
      >
        {testing ? "Sending…" : "Send test mail now"}
      </button>
      {testMsg && <p className="mt-2 text-xs text-zinc-400">{testMsg}</p>}
      {!mailConfigured && (
        <p className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-300">
          Email channel not set up (skipped) — Telegram above is your nightly channel.
        </p>
      )}

      <button
        onClick={logout}
        disabled={logingOut}
        className="mt-4 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
      >
        {logingOut ? "Logging out…" : "Logout"}
      </button>
    </section>
  );
}