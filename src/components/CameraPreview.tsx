"use client";

import { useEffect, useRef } from "react";

export default function CameraPreview({
  stream,
  muted = true,
  mirrored = true,
  className,
}: {
  stream: MediaStream | null;
  muted?: boolean;
  mirrored?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);

  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted={muted}
      className={`${className ?? ""} ${mirrored ? "-scale-x-100" : ""}`}
    />
  );
}
