import Link from "next/link";
import Image from "next/image";
import { Conversation } from "@/lib/types";
import { mediaUrl } from "@/lib/api";

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatListItem({ conversation }: { conversation: Conversation }) {
  return (
    <Link
      href={`/chat/${conversation.profileId}`}
      className="flex items-center gap-3 border-b border-white/5 px-4 py-3 hover:bg-white/5"
    >
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-white/10">
        <Image
          src={mediaUrl(conversation.profileImageMediaHash, conversation.displayName ?? undefined)}
          alt={conversation.displayName ?? "Profil"}
          fill
          unoptimized
          className="object-cover"
        />
        {conversation.online && (
          <span className="absolute right-0 bottom-0 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-[#141416]" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate font-medium">{conversation.displayName ?? "—"}</p>
          <span className="shrink-0 text-[11px] text-white/40">
            {formatTime(conversation.lastMessageTimestamp)}
          </span>
        </div>
        <p className="truncate text-sm text-white/60">{conversation.lastMessage}</p>
      </div>
      {conversation.unreadCount > 0 && (
        <span className="ml-1 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-violet-400 px-1 text-[11px] font-semibold text-black">
          {conversation.unreadCount}
        </span>
      )}
    </Link>
  );
}
