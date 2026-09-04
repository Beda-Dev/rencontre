"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import TopBar from "@/components/TopBar";
import { BackIcon, PinIcon, SearchIcon } from "@/components/icons";
import { useGeolocation } from "@/lib/useGeolocation";
import { useUpdateLocationMutation } from "@/lib/queries";
import {
  useNeighborhoodQuery,
  usePlacesSearchQuery,
  useRoamStatusQuery,
  useSetRoamMutation,
} from "@/lib/queries";
import { Place } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  idle: "Position non demandée",
  prompting: "Demande en cours…",
  granted: "Position active",
  denied: "Position refusée",
  unsupported: "Géolocalisation non supportée par ce navigateur",
  error: "Erreur de géolocalisation",
};

export default function LocationSettingsPage() {
  const router = useRouter();
  const geo = useGeolocation();
  const updateLocation = useUpdateLocationMutation();
  const { data: roam } = useRoamStatusQuery();
  const setRoam = useSetRoamMutation();
  const [query, setQuery] = useState("");
  const { data: places, isLoading: searching } = usePlacesSearchQuery(query);
  const { data: neighborhood } = useNeighborhoodQuery(geo.geohash);

  async function handleRequest() {
    geo.request();
  }

  async function handleSelectPlace(place: Place) {
    await setRoam.mutateAsync(place);
  }

  async function handleStopRoam() {
    await setRoam.mutateAsync(null);
  }

  async function handleSyncLocation() {
    if (geo.geohash) await updateLocation.mutateAsync(geo.geohash);
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <TopBar
        title="Localisation"
        right={
          <button onClick={() => router.back()} className="p-1">
            <BackIcon className="h-5 w-5" />
          </button>
        }
      />

      <div className="px-4 py-4">
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-2">
            <PinIcon className="h-5 w-5 text-amber-400" />
            <p className="text-sm font-medium">{STATUS_LABEL[geo.status]}</p>
          </div>

          {geo.geohash && (
            <div className="mt-3 space-y-1 text-xs text-white/60">
              <p>Geohash : <span className="text-white/80">{geo.geohash}</span></p>
              <p>
                Coordonnées : {geo.lat?.toFixed(4)}, {geo.lng?.toFixed(4)}
                {geo.accuracy ? ` (±${Math.round(geo.accuracy)} m)` : ""}
              </p>
              {neighborhood && <p>Zone : {neighborhood}</p>}
            </div>
          )}

          {geo.error && <p className="mt-2 text-xs text-red-400">{geo.error}</p>}

          <div className="mt-4 flex gap-2">
            <button
              onClick={handleRequest}
              disabled={geo.status === "prompting"}
              className="flex-1 rounded-lg bg-amber-400 py-2 text-sm font-medium text-black disabled:opacity-60"
            >
              {geo.status === "granted" ? "Actualiser" : "Activer ma position"}
            </button>
            {geo.geohash && (
              <button
                onClick={handleSyncLocation}
                disabled={updateLocation.isPending}
                className="flex-1 rounded-lg border border-white/15 py-2 text-sm text-white/80 hover:border-white/30 disabled:opacity-60"
              >
                Synchroniser
              </button>
            )}
          </div>
          <p className="mt-2 text-[11px] text-white/40">
            &laquo;&nbsp;Synchroniser&nbsp;&raquo; envoie ta position à ton backend (PUT
            /v4/location). Rien n&apos;est envoyé automatiquement.
          </p>
        </div>

        {roam?.active && roam.place && (
          <div className="mt-4 rounded-lg border border-amber-400/30 bg-amber-400/10 p-4">
            <p className="text-sm font-medium text-amber-300">
              📍 En roaming à {roam.place.name}, {roam.place.region}
            </p>
            <p className="mt-1 text-xs text-white/50">
              La grille utilise cette position à la place de ta position réelle.
            </p>
            <button
              onClick={handleStopRoam}
              disabled={setRoam.isPending}
              className="mt-3 w-full rounded-lg border border-white/15 py-2 text-sm text-white/80 hover:border-white/30"
            >
              Arrêter le roaming
            </button>
          </div>
        )}

        <div className="mt-4">
          <label className="mb-1 block text-xs text-white/40">
            Voyager (Roam) vers une autre ville
          </label>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Chercher une ville…"
              className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-amber-400"
            />
          </div>

          <div className="mt-2 divide-y divide-white/5 rounded-lg border border-white/10">
            {searching ? (
              <p className="px-3 py-3 text-sm text-white/40">Recherche…</p>
            ) : places && places.length > 0 ? (
              places.map((place) => (
                <button
                  key={place.placeId}
                  onClick={() => handleSelectPlace(place)}
                  disabled={setRoam.isPending}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm hover:bg-white/5"
                >
                  <span className="min-w-0 flex-1 truncate">
                    {place.name}
                    <span className="ml-1 text-xs text-white/40">{place.region}</span>
                  </span>
                  {roam?.place?.placeId === place.placeId && (
                    <span className="shrink-0 text-xs text-amber-400">Actif</span>
                  )}
                </button>
              ))
            ) : (
              <p className="px-3 py-3 text-sm text-white/40">Aucun résultat.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
