import { IconVariantKey, ICON_VARIANTS } from "./iconVariant";

/** Renders inside next/og's ImageResponse (satori) — plain divs only. */
export function IconGlyph({ variant, size }: { variant: IconVariantKey; size: number }) {
  const v = ICON_VARIANTS[variant];

  if (variant === "notes") {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: v.bg,
        }}
      >
        <div
          style={{
            width: size * 0.62,
            height: size * 0.72,
            background: "#ffffff",
            borderRadius: size * 0.06,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: size * 0.06,
            padding: `0 ${size * 0.1}px`,
          }}
        >
          <div style={{ height: size * 0.045, background: v.accent, borderRadius: 999 }} />
          <div style={{ height: size * 0.045, background: v.accent, borderRadius: 999, width: "80%" }} />
          <div style={{ height: size * 0.045, background: v.accent, borderRadius: 999, width: "60%" }} />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: v.bg,
      }}
    >
      <div
        style={{
          width: size * 0.56,
          height: size * 0.56,
          borderRadius: 9999,
          background: v.accent,
        }}
      />
    </div>
  );
}
