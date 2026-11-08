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
    <nav className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/85 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 text-base text-emerald-300">
            ₹
          </span>
          <span className="text-sm font-semibold text-zinc-100">Expense Tracker</span>
        </div>
        <div className="flex items-center gap-1">
          {TABS.map((t) => {
            const active = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={
                  "min-h-9 rounded-lg px-3 py-2 text-xs font-semibold transition-colors " +
                  (active
                    ? "bg-zinc-800 text-zinc-50"
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