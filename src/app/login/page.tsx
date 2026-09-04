"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { AppConfig, getConfig, setConfig } from "@/lib/config";
import { GoogleIcon, PinFlameLogo, PlugIcon } from "@/components/icons";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("demo@example.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfigState] = useState<AppConfig | null>(null);

  useEffect(() => {
    // Intentional: reads localStorage, so this must run client-only.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConfigState(getConfig());
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.login(email, password);
      router.push("/");
    } catch {
      setError("Connexion impossible. Vérifie tes identifiants ou ta config API.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    setError(null);
    try {
      await api.loginWithGoogle();
      router.push("/");
    } catch {
      setError("Connexion Google impossible. Branche ton backend OAuth pour l'activer.");
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <PinFlameLogo className="h-14 w-14 text-amber-400" />
      <h1 className="mt-3 text-2xl font-semibold tracking-wide">Locatr</h1>
      <p className="mt-1 text-sm text-white/50">
        {config &&
          (config.useMock
            ? "Mode démo — données factices, aucun réseau réel."
            : `Connecté à ${config.apiBaseUrl || "(base URL non configurée)"}`)}
      </p>
      <div className="mt-1.5 flex items-center gap-3 text-xs">
        <Link
          href="/settings/connection"
          className="flex items-center gap-1 text-white/40 underline hover:text-white/70"
        >
          <PlugIcon className="h-3 w-3" />
          Configurer la connexion API
        </Link>
        {config && !config.useMock && (
          <button
            onClick={() => setConfigState(setConfig({ useMock: true }))}
            className="text-amber-400 underline hover:text-amber-300"
          >
            Repasser en mode démo
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-8 w-full max-w-sm space-y-3">
        <div>
          <label className="mb-1 block text-xs text-white/60">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-amber-400"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/60">Mot de passe</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-amber-400"
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-amber-400 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-300 disabled:opacity-60"
        >
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>

      <div className="mt-4 flex w-full max-w-sm items-center gap-3 text-xs text-white/30">
        <div className="h-px flex-1 bg-white/10" />
        ou
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <button
        onClick={handleGoogle}
        disabled={googleLoading}
        className="mt-4 flex w-full max-w-sm items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 py-2.5 text-sm font-medium text-white/90 transition hover:border-white/30 disabled:opacity-60"
      >
        <GoogleIcon className="h-4 w-4" />
        {googleLoading ? "Connexion…" : "Continuer avec Google"}
      </button>
      <p className="mt-2 max-w-sm text-center text-[11px] text-white/30">
        Stub : à brancher sur ton propre backend OAuth (flow tiers documenté,
        vendor Google).
      </p>
    </div>
  );
}
