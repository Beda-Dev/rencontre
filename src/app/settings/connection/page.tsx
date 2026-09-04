"use client";

// Deliberately NOT under (main) — that group requires being authenticated,
// which creates a dead end: switch to the real API without a working
// backend yet, fail to log in, and there'd be no way back in to revert.
// This page must stay reachable whether or not you're logged in.

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import { BackIcon } from "@/components/icons";
import { api } from "@/lib/api";
import { AppConfig, getConfig, hasOverride, resetConfig, setConfig } from "@/lib/config";

export default function ConnectionSettingsPage() {
  const router = useRouter();
  const [form, setForm] = useState<AppConfig | null>(null);
  const [overridden, setOverridden] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Intentional: reads localStorage, so this must run client-only.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm(getConfig());
    setOverridden(hasOverride());
  }, []);

  function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setConfig(form);
    setOverridden(true);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleReset() {
    const defaults = resetConfig();
    setForm(defaults);
    setOverridden(false);
  }

  function handleBack() {
    if (window.history.length > 1) router.back();
    else router.push(api.isAuthenticated() ? "/settings" : "/login");
  }

  if (!form) {
    return <p className="px-4 py-10 text-center text-sm text-white/50">Chargement…</p>;
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <TopBar
        title="Connexion API"
        right={
          <button onClick={handleBack} className="p-1">
            <BackIcon className="h-5 w-5" />
          </button>
        }
      />

      <form onSubmit={handleSave} className="space-y-4 px-4 py-6">
        <div className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-3">
          <div>
            <p className="text-sm font-medium">Utiliser les données mock</p>
            <p className="mt-0.5 text-xs text-white/50">
              Désactive pour appeler ton backend à l&apos;adresse ci-dessous.
            </p>
          </div>
          <input
            type="checkbox"
            checked={form.useMock}
            onChange={(e) => setForm({ ...form, useMock: e.target.checked })}
            className="h-5 w-5 shrink-0 accent-amber-400"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-white/60">
            URL de base de l&apos;API (ton backend)
          </label>
          <input
            type="url"
            placeholder="https://mon-backend.example.com/api"
            value={form.apiBaseUrl}
            disabled={form.useMock}
            onChange={(e) => setForm({ ...form, apiBaseUrl: e.target.value })}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-amber-400 disabled:opacity-40"
          />
          <p className="mt-1.5 text-xs text-white/40">
            Doit pointer vers ton propre serveur/proxy — jamais directement vers une
            API tierce privée depuis le navigateur.
          </p>
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-amber-400 py-2.5 text-sm font-semibold text-black hover:bg-amber-300"
        >
          {saved ? "Enregistré ✓" : "Enregistrer"}
        </button>

        {overridden && (
          <button
            type="button"
            onClick={handleReset}
            className="w-full rounded-lg border border-white/15 py-2.5 text-sm text-white/70 hover:border-white/30"
          >
            Réinitialiser (revenir aux valeurs de .env.local)
          </button>
        )}
      </form>

      <div className="mx-4 rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-white/50">
        <p>
          Ce réglage est stocké localement dans ce navigateur (localStorage) et
          prend le pas sur <code className="text-white/70">NEXT_PUBLIC_USE_MOCK</code>{" "}
          / <code className="text-white/70">NEXT_PUBLIC_API_BASE_URL</code> définis
          dans <code className="text-white/70">.env.local</code>.
        </p>
      </div>

      <Link
        href="/login"
        className="mx-4 mt-4 block text-center text-xs text-white/40 underline hover:text-white/70"
      >
        Retour à la connexion
      </Link>
    </div>
  );
}
