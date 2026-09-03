"use client";

import { useCallback, useEffect, useState } from "react";
import { encodeGeohash } from "./geo";

export type GeoStatus = "idle" | "prompting" | "granted" | "denied" | "unsupported" | "error";

export interface GeoState {
  status: GeoStatus;
  lat: number | null;
  lng: number | null;
  geohash: string | null;
  accuracy: number | null;
  updatedAt: number | null;
  error: string | null;
}

const STORAGE_KEY = "locatr.lastPosition";

function loadCached(): Partial<GeoState> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveCached(state: Partial<GeoState>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage unavailable — non-fatal
  }
}

/**
 * Wraps the browser Geolocation API and turns coordinates into the geohash
 * the documented cascade endpoint expects (nearbyGeohash query param).
 * Requests permission only when `request()` is called — never automatically.
 */
const EMPTY_STATE: GeoState = {
  status: "idle",
  lat: null,
  lng: null,
  geohash: null,
  accuracy: null,
  updatedAt: null,
  error: null,
};

export function useGeolocation() {
  // Deterministic default on both server and first client render — avoids a
  // hydration mismatch. The cached position (client-only) is applied after
  // mount, below.
  const [state, setState] = useState<GeoState>(EMPTY_STATE);

  const request = useCallback(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setState((s) => ({ ...s, status: "unsupported" }));
      return;
    }
    setState((s) => ({ ...s, status: "prompting", error: null }));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const next: GeoState = {
          status: "granted",
          lat: latitude,
          lng: longitude,
          geohash: encodeGeohash(latitude, longitude),
          accuracy,
          updatedAt: Date.now(),
          error: null,
        };
        setState(next);
        saveCached(next);
      },
      (err) => {
        setState((s) => ({
          ...s,
          status: err.code === err.PERMISSION_DENIED ? "denied" : "error",
          error: err.message,
        }));
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 }
    );
  }, []);

  // Load the last known position from cache after mount (client-only, so
  // this can't run during the shared server/client first render) — restores
  // it silently on a page refresh without triggering a permission prompt.
  useEffect(() => {
    const cached = loadCached();
    if (!cached?.geohash) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState((s) => ({
      ...s,
      status: "granted",
      lat: cached.lat ?? s.lat,
      lng: cached.lng ?? s.lng,
      geohash: cached.geohash ?? s.geohash,
      accuracy: cached.accuracy ?? s.accuracy,
      updatedAt: cached.updatedAt ?? s.updatedAt,
    }));
  }, []);

  return { ...state, request };
}
