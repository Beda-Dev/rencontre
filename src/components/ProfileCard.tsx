"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Profile } from "@/lib/types";
import { api, mediaUrl } from "@/lib/api";
import { formatDistance, formatLastSeen } from "@/lib/format";
import { WaveIcon } from "./icons";

export default function ProfileCard({ profile }: { profile: Profile }) {
  const [tapped, setTapped] = useState(() => api.hasTapped(profile.profileId));

  async function handleTap(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (tapped) return;
    setTapped(true);
    await api.sendTap(profile.profileId);
  }

  return (
    <Link
      href={`/profile/${profile.profileId}`}
      className="group relative block aspect-square overflow-hidden rounded-lg bg-white/5"
    >
      <Image
        src={mediaUrl(profile.profileImageMediaHash, profile.displayName ?? undefined)}
        alt={profile.displayName ?? "Profil"}
        fill
        unoptimized
        sizes="(min-width: 1024px) 12vw, (min-width: 640px) 20vw, 33vw"
        className="object-cover transition-transform duration-200 group-hover:scale-105"
      />
      {profile.online && (
        <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-black/60" />
      )}
      <button
        onClick={handleTap}
        title={tapped ? "Tap envoyé" : "Envoyer un tap"}
        className={`absolute left-1.5 top-1.5 rounded-full p-1.5 backdrop-blur transition ${
          tapped ? "bg-blue-400 text-black" : "bg-black/50 text-white hover:bg-black/70"
        }`}
      >
        <WaveIcon className="h-3.5 w-3.5" />
      </button>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-2 pb-1.5 pt-4">
        <p className="truncate text-sm font-medium text-white">
          {profile.displayName ?? "—"}
          {profile.showAge && profile.age ? `, ${profile.age}` : ""}
        </p>
        <p className="truncate text-[11px] text-white/70">
          {profile.showDistance && profile.distance !== null
            ? formatDistance(profile.distance)
            : profile.online
              ? "En ligne"
              : formatLastSeen(profile.seen)}
        </p>
      </div>
    </Link>
  );
}
