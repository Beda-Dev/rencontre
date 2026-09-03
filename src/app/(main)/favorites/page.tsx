"use client";

import TopBar from "@/components/TopBar";
import ProfileGrid from "@/components/ProfileGrid";
import { useCascadeQuery } from "@/lib/queries";

export default function FavoritesPage() {
  const { data: profiles, isLoading } = useCascadeQuery({ favorite: true });

  return (
    <div className="mx-auto w-full max-w-5xl">
      <TopBar title="Favoris" />
      {isLoading ? (
        <p className="px-4 py-10 text-center text-sm text-white/50">Chargement…</p>
      ) : (
        <ProfileGrid profiles={profiles ?? []} emptyLabel="Aucun favori pour le moment." />
      )}
    </div>
  );
}
