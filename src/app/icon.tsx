import { ImageResponse } from "next/og";

export const size = { width: 48, height: 48 };
export const contentType = "image/png";

export default function Icon() {
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
            width: 26,
            height: 26,
            borderRadius: 9999,
            background: "#f5a623",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
