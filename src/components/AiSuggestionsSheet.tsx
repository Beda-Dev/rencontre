"use client";

import { useEffect, useState } from "react";
import { CloseIcon, SparkleIcon } from "@/components/icons";
import { AI_TONES } from "@/lib/aiTypes";
import type { AiTone } from "@/lib/aiTypes";

interface Props {
  title: string;
  tone: AiTone;
  onToneChange: (tone: AiTone) => void;
  /** Re-run with the (possibly new) tone — called once on mount too. */
  onGenerate: (tone: AiTone) => Promise<string[]>;
  onPick: (text: string) => void;
  onClose: () => void;
}

export default function AiSuggestionsSheet({
  title,
  tone,
  onToneChange,
  onGenerate,
  onPick,
  onClose,
}: Props) {
  const [items, setItems] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function run(t: AiTone) {
    setLoading(true);
    setError(null);
    try {
      setItems(await onGenerate(t));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Intentional: fetches AI suggestions once on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    run(tone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleTone(t: AiTone) {
    onToneChange(t);
    run(t);
  }

  return (
    <div className="overlay-fade-in fixed inset-0 z-40 flex items-end bg-black/60">
      <div className="overlay-pop-in w-full rounded-t-2xl border-t border-white/10 bg-[#141416] px-4 pb-6 pt-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <SparkleIcon className="h-4 w-4 text-blue-400" />
            {title}
          </p>
          <button onClick={onClose} className="p-1 text-white/50 hover:text-white">
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-3 flex flex-wrap gap-1.5">
          {AI_TONES.map((t) => (
            <button
              key={t.value}
              onClick={() => handleTone(t.value)}
              disabled={loading}
              className={`rounded-full border px-2.5 py-1 text-xs transition disabled:opacity-40 ${
                tone === t.value
                  ? "border-blue-400 bg-blue-400/10 text-blue-400"
                  : "border-white/15 text-white/60 hover:border-white/30"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-11 animate-pulse rounded-lg bg-white/5" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="space-y-2">
            <p className="text-sm text-red-400">{error}</p>
            <button
              onClick={() => run(tone)}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-xs hover:border-white/30"
            >
              Réessayer
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-2">
            {(items ?? []).map((text, i) => (
              <button
                key={i}
                onClick={() => {
                  onPick(text);
                  onClose();
                }}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-left text-sm hover:border-blue-400/50 hover:bg-blue-400/5"
              >
                {text}
              </button>
            ))}
            <button
              onClick={() => run(tone)}
              className="w-full rounded-lg border border-white/10 py-2 text-xs text-white/50 hover:border-white/25 hover:text-white/80"
            >
              Régénérer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
