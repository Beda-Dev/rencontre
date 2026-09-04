"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import { BackIcon, ShieldIcon } from "@/components/icons";
import {
  AutoLockMode,
  disableLock,
  getAutoLockMode,
  hasWebAuthnCredential,
  isLockEnabled,
  registerWebAuthn,
  removeWebAuthn,
  setAutoLockMode,
  setPin,
  webAuthnSupported,
} from "@/lib/appLock";

const AUTOLOCK_OPTIONS: { value: AutoLockMode; label: string }[] = [
  { value: "immediate", label: "À chaque retour sur l'app" },
  { value: "1m", label: "Après 1 minute d'inactivité" },
  { value: "5m", label: "Après 5 minutes d'inactivité" },
  { value: "never", label: "Jamais (tant que l'onglet reste ouvert)" },
];

export default function SecuritySettingsPage() {
  const router = useRouter();
  const [enabled, setEnabled] = useState(false);
  const [hasDevice, setHasDevice] = useState(false);
  const [autoLock, setAutoLock] = useState<AutoLockMode>("immediate");
  const [pin1, setPin1] = useState("");
  const [pin2, setPin2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Intentional: reads localStorage, client-only.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnabled(isLockEnabled());
    setHasDevice(hasWebAuthnCredential());
    setAutoLock(getAutoLockMode());
  }, []);

  async function handleSetPin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (pin1.length < 4) {
      setError("Le code doit faire au moins 4 chiffres.");
      return;
    }
    if (pin1 !== pin2) {
      setError("Les deux codes ne correspondent pas.");
      return;
    }
    await setPin(pin1);
    setEnabled(true);
    setPin1("");
    setPin2("");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleRegisterDevice() {
    setError(null);
    const ok = await registerWebAuthn();
    if (ok) {
      setHasDevice(true);
      setEnabled(true);
    } else {
      setError("Impossible d'enregistrer le verrouillage de l'appareil.");
    }
  }

  function handleRemoveDevice() {
    removeWebAuthn();
    setHasDevice(false);
  }

  function handleDisable() {
    if (!window.confirm("Désactiver le verrouillage de l'app ?")) return;
    disableLock();
    setEnabled(false);
    setHasDevice(false);
  }

  function handleAutoLockChange(mode: AutoLockMode) {
    setAutoLock(mode);
    setAutoLockMode(mode);
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <TopBar
        title="Sécurité"
        right={
          <button onClick={() => router.back()} className="p-1">
            <BackIcon className="h-5 w-5" />
          </button>
        }
      />

      <div className="space-y-6 px-4 py-6">
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-3">
          <ShieldIcon className="h-5 w-5 shrink-0 text-blue-400" />
          <p className="text-sm">
            {enabled ? "Verrouillage activé sur cet appareil." : "Verrouillage désactivé."}
          </p>
        </div>

        <form onSubmit={handleSetPin} className="space-y-2">
          <h2 className="text-xs font-medium uppercase tracking-wide text-white/40">
            {enabled ? "Changer le code" : "Définir un code"}
          </h2>
          <input
            type="password"
            inputMode="numeric"
            value={pin1}
            onChange={(e) => setPin1(e.target.value)}
            placeholder="Nouveau code (4-6 chiffres)"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
          />
          <input
            type="password"
            inputMode="numeric"
            value={pin2}
            onChange={(e) => setPin2(e.target.value)}
            placeholder="Confirmer le code"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-400 py-2.5 text-sm font-semibold text-black hover:bg-blue-300"
          >
            {saved ? "Enregistré ✓" : "Enregistrer le code"}
          </button>
        </form>

        {webAuthnSupported() && (
          <div className="space-y-2">
            <h2 className="text-xs font-medium uppercase tracking-wide text-white/40">
              Déverrouillage de l&apos;appareil
            </h2>
            <p className="text-xs text-white/50">
              Utilise Face ID, Touch ID, Windows Hello ou le verrouillage d&apos;écran de
              ton appareil comme alternative au code — géré entièrement par ton
              appareil, jamais transmis nulle part.
            </p>
            {hasDevice ? (
              <button
                onClick={handleRemoveDevice}
                className="w-full rounded-lg border border-white/15 py-2.5 text-sm text-white/80 hover:border-white/30"
              >
                Désactiver le déverrouillage par appareil
              </button>
            ) : (
              <button
                onClick={handleRegisterDevice}
                className="w-full rounded-lg border border-blue-400/40 py-2.5 text-sm text-blue-300 hover:bg-blue-400/10"
              >
                Activer le déverrouillage par appareil
              </button>
            )}
          </div>
        )}

        {enabled && (
          <div className="space-y-2">
            <h2 className="text-xs font-medium uppercase tracking-wide text-white/40">
              Verrouiller automatiquement
            </h2>
            {AUTOLOCK_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleAutoLockChange(opt.value)}
                className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm ${
                  autoLock === opt.value
                    ? "border-blue-400 bg-blue-400/10 text-blue-300"
                    : "border-white/10 text-white/70 hover:border-white/25"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {enabled && (
          <button
            onClick={handleDisable}
            className="w-full rounded-lg border border-red-400/40 py-2.5 text-sm font-medium text-red-400 hover:bg-red-400/10"
          >
            Désactiver le verrouillage
          </button>
        )}
      </div>
    </div>
  );
}
