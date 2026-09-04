import { ImageResponse } from "next/og";
import { cookies } from "next/headers";
import { ICON_VARIANT_COOKIE, isIconVariantKey } from "@/lib/iconVariant";
import { IconGlyph } from "@/lib/iconGlyph";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const store = await cookies();
  const raw = store.get(ICON_VARIANT_COOKIE)?.value;
  const variant = isIconVariantKey(raw) ? raw : "default";

  return new ImageResponse(<IconGlyph variant={variant} size={size.width} />, { ...size });
}
