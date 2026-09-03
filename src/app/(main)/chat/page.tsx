"use client";

import TopBar from "@/components/TopBar";
import ChatListItem from "@/components/ChatListItem";
import { useConversationsQuery } from "@/lib/queries";

export default function ChatListPage() {
  const { data: conversations, isLoading } = useConversationsQuery();

  return (
    <div className="mx-auto w-full max-w-2xl">
      <TopBar title="Messages" />
      {isLoading ? (
        <p className="px-4 py-10 text-center text-sm text-white/50">Chargement…</p>
      ) : !conversations || conversations.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-white/50">
          Aucune conversation pour le moment.
        </p>
      ) : (
        <div>
          {conversations.map((c) => (
            <ChatListItem key={c.profileId} conversation={c} />
          ))}
        </div>
      )}
    </div>
  );
}
