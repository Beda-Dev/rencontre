"use client";

import { usePhrasesQuery } from "@/lib/queries";

export default function PhrasesBar({ onPick }: { onPick: (text: string) => void }) {
  const { data: phrases } = usePhrasesQuery();
  if (!phrases || phrases.length === 0) return null;

  return (
    <div className="scrollbar-none flex gap-1.5 overflow-x-auto border-t border-white/5 bg-[#141416] px-2 py-2">
      {phrases.map((p) => (
        <button
          key={p.id}
          onClick={() => onPick(p.text)}
          className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 hover:border-white/25"
        >
          {p.text}
        </button>
      ))}
    </div>
  );
}
