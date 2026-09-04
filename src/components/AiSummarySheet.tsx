"use client";

import { CloseIcon, SparkleIcon } from "@/components/icons";

interface Props {
  loading: boolean;
  error: string | null;
  summary: string | null;
  facts: string[];
  onClose: () => void;
}

export default function AiSummarySheet({ loading, error, summary, facts, onClose }: Props) {
  return (
    <div className="overlay-fade-in fixed inset-0 z-40 flex items-end bg-black/60">
      <div className="overlay-pop-in w-full rounded-t-2xl border-t border-white/10 bg-[#141416] px-4 pb-6 pt-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <SparkleIcon className="h-4 w-4 text-blue-400" />
            Résumé de la conversation
          </p>
          <button onClick={onClose} className="p-1 text-white/50 hover:text-white">
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        {loading && (
          <div className="space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-white/5" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-white/5" />
          </div>
        )}

        {!loading && error && <p className="text-sm text-red-400">{error}</p>}

        {!loading && !error && (
          <div className="space-y-3">
            <p className="text-sm text-white/80">{summary}</p>
            {facts.length > 0 && (
              <div className="space-y-1.5">
                {facts.map((f, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70"
                  >
                    {f}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
