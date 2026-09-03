"use client";

import { useGeolocation } from "./useGeolocation";
import { useRoamStatusQuery } from "./queries";

/**
 * The position the cascade should actually use: an active roam/travel
 * destination takes priority over the real GPS position, exactly like the
 * documented Roam feature (PUT /v1/roam/location) overrides live location
 * until cleared.
 */
export function useEffectiveLocation() {
  const geo = useGeolocation();
  const { data: roam } = useRoamStatusQuery();

  if (roam?.active && roam.place) {
    return {
      source: "roam" as const,
      lat: roam.place.lat,
      lng: roam.place.lng,
      geohash: roam.place.geohash,
      label: `${roam.place.name}, ${roam.place.region}`,
    };
  }

  if (geo.status === "granted" && geo.lat !== null && geo.lng !== null) {
    return {
      source: "gps" as const,
      lat: geo.lat,
      lng: geo.lng,
      geohash: geo.geohash,
      label: null,
    };
  }

  return { source: "none" as const, lat: null, lng: null, geohash: null, label: null };
}
