import { ImageResponse } from "next/og";

export const dynamic = "force-static";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size } = await params;
  const px = Number(size) || 512;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0b0c",
        }}
      >
        <div
          style={{
            width: px * 0.56,
            height: px * 0.56,
            borderRadius: 9999,
            background: "#a78bfa",
          }}
        />
      </div>
    ),
    { width: px, height: px }
  );
}
