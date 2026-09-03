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
export function useGeolocation() {
  const [state, setState] = useState<GeoState>(() => {
    const cached = loadCached();
    return {
      status: "idle",
      lat: cached?.lat ?? null,
      lng: cached?.lng ?? null,
      geohash: cached?.geohash ?? null,
      accuracy: cached?.accuracy ?? null,
      updatedAt: cached?.updatedAt ?? null,
      error: null,
    };
  });

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

  // Auto-retry silently from cache on mount so a page refresh doesn't lose
  // the last known position; does not itself trigger a permission prompt.
  useEffect(() => {
    if (state.geohash) setState((s) => ({ ...s, status: "granted" }));
  }, [state.geohash]);

  return { ...state, request };
}
