"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Cascade" },
  { href: "/discover", label: "Discover" },
  { href: "/top-picks", label: "Top Picks" },
  { href: "/alist", label: "A-List" },
  { href: "/vip", label: "VIP" },
  { href: "/rightnow", label: "Right Now" },
];

export default function DiscoverTabs() {
  const pathname = usePathname();

  return (
    <div className="scrollbar-none flex gap-1.5 overflow-x-auto border-b border-white/10 px-3 py-2">
      {TABS.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
              active
                ? "bg-amber-400 text-black"
                : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
