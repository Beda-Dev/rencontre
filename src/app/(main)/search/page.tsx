"use client";

import { FormEvent, useState } from "react";
import TopBar from "@/components/TopBar";
import ProfileGrid from "@/components/ProfileGrid";
import { useSearchQuery } from "@/lib/queries";
import { ai } from "@/lib/ai";
import { getAiSettings } from "@/lib/aiSettings";
import { SearchIcon, SparkleIcon } from "@/components/icons";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [ageMin, setAgeMin] = useState<number | undefined>(undefined);
  const [ageMax, setAgeMax] = useState<number | undefined>(undefined);
  const [aiQuery, setAiQuery] = useState("");
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const aiSettings = getAiSettings();
  const { data: results, isLoading } = useSearchQuery({
    query,
    online: onlineOnly || undefined,
    ageMin,
    ageMax,
  });

  async function handleAiSearch(e: FormEvent) {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await ai.naturalSearch(aiQuery.trim());
      setQuery(res.query ?? "");
      setOnlineOnly(!!res.online);
      setAgeMin(res.ageMin ?? undefined);
      setAgeMax(res.ageMax ?? undefined);
      setAiExplanation(res.explanation);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <TopBar title="Rechercher" />

      {aiSettings.enabled && aiSettings.naturalSearch && (
        <form onSubmit={handleAiSearch} className="px-4 pt-3">
          <div className="relative">
            <SparkleIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-400" />
            <input
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              placeholder="Décris ce que tu cherches… ex : la vingtaine, en ligne"
              className="w-full rounded-lg border border-blue-400/30 bg-blue-400/5 py-2.5 pl-9 pr-16 text-sm outline-none focus:border-blue-400"
            />
            <button
              type="submit"
              disabled={aiLoading || !aiQuery.trim()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-blue-400 px-2.5 py-1 text-xs font-medium text-black disabled:opacity-40"
            >
              {aiLoading ? "…" : "Appliquer"}
            </button>
          </div>
          {aiError && <p className="mt-1.5 text-xs text-red-400">{aiError}</p>}
          {aiExplanation && !aiError && (
            <p className="mt-1.5 text-xs text-blue-300/80">✨ {aiExplanation}</p>
          )}
        </form>
      )}

      <div className="px-4 py-3">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Chercher un pseudo…"
            className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-400"
          />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setOnlineOnly((v) => !v)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              onlineOnly
                ? "border-blue-400 bg-blue-400 text-black"
                : "border-white/15 text-white/70 hover:border-white/30"
            }`}
          >
            En ligne
          </button>
          {(ageMin !== undefined || ageMax !== undefined) && (
            <button
              onClick={() => {
                setAgeMin(undefined);
                setAgeMax(undefined);
              }}
              className="rounded-full border border-blue-400 bg-blue-400/10 px-3 py-1 text-xs font-medium text-blue-400"
            >
              {ageMin ?? "18"}–{ageMax ?? "99"} ans ✕
            </button>
          )}
        </div>
        <p className="mt-2 text-[11px] text-white/30">
          Le vrai endpoint (/v7/search) filtre par âge/taille/tribus/etc., pas par
          texte libre — la recherche par pseudo est une commodité de ce prototype.
        </p>
      </div>

      {query.trim() || onlineOnly || ageMin !== undefined || ageMax !== undefined ? (
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
