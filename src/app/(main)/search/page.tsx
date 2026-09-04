"use client";

import { useState } from "react";
import TopBar from "@/components/TopBar";
import ProfileGrid from "@/components/ProfileGrid";
import { useSearchQuery } from "@/lib/queries";
import { SearchIcon } from "@/components/icons";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [onlineOnly, setOnlineOnly] = useState(false);
  const { data: results, isLoading } = useSearchQuery({ query, online: onlineOnly || undefined });

  return (
    <div className="mx-auto w-full max-w-5xl">
      <TopBar title="Rechercher" />
      <div className="px-4 py-3">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Chercher un pseudo…"
            autoFocus
            className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-400"
          />
        </div>
        <button
          onClick={() => setOnlineOnly((v) => !v)}
          className={`mt-2 rounded-full border px-3 py-1 text-xs font-medium transition ${
            onlineOnly
              ? "border-blue-400 bg-blue-400 text-black"
              : "border-white/15 text-white/70 hover:border-white/30"
          }`}
        >
          En ligne
        </button>
        <p className="mt-2 text-[11px] text-white/30">
          Le vrai endpoint (/v7/search) filtre par âge/taille/tribus/etc., pas par
          texte libre — la recherche par pseudo est une commodité de ce prototype.
        </p>
      </div>

      {query.trim() || onlineOnly ? (
        isLoading ? (
          <p className="px-4 py-10 text-center text-sm text-white/50">Recherche…</p>
        ) : (
          <ProfileGrid profiles={results ?? []} emptyLabel="Aucun résultat." />
        )
      ) : (
        <p className="px-4 py-10 text-center text-sm text-white/50">
          Tape un pseudo pour commencer.
        </p>
      )}
    </div>
  );
}
