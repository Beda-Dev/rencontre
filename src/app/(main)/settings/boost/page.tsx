"use client";

import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import { BackIcon } from "@/components/icons";
import {
  useBoostStatusQuery,
  useStartBoostMutation,
  useTapStatsQuery,
} from "@/lib/queries";
import { BoostType } from "@/lib/types";

const BOOST_OPTIONS: { type: BoostType; label: string; desc: string }[] = [
  { type: "standard", label: "Boost", desc: "Remonte ton profil pendant 30 min" },
  { type: "super", label: "Super Boost", desc: "Visibilité renforcée sur une zone plus large" },
  { type: "mega", label: "Mega Boost", desc: "Visibilité maximale, portée étendue" },
];

function timeLeft(expiresAt: number | null): string {
  if (!expiresAt) return "";
  const ms = expiresAt - Date.now();
  if (ms <= 0) return "Terminé";
  return `${Math.round(ms / 60000)} min restantes`;
}

export default function BoostPage() {
  const router = useRouter();
  const { data: boost } = useBoostStatusQuery();
  const startBoost = useStartBoostMutation();
  const { data: taps } = useTapStatsQuery();

  return (
    <div className="mx-auto w-full max-w-lg">
      <TopBar
        title="Boost"
        right={
          <button onClick={() => router.back()} className="p-1">
            <BackIcon className="h-5 w-5" />
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 px-4 py-4">
        <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
          <p className="text-2xl font-semibold text-amber-400">{taps?.sent ?? 0}</p>
          <p className="text-xs text-white/50">Taps envoyés</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
          <p className="text-2xl font-semibold text-amber-400">{taps?.received ?? 0}</p>
          <p className="text-xs text-white/50">Taps reçus</p>
        </div>
      </div>

      {boost?.active && (
        <div className="mx-4 mb-4 rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-300">
          {BOOST_OPTIONS.find((o) => o.type === boost.type)?.label} actif —{" "}
          {timeLeft(boost.expiresAt)}
        </div>
      )}

      <div className="space-y-2 px-4 pb-8">
        {BOOST_OPTIONS.map((opt) => (
          <button
            key={opt.type}
            onClick={() => startBoost.mutate(opt.type)}
            disabled={startBoost.isPending || (boost?.active && boost.type === opt.type)}
            className="flex w-full items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 p-3 text-left hover:border-amber-400/40 disabled:opacity-50"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{opt.label}</span>
              <span className="block text-xs text-white/50">{opt.desc}</span>
            </span>
            <span className="shrink-0 rounded-full bg-amber-400 px-3 py-1 text-xs font-medium text-black">
              Activer
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
