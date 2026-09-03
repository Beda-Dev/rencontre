// Mock/real-API switch. Defaults come from .env.local (NEXT_PUBLIC_USE_MOCK,
// NEXT_PUBLIC_API_BASE_URL) but can be overridden at runtime from
// /settings/connection — the override lives in localStorage so it survives
// reloads without needing a rebuild.
//
// NEXT_PUBLIC_API_BASE_URL should point at *your own* backend/proxy — this
// app never talks to any third-party service directly.

export interface AppConfig {
  useMock: boolean;
  apiBaseUrl: string;
}

const STORAGE_KEY = "locatr.config";

function defaults(): AppConfig {
  return {
    useMock: process.env.NEXT_PUBLIC_USE_MOCK !== "false",
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
  };
}

export function getConfig(): AppConfig {
  if (typeof window === "undefined") return defaults();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults();
    return { ...defaults(), ...JSON.parse(raw) };
  } catch {
    return defaults();
  }
}

export function setConfig(patch: Partial<AppConfig>): AppConfig {
  const next = { ...getConfig(), ...patch };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}

export function resetConfig(): AppConfig {
  if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
  return defaults();
}

export function hasOverride(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) !== null;
}
