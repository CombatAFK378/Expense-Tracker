"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Home" },
  { href: "/expenses", label: "My expenses" },
  { href: "/settings", label: "Settings" },
];

export default function NavBar() {
  const pathname = usePathname();
  return (
    <nav className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-lg font-bold text-zinc-950 shadow-lg shadow-emerald-500/20">
            ₹
          </span>
          <span className="text-sm font-semibold tracking-tight text-zinc-100">
            Expense Tracker
          </span>
        </Link>
        <div className="flex items-center gap-0.5 rounded-full border border-zinc-800 bg-zinc-900/70 p-1">
          {TABS.map((t) => {
            const active = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={
                  "min-h-8 rounded-full px-3 py-1.5 text-xs font-semibold transition-all " +
                  (active
                    ? "bg-zinc-100 text-zinc-950 shadow"
                    : "text-zinc-500 hover:text-zinc-200")
                }
              >
                {t.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}