"use client";

import TopBar from "@/components/TopBar";
import DiscoverTabs from "@/components/DiscoverTabs";
import ProfileGrid from "@/components/ProfileGrid";
import { useDiscoverQuery } from "@/lib/queries";

export default function DiscoverPage() {
  const { data: sections, isLoading } = useDiscoverQuery();

  return (
    <div className="mx-auto w-full max-w-5xl">
      <TopBar title="Discover" />
      <DiscoverTabs />
      {isLoading ? (
        <p className="px-4 py-10 text-center text-sm text-white/50">Chargement…</p>
      ) : (
        (sections ?? []).map((section) => (
          <div key={section.id} className="pt-4">
            <h2 className="px-4 pb-2 text-sm font-semibold text-white/80">
              {section.title}
            </h2>
            <ProfileGrid profiles={section.profiles} emptyLabel="Rien pour le moment." />
          </div>
        ))
      )}
    </div>
  );
}
