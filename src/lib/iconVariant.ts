// The chosen "discreet icon" variant, stored in a cookie (not localStorage)
// specifically so the server-rendered icon/manifest files below can read it
// — a PWA's home-screen icon is fetched by the browser at "Add to Home
// Screen" time, so this only takes effect after removing and re-adding the
// icon; there's no way to change an already-installed icon remotely.

export const ICON_VARIANT_COOKIE = "meets.iconVariant";

export const ICON_VARIANTS = {
  default: { appName: "Meets", shortName: "Meets", bg: "#0b0b0c", accent: "#60a5fa" },
  notes: { appName: "Notes", shortName: "Notes", bg: "#fef3c7", accent: "#f59e0b" },
} as const;

export type IconVariantKey = keyof typeof ICON_VARIANTS;

export function isIconVariantKey(v: string | undefined): v is IconVariantKey {
  return !!v && v in ICON_VARIANTS;
}

export function getIconVariant(): IconVariantKey {
  if (typeof document === "undefined") return "default";
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${ICON_VARIANT_COOKIE}=([^;]*)`)
  );
  const raw = match ? decodeURIComponent(match[1]) : undefined;
  return isIconVariantKey(raw) ? raw : "default";
}

export function setIconVariant(key: IconVariantKey) {
  if (typeof document === "undefined") return;
  // 1 year, readable by the server-rendered icon/manifest routes above.
  document.cookie = `${ICON_VARIANT_COOKIE}=${key}; path=/; max-age=31536000; SameSite=Lax`;
}
