"use client";

import Image from "next/image";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import DiscoverTabs from "@/components/DiscoverTabs";
import { mediaUrl } from "@/lib/api";
import { usePassTopPickMutation, useTopPicksQuery } from "@/lib/queries";
import { CloseIcon } from "@/components/icons";

export default function TopPicksPage() {
  const { data: profiles, isLoading } = useTopPicksQuery();
  const passTopPick = usePassTopPickMutation();

  return (
    <div className="mx-auto w-full max-w-5xl">
      <TopBar title="Top Picks" />
      <DiscoverTabs />
      <p className="px-4 pt-3 text-xs text-white/40">
        Une sélection quotidienne. Passe ceux qui ne t&apos;intéressent pas.
      </p>
      {isLoading ? (
        <p className="px-4 py-10 text-center text-sm text-white/50">Chargement…</p>
      ) : !profiles || profiles.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-white/50">
          Plus de sélection pour aujourd&apos;hui.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:grid-cols-4">
          {profiles.map((p) => (
            <div
              key={p.profileId}
              className="relative aspect-[3/4] overflow-hidden rounded-xl bg-white/5"
            >
              <Link href={`/profile/${p.profileId}`} className="block h-full w-full">
                <Image
                  src={mediaUrl(p.profileImageMediaHash, p.displayName ?? undefined)}
                  alt={p.displayName ?? "Profil"}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </Link>
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/85 to-transparent px-2 pb-2 pt-6">
                <span className="truncate text-sm font-medium text-white">
                  {p.displayName ?? "—"}
                  {p.showAge && p.age ? `, ${p.age}` : ""}
                </span>
                <button
                  onClick={() => passTopPick.mutate(p.profileId)}
                  className="shrink-0 rounded-full bg-white/15 p-1.5 text-white hover:bg-white/25"
                  title="Passer"
                >
                  <CloseIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
