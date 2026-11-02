"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TelegramCard({
  chatId,
  configured,
}: {
  chatId: string | null;
  configured: boolean;
}) {
  const router = useRouter();
  const [link, setLink] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const [testMsg, setTestMsg] = useState("");

  async function connect() {
    setBusy("connect");
    setMsg("");
    setLink(null);
    setCode(null);
    try {
      const res = await fetch("/api/settings/telegram/link", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        deepLink?: string;
        code?: string;
      };
      if (!res.ok) {
        setMsg(data.error ?? "Could not generate the linking code");
        return;
      }
      setLink(data.deepLink ?? null);
      setCode(data.code ?? null);
    } finally {
      setBusy(null);
    }
  }

  function copyCode() {
    if (!code) return;
    navigator.clipboard
      ?.writeText(code)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => undefined);
  }

  async function check() {
    setBusy("check");
    setMsg("");
    try {
      const res = await fetch("/api/settings/telegram/check", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        found?: boolean;
        message?: string;
        error?: string;
      };
      if (data.ok) {
        setLink(null);
        setCode(null);
        setMsg("Telegram connected ✓ — nightly update lands in that chat at 12:00 AM IST");
        router.refresh();
      } else {
        setMsg(
          data.message ??
            data.error ??
            "Not seen yet — send the code to the bot (press Start first), then check again."
        );
      }
    } finally {
      setBusy(null);
    }
  }

  async function test() {
    setBusy("test");
    setTestMsg("");
    try {
      const res = await fetch("/api/settings/telegram/test", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setTestMsg(res.ok ? "Sent — check your Telegram chat" : data.error ?? "Test failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-zinc-100">Telegram — nightly update</h3>
        {chatId && <span className="text-[10px] font-semibold text-emerald-400">connected ✓</span>}
      </div>

      {!chatId ? (
        <div className="mt-3 flex flex-col gap-2">
          <button
            onClick={connect}
            disabled={busy !== null || !configured}
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-xs font-semibold text-zinc-200 transition-colors hover:border-zinc-600 disabled:opacity-50"
          >
            {busy === "connect" ? "Preparing…" : link ? "Get a fresh code" : "1 · Get linking code"}
          </button>

          {code && (
            <>
              <button
                onClick={copyCode}
                className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-3 transition-colors hover:bg-emerald-500/20"
              >
                <span className="block text-[10px] uppercase tracking-widest text-zinc-500">
                  2 · one-time code (tap to copy)
                </span>
                <span className="mt-1 block font-mono text-xl font-bold tracking-[0.2em] text-emerald-300">
                  {code}
                </span>
              </button>

              <p className="text-[11px] leading-relaxed text-zinc-500">
                On your <b>phone</b>: open <b>@Intelligent_Money_Tracker_bot</b> in Telegram → press
                START → send the code. Or open this link on the phone (it pre-fills the code):
              </p>
              {link && (
                <a
                  href={link}
                  className="break-all rounded-lg border border-[#0088cc]/40 bg-[#0088cc]/10 px-3 py-2 text-center text-[11px] font-semibold text-sky-300 hover:bg-[#0088cc]/20"
                >
                  t.me link — open on phone / copy to phone
                </a>
              )}

              <button
                onClick={check}
                disabled={busy !== null || !configured}
                className="rounded-lg bg-emerald-500 px-3 py-2.5 text-xs font-bold text-zinc-950 transition-colors hover:bg-emerald-400 disabled:opacity-50"
              >
                {busy === "check" ? "Checking…" : "3 · Check connection"}
              </button>
            </>
          )}
        </div>
      ) : (
        <button
          onClick={test}
          disabled={busy !== null}
          className="mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-xs font-semibold text-zinc-200 transition-colors hover:border-zinc-600 disabled:opacity-50"
        >
          {busy === "test" ? "Sending…" : "Send test message now"}
        </button>
      )}

      {msg && <p className="mt-2 whitespace-pre-line text-xs text-zinc-400">{msg}</p>}
      {copied && <p className="mt-1 text-[10px] text-emerald-400">code copied ✓</p>}
      {testMsg && <p className="mt-2 text-xs text-zinc-400">{testMsg}</p>}
      {!configured && (
        <p className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-300">
          Bot token missing — create it with @BotFather (README step 1).
        </p>
      )}
    </div>
  );
}