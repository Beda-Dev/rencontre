"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChatIcon, EyeIcon, GridIcon, StarIcon, UserIcon } from "./icons";
import { useConversationsQuery } from "@/lib/queries";

const TABS = [
  { href: "/", label: "Grille", icon: GridIcon },
  { href: "/favorites", label: "Favoris", icon: StarIcon },
  { href: "/views", label: "Vues", icon: EyeIcon },
  { href: "/chat", label: "Chat", icon: ChatIcon },
  { href: "/settings", label: "Profil", icon: UserIcon },
];

export default function BottomNav() {
  const pathname = usePathname();
  // Same query key/cache as the chat list page — one request serves both,
  // and sending/blocking anywhere invalidates it so this badge stays fresh.
  const { data: conversations } = useConversationsQuery();
  const unread = conversations?.reduce((sum, c) => sum + c.unreadCount, 0) ?? 0;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 border-t border-white/10 bg-[#141416]/95 backdrop-blur">
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={`relative flex flex-col items-center gap-1 py-2.5 text-[11px] transition-colors ${
                  active ? "text-blue-400" : "text-white/50 hover:text-white/80"
                }`}
              >
                <span className="relative">
                  <Icon className="h-6 w-6" />
                  {href === "/chat" && unread > 0 && (
                    <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-400 px-1 text-[9px] font-bold text-black">
                      {unread}
                    </span>
                  )}
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
