"use client";

import TopBar from "@/components/TopBar";
import DiscoverTabs from "@/components/DiscoverTabs";
import ProfileGrid from "@/components/ProfileGrid";
import { useAlistQuery } from "@/lib/queries";

export default function AlistPage() {
  const { data: profiles, isLoading } = useAlistQuery();

  return (
    <div className="mx-auto w-full max-w-5xl">
      <TopBar title="A-List" />
      <DiscoverTabs />
      <p className="px-4 pt-3 text-xs text-white/40">
        Recommandations basées sur tes affinités.
      </p>
      {isLoading ? (
        <p className="px-4 py-10 text-center text-sm text-white/50">Chargement…</p>
      ) : (
        <ProfileGrid profiles={profiles ?? []} />
      )}
    </div>
  );
}
