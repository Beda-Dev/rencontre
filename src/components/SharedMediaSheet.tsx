"use client";

import Image from "next/image";
import { useSharedMediaQuery } from "@/lib/queries";
import { CloseIcon } from "./icons";

export default function SharedMediaSheet({
  profileId,
  onClose,
  onOpenImage,
}: {
  profileId: string;
  onClose: () => void;
  onOpenImage: (index: number) => void;
}) {
  const { data: images, isLoading } = useSharedMediaQuery(profileId);

  return (
    <div className="overlay-fade-in fixed inset-0 z-50 flex flex-col bg-black/90">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-sm font-medium">Médias partagés</h2>
        <button onClick={onClose} className="rounded-full bg-white/10 p-2">
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {isLoading ? (
          <p className="py-10 text-center text-sm text-white/50">Chargement…</p>
        ) : !images || images.length === 0 ? (
          <p className="py-10 text-center text-sm text-white/50">
            Aucune photo échangée pour le moment.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            {images.map((url, i) => (
              <button
                key={i}
                onClick={() => onOpenImage(i)}
                className="relative aspect-square overflow-hidden rounded-lg bg-white/5"
              >
                <Image src={url} alt={`Média ${i + 1}`} fill unoptimized className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
