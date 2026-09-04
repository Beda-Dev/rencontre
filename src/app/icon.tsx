import { ImageResponse } from "next/og";
import { cookies } from "next/headers";
import { ICON_VARIANT_COOKIE, isIconVariantKey } from "@/lib/iconVariant";
import { IconGlyph } from "@/lib/iconGlyph";

export const size = { width: 48, height: 48 };
export const contentType = "image/png";

export default async function Icon() {
  const store = await cookies();
  const raw = store.get(ICON_VARIANT_COOKIE)?.value;
  const variant = isIconVariantKey(raw) ? raw : "default";

  return new ImageResponse(<IconGlyph variant={variant} size={size.width} />, { ...size });
}
