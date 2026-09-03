"use client";

import TopBar from "@/components/TopBar";
import DiscoverTabs from "@/components/DiscoverTabs";
import ProfileGrid from "@/components/ProfileGrid";
import { useVipProfilesQuery } from "@/lib/queries";

export default function VipPage() {
  const { data: profiles, isLoading } = useVipProfilesQuery();

  return (
    <div className="mx-auto w-full max-w-5xl">
      <TopBar title="VIP" />
      <DiscoverTabs />
      <p className="px-4 pt-3 text-xs text-white/40">
        Profils qui t&apos;ont favorisé ou consulté récemment.
      </p>
      {isLoading ? (
        <p className="px-4 py-10 text-center text-sm text-white/50">Chargement…</p>
      ) : (
        <ProfileGrid profiles={profiles ?? []} />
      )}
    </div>
  );
}
