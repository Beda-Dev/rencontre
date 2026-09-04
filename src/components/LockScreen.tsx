"use client";

import { useState } from "react";
import {
  disableLock,
  hasWebAuthnCredential,
  markUnlocked,
  verifyPin,
  verifyWebAuthn,
  webAuthnSupported,
} from "@/lib/appLock";
import { LockIcon, PinFlameLogo } from "@/components/icons";

export default function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const canUseDevice = webAuthnSupported() && hasWebAuthnCredential();

  async function handlePinSubmit(e: React.FormEvent) {
    e.preventDefault();
    setChecking(true);
    setError(null);
    const ok = await verifyPin(pin);
    setChecking(false);
    if (ok) {
      markUnlocked();
      onUnlock();
    } else {
      setError("Code incorrect.");
      setPin("");
    }
  }

  function handleForgot() {
    if (
      !window.confirm(
        "Réinitialiser le verrouillage ? Le code et la biométrie enregistrés sur cet appareil seront supprimés — tes données de compte (mock ou backend) ne sont pas affectées."
      )
    )
      return;
    disableLock();
    onUnlock();
  }

  async function handleDeviceUnlock() {
    setChecking(true);
    setError(null);
    const ok = await verifyWebAuthn();
    setChecking(false);
    if (ok) {
      markUnlocked();
      onUnlock();
    } else {
      setError("Déverrouillage annulé ou échoué.");
    }
  }

  return (
    <div className="fixed inset-0 z-100 flex flex-col items-center justify-center bg-[#0b0b0c] px-6">
      <PinFlameLogo className="h-12 w-12 text-blue-400" />
      <LockIcon className="mt-4 h-8 w-8 text-white/40" />
      <h1 className="mt-3 text-lg font-medium">App verrouillée</h1>

      <form onSubmit={handlePinSubmit} className="mt-6 w-full max-w-xs space-y-3">
        <input
          type="password"
          inputMode="numeric"
          autoFocus
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="Code"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-center text-lg tracking-[0.3em] outline-none focus:border-blue-400"
        />
        {error && <p className="text-center text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={checking || !pin}
          className="w-full rounded-lg bg-blue-400 py-2.5 text-sm font-semibold text-black disabled:opacity-50"
        >
          Déverrouiller
        </button>
      </form>

      {canUseDevice && (
        <button
          onClick={handleDeviceUnlock}
          disabled={checking}
          className="mt-4 text-sm text-white/60 underline hover:text-white/90"
        >
          Utiliser le verrouillage de l&apos;appareil
        </button>
      )}

      <button
        onClick={handleForgot}
        className="mt-2 text-xs text-white/30 underline hover:text-white/60"
      >
        Code oublié ?
      </button>
    </div>
  );
}
