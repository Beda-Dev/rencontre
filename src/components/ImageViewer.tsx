"use client";

import { useEffect } from "react";
import Image from "next/image";
import { BackIcon, CloseIcon } from "./icons";

export default function ImageViewer({
  urls,
  index,
  onIndexChange,
  onClose,
}: {
  urls: string[];
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndexChange((index + 1) % urls.length);
      if (e.key === "ArrowLeft") onIndexChange((index - 1 + urls.length) % urls.length);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, urls.length, onIndexChange, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95">
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-xs text-white/60">
          {index + 1} / {urls.length}
        </span>
        <button onClick={onClose} className="rounded-full bg-white/10 p-2">
          <CloseIcon className="h-4 w-4 text-white" />
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center px-4 pb-4">
        <div className="relative h-full w-full max-w-lg">
          <Image
            src={urls[index]}
            alt={`Photo ${index + 1}`}
            fill
            unoptimized
            className="object-contain"
          />
        </div>

        {urls.length > 1 && (
          <>
            <button
              onClick={() => onIndexChange((index - 1 + urls.length) % urls.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2"
            >
              <BackIcon className="h-5 w-5 text-white" />
            </button>
            <button
              onClick={() => onIndexChange((index + 1) % urls.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 rotate-180"
            >
              <BackIcon className="h-5 w-5 text-white" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
