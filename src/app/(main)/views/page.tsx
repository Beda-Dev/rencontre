"use client";

import TopBar from "@/components/TopBar";
import ProfileGrid from "@/components/ProfileGrid";
import { useViewsQuery } from "@/lib/queries";

export default function ViewsPage() {
  const { data: views, isLoading } = useViewsQuery();

  return (
    <div className="mx-auto w-full max-w-5xl">
      <TopBar title="Qui a vu mon profil" />
      {isLoading ? (
        <p className="px-4 py-10 text-center text-sm text-white/50">Chargement…</p>
      ) : (
        <ProfileGrid
          profiles={views ?? []}
          emptyLabel="Personne n'a encore vu ton profil."
        />
      )}
    </div>
  );
}
