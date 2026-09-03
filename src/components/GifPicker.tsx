"use client";

import { useState } from "react";
import Image from "next/image";
import { useGifsQuery } from "@/lib/queries";
import { Gif } from "@/lib/types";
import { SearchIcon } from "./icons";

export default function GifPicker({
  onPick,
  onClose,
}: {
  onPick: (gif: Gif) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const { data: gifs, isLoading } = useGifsQuery(query);

  return (
    <div className="absolute inset-x-0 bottom-full z-10 mb-2 rounded-xl border border-white/10 bg-[#141416] p-3 shadow-xl">
      <div className="mb-2 flex items-center justify-between">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Chercher un GIF…"
            className="w-full rounded-full border border-white/10 bg-white/5 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-amber-400"
          />
        </div>
        <button onClick={onClose} className="ml-2 text-xs text-white/40 hover:text-white">
          Fermer
        </button>
      </div>
      <div className="grid max-h-56 grid-cols-3 gap-2 overflow-y-auto">
        {isLoading ? (
          <p className="col-span-3 py-4 text-center text-xs text-white/40">Recherche…</p>
        ) : gifs && gifs.length > 0 ? (
          gifs.map((gif) => (
            <button
              key={gif.id}
              onClick={() => onPick(gif)}
              className="relative aspect-[4/3] overflow-hidden rounded-lg bg-white/5 hover:ring-2 hover:ring-amber-400"
            >
              <Image src={gif.previewUrl} alt={gif.id} fill unoptimized className="object-cover" />
            </button>
          ))
        ) : (
          <p className="col-span-3 py-4 text-center text-xs text-white/40">Aucun résultat.</p>
        )}
      </div>
    </div>
  );
}
