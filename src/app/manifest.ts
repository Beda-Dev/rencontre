import type { MetadataRoute } from "next";
import { cookies } from "next/headers";
import { ICON_VARIANT_COOKIE, ICON_VARIANTS, isIconVariantKey } from "@/lib/iconVariant";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const store = await cookies();
  const raw = store.get(ICON_VARIANT_COOKIE)?.value;
  const key = isIconVariantKey(raw) ? raw : "default";
  const v = ICON_VARIANTS[key];

  return {
    name: key === "default" ? "Meets — prototype (données factices)" : v.appName,
    short_name: v.shortName,
    description:
      key === "default"
        ? "Prototype d'interface style app de rencontre — données factices"
        : v.appName,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: v.bg,
    theme_color: v.bg,
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
