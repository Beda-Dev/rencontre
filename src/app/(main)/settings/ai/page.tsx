"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import { BackIcon, SparkleIcon } from "@/components/icons";
import { AI_TONES } from "@/lib/aiTypes";
import { AiSettings, DEFAULT_AI_SETTINGS, getAiSettings, setAiSettings } from "@/lib/aiSettings";
import { aiConfigured } from "@/lib/ai";

const FEATURES: { key: keyof AiSettings; label: string; hint: string }[] = [
  {
    key: "replySuggestions",
    label: "Suggestions de réponse",
    hint: "Propose 3 réponses dans le chat, accessibles via l'icône ✨.",
  },
  {
    key: "icebreaker",
    label: "Premier message personnalisé",
    hint: "Suggère une accroche basée sur le profil quand la conversation est vide.",
  },
  {
    key: "scamCheck",
    label: "Détection d'arnaque",
    hint: "Analyse une conversation à la demande (menu du chat).",
  },
  {
    key: "autoScamCheck",
    label: "… et l'exécuter automatiquement",
    hint: "Analyse chaque conversation dès son ouverture, sans action de ta part.",
  },
  {
    key: "conversationSummary",
    label: "Résumé de conversation",
    hint: "Résume un thread long depuis le menu du chat.",
  },
  {
    key: "bioAssistant",
    label: "Assistant de bio",
    hint: "Réécrit ta bio dans les réglages du profil.",
  },
  {
    key: "naturalSearch",
    label: "Recherche en langage naturel",
    hint: "Comprend une phrase libre dans la recherche et la convertit en filtres.",
  },
  {
    key: "profileSummary",
    label: "Résumé de profil",
    hint: "Condense un profil visité et vos points communs.",
  },
];

export default function AiSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<AiSettings>(DEFAULT_AI_SETTINGS);
  const [serverReady, setServerReady] = useState<boolean | null>(null);

  useEffect(() => {
    // Intentional: reads localStorage, client-only.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSettings(getAiSettings());
    aiConfigured().then(setServerReady);
  }, []);

  function patch(p: Partial<AiSettings>) {
    setSettings(setAiSettings(p));
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <TopBar
        title="Assistant IA"
        right={
          <button onClick={() => router.back()} className="p-1">
            <BackIcon className="h-5 w-5" />
          </button>
        }
      />

      <div className="space-y-6 px-4 py-6">
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-3">
          <SparkleIcon className="h-5 w-5 shrink-0 text-blue-400" />
          <p className="text-sm text-white/70">
            Ces fonctionnalités utilisent Gemini via un serveur intermédiaire — ta bio et tes
            messages ne sont jamais envoyés à Grindr, uniquement à ce moteur d&apos;IA.
          </p>
        </div>

        {serverReady === false && (
          <div className="rounded-lg border border-yellow-400/30 bg-yellow-400/5 p-3">
            <p className="text-xs leading-relaxed text-yellow-200/80">
              Aucune clé Gemini n&apos;est configurée sur ce serveur : les fonctionnalités
              restent activables ici mais ne répondront pas tant que
              <code className="mx-1 rounded bg-black/30 px-1 py-0.5">GEMINI_API_KEY_1</code>
              (au moins) n&apos;est pas défini côté serveur.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2.5">
          <div className="min-w-0">
            <p className="text-sm font-medium">Activer l&apos;IA</p>
            <p className="text-xs text-white/50">Coupe toutes les fonctionnalités ci-dessous.</p>
          </div>
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => patch({ enabled: e.target.checked })}
            className="h-4 w-4 shrink-0 accent-blue-400"
          />
        </div>

        <div className={`space-y-2 ${settings.enabled ? "" : "pointer-events-none opacity-40"}`}>
          <h2 className="text-xs font-medium uppercase tracking-wide text-white/40">
            Fonctionnalités
          </h2>
          {FEATURES.map((f) => (
            <div
              key={f.key}
              className={`flex items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2.5 ${
                f.key === "autoScamCheck" ? "ml-4" : ""
              }`}
            >
              <div className="min-w-0">
                <p className="text-sm">{f.label}</p>
                <p className="text-xs text-white/50">{f.hint}</p>
              </div>
              <input
                type="checkbox"
                checked={Boolean(settings[f.key])}
                disabled={f.key === "autoScamCheck" && !settings.scamCheck}
                onChange={(e) => patch({ [f.key]: e.target.checked } as Partial<AiSettings>)}
                className="h-4 w-4 shrink-0 accent-blue-400 disabled:opacity-30"
              />
            </div>
          ))}
        </div>

        <div className={`space-y-2 ${settings.enabled ? "" : "pointer-events-none opacity-40"}`}>
          <h2 className="text-xs font-medium uppercase tracking-wide text-white/40">
            Ton par défaut
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {AI_TONES.map((t) => (
              <button
                key={t.value}
                onClick={() => patch({ tone: t.value })}
                className={`rounded-full border px-3 py-1.5 text-xs transition ${
                  settings.tone === t.value
                    ? "border-blue-400 bg-blue-400/10 text-blue-400"
                    : "border-white/15 text-white/60 hover:border-white/30"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className={`space-y-2 ${settings.enabled ? "" : "pointer-events-none opacity-40"}`}>
          <h2 className="text-xs font-medium uppercase tracking-wide text-white/40">
            Mon style d&apos;écriture
          </h2>
          <p className="text-xs text-white/50">
            Décris comment tu parles, pour que les suggestions te ressemblent davantage.
          </p>
          <textarea
            rows={3}
            value={settings.customStyle}
            onChange={(e) => patch({ customStyle: e.target.value })}
            placeholder="Ex. : je tutoie tout de suite, je fais des phrases courtes, j'utilise peu de ponctuation, jamais d'emoji…"
            className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
          />
        </div>
      </div>
    </div>
  );
}
