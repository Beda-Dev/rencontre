"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import DiscoverTabs from "@/components/DiscoverTabs";
import { mediaUrl } from "@/lib/api";
import { formatDistance } from "@/lib/format";
import {
  useActiveRightNowPostQuery,
  useCreateRightNowPostMutation,
  useDeleteRightNowPostMutation,
  useRightNowFeedQuery,
} from "@/lib/queries";
import { TrashIcon } from "@/components/icons";

function timeLeft(expiration: number): string {
  const ms = expiration - Date.now();
  if (ms <= 0) return "Expiré";
  const min = Math.round(ms / 60000);
  return min < 60 ? `${min} min restantes` : `${Math.round(min / 60)} h restantes`;
}

export default function RightNowPage() {
  const { data: feed, isLoading } = useRightNowFeedQuery();
  const { data: mine } = useActiveRightNowPostQuery();
  const createPost = useCreateRightNowPostMutation();
  const deletePost = useDeleteRightNowPostMutation();
  const [text, setText] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setText("");
    await createPost.mutateAsync(t);
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <TopBar title="Right Now" />
      <DiscoverTabs />

      <div className="px-4 py-3">
        {mine ? (
          <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-3">
            <p className="text-sm text-amber-200">{mine.text}</p>
            <div className="mt-2 flex items-center justify-between text-xs text-amber-300/70">
              <span>{timeLeft(mine.expiration)}</span>
              <button
                onClick={() => deletePost.mutate()}
                disabled={deletePost.isPending}
                className="flex items-center gap-1 hover:text-red-300"
              >
                <TrashIcon className="h-3.5 w-3.5" />
                Retirer
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Dispo pour quoi, là maintenant ?"
              maxLength={120}
              className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              disabled={createPost.isPending || !text.trim()}
              className="shrink-0 rounded-full bg-amber-400 px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
            >
              Poster
            </button>
          </form>
        )}
        <p className="mt-1.5 text-[11px] text-white/30">
          Expire automatiquement au bout d&apos;1 heure.
        </p>
      </div>

      {isLoading ? (
        <p className="px-4 py-10 text-center text-sm text-white/50">Chargement…</p>
      ) : (
        <div className="space-y-2 px-4 pb-6">
          {(feed ?? [])
            .filter((p) => !p.mine)
            .map((post) => (
              <Link
                key={post.postId}
                href={`/profile/${post.profileId}`}
                className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3 hover:border-white/20"
              >
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-white/10">
                  <Image
                    src={mediaUrl(post.profileImageMediaHash, post.displayName ?? undefined)}
                    alt={post.displayName ?? "Profil"}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{post.displayName ?? "—"}</p>
                  <p className="truncate text-sm text-white/70">{post.text}</p>
                </div>
                <div className="shrink-0 text-right text-[11px] text-white/40">
                  {post.distance !== null && <p>{formatDistance(post.distance)}</p>}
                  <p>{timeLeft(post.expiration)}</p>
                </div>
              </Link>
            ))}
        </div>
      )}
    </div>
  );
}
