"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useQueryClient } from "@tanstack/react-query";
import { connectGlobalEvents, RealtimeEvent } from "@/lib/realtime";
import { mediaUrl } from "@/lib/api";
import { queryKeys } from "@/lib/queries";
import { Conversation, Message } from "@/lib/types";

interface Toast {
  id: string;
  profileId: string;
  title: string;
  body: string;
  href: string;
}

const AUTO_DISMISS_MS = 5000;

function labelFor(event: RealtimeEvent): { title: string; body: string; href: string } {
  const name = event.displayName ?? "Quelqu'un";
  switch (event.kind) {
    case "message":
      return { title: name, body: event.message.body, href: `/chat/${event.profileId}` };
    case "tap":
      return { title: name, body: "t'a envoyé un tap 👋", href: `/profile/${event.profileId}` };
    case "view":
      return { title: name, body: "a vu ton profil 👀", href: "/views" };
  }
}

/** Mounted once inside the authenticated shell: listens for realtime events
 * app-wide, live-updates the relevant query caches, and shows a toast. */
export default function NotificationProvider() {
  const router = useRouter();
  const qc = useQueryClient();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    const conn = connectGlobalEvents((event) => {
      if (event.kind === "message") {
        qc.setQueryData<Message[]>(queryKeys.messages(event.profileId), (prev = []) => [
          ...prev,
          event.message,
        ]);
        qc.setQueryData<Conversation[]>(queryKeys.conversations, (prev) => {
          if (!prev) return prev;
          const idx = prev.findIndex((c) => c.profileId === event.profileId);
          if (idx === -1) return prev;
          const updated: Conversation = {
            ...prev[idx],
            lastMessage: event.message.body,
            lastMessageTimestamp: event.message.timestamp,
            unreadCount: prev[idx].unreadCount + 1,
          };
          return [updated, ...prev.slice(0, idx), ...prev.slice(idx + 1)];
        });
      } else if (event.kind === "tap") {
        qc.invalidateQueries({ queryKey: queryKeys.tapStats });
      } else if (event.kind === "view") {
        qc.invalidateQueries({ queryKey: queryKeys.views });
      }

      const { title, body, href } = labelFor(event);
      const id = `t${idRef.current++}`;
      setToasts((prev) => [
        ...prev,
        { id, profileId: event.profileId, title, body, href },
      ]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), AUTO_DISMISS_MS);
    });
    return () => conn.close();
  }, [qc]);

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-60 flex flex-col items-center gap-2 px-3 pt-3">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => {
            dismiss(t.id);
            router.push(t.href);
          }}
          className="page-transition-slide pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border border-white/10 bg-[#1c1c1f]/95 p-3 text-left shadow-xl backdrop-blur"
        >
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-white/10">
            <Image
              src={mediaUrl(t.profileId, t.title)}
              alt={t.title}
              fill
              unoptimized
              className="object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{t.title}</p>
            <p className="truncate text-xs text-white/60">{t.body}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
