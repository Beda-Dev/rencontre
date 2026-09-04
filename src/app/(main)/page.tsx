"use client";

import { useState } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import ProfileGrid from "@/components/ProfileGrid";
import { useCascadeQuery } from "@/lib/queries";
import { useGeolocation } from "@/lib/useGeolocation";
import { useEffectiveLocation } from "@/lib/useEffectiveLocation";
import { PhotoIcon } from "@/components/icons";
import DiscoverTabs from "@/components/DiscoverTabs";

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition ${
        active
          ? "border-blue-400 bg-blue-400 text-black"
          : "border-white/15 text-white/70 hover:border-white/30"
      }`}
    >
      {children}
    </button>
  );
}

export default function CascadePage() {
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [photoOnly, setPhotoOnly] = useState(false);
  const geo = useGeolocation();
  const location = useEffectiveLocation();
  const { data: profiles, isLoading } = useCascadeQuery({
    online: onlineOnly,
    photoOnly,
    geohash: location.geohash ?? undefined,
    lat: location.lat ?? undefined,
    lng: location.lng ?? undefined,
  });

  const showLocationPrompt = geo.status === "idle" || geo.status === "denied";

  return (
    <div className="mx-auto w-full max-w-5xl">
      <TopBar
        title="Rencontre"
        right={
          <div className="flex items-center gap-2">
            <FilterChip active={photoOnly} onClick={() => setPhotoOnly((v) => !v)}>
              <PhotoIcon className="h-3.5 w-3.5" />
              Photos
            </FilterChip>
            <FilterChip active={onlineOnly} onClick={() => setOnlineOnly((v) => !v)}>
              En ligne
            </FilterChip>
          </div>
        }
      />
      <DiscoverTabs />

      {location.source === "roam" && (
        <Link
          href="/settings/location"
          className="flex items-center justify-between border-b border-blue-400/20 bg-blue-400/10 px-4 py-2 text-xs text-blue-300"
        >
          <span>📍 En roaming à {location.label}</span>
          <span className="underline">Gérer</span>
        </Link>
      )}

      {showLocationPrompt && location.source !== "roam" && (
        <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/5 px-4 py-2.5 text-xs">
          <span className="text-white/60">
            {geo.status === "denied"
              ? "Position refusée — les distances affichées sont approximatives."
              : "Active ta position pour des distances précises."}
          </span>
          <button
            onClick={geo.request}
            className="shrink-0 rounded-full bg-blue-400 px-3 py-1 font-medium text-black"
          >
            Activer
          </button>
        </div>
      )}

      {isLoading ? (
        <p className="px-4 py-10 text-center text-sm text-white/50">Chargement…</p>
      ) : (
        <ProfileGrid profiles={profiles ?? []} />
      )}
    </div>
  );
}
