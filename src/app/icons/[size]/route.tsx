import { ImageResponse } from "next/og";
import { cookies } from "next/headers";
import { ICON_VARIANT_COOKIE, isIconVariantKey } from "@/lib/iconVariant";
import { IconGlyph } from "@/lib/iconGlyph";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size } = await params;
  const px = Number(size) || 512;

  // ?variant= lets settings/appearance preview a variant without switching
  // it; otherwise this falls back to the cookie used by the real manifest.
  const url = new URL(_req.url);
  const requested = url.searchParams.get("variant") ?? undefined;
  let variant = isIconVariantKey(requested) ? requested : undefined;
  if (!variant) {
    const store = await cookies();
    const raw = store.get(ICON_VARIANT_COOKIE)?.value;
    variant = isIconVariantKey(raw) ? raw : "default";
  }

  return new ImageResponse(<IconGlyph variant={variant} size={px} />, {
    width: px,
    height: px,
  });
}
