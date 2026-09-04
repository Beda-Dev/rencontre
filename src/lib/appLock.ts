"use client";

// Local app lock — a PIN and/or the device's own biometric/PIN system
// (via WebAuthn platform authenticator: Face ID / Touch ID / Windows Hello
// / Android screen lock), gating access to the app itself. Everything here
// is 100% local: no server, no account involved. WebAuthn here is used as a
// *local* "prove you can unlock this device" check (any successful platform
// assertion is accepted) — not a server-verified credential, which is the
// right trust model for a screen lock but would NOT be appropriate for
// real remote authentication.

const PIN_KEY = "meets.lock.pin";
const ENABLED_KEY = "meets.lock.enabled";
const WEBAUTHN_CRED_KEY = "meets.lock.webauthnCredId";
const AUTOLOCK_KEY = "meets.lock.autolock";
const SESSION_UNLOCKED_KEY = "meets.lock.unlockedAt";

export type AutoLockMode = "immediate" | "1m" | "5m" | "never";

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function isLockEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ENABLED_KEY) === "true";
}

export async function setPin(pin: string): Promise<void> {
  const salt = crypto.randomUUID();
  const hash = await sha256Hex(salt + pin);
  localStorage.setItem(PIN_KEY, JSON.stringify({ salt, hash }));
  localStorage.setItem(ENABLED_KEY, "true");
}

export function hasPin(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem(PIN_KEY);
}

export async function verifyPin(pin: string): Promise<boolean> {
  const raw = localStorage.getItem(PIN_KEY);
  if (!raw) return false;
  const { salt, hash } = JSON.parse(raw) as { salt: string; hash: string };
  return (await sha256Hex(salt + pin)) === hash;
}

export function disableLock(): void {
  localStorage.removeItem(PIN_KEY);
  localStorage.removeItem(ENABLED_KEY);
  localStorage.removeItem(WEBAUTHN_CRED_KEY);
  sessionStorage.removeItem(SESSION_UNLOCKED_KEY);
}

export function hasWebAuthnCredential(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem(WEBAUTHN_CRED_KEY);
}

export function webAuthnSupported(): boolean {
  return typeof window !== "undefined" && !!window.PublicKeyCredential;
}

/** Registers the device's platform authenticator (biometric/device PIN)
 * as an alternative unlock method. */
export async function registerWebAuthn(): Promise<boolean> {
  if (!webAuthnSupported()) return false;
  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const userId = crypto.getRandomValues(new Uint8Array(16));
    const cred = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: "Meets" },
        user: { id: userId, name: "app-lock", displayName: "Verrouillage de l'app" },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" },
          { alg: -257, type: "public-key" },
        ],
        authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
        timeout: 60000,
      },
    })) as PublicKeyCredential | null;
    if (!cred) return false;
    const id = btoa(String.fromCharCode(...new Uint8Array(cred.rawId)));
    localStorage.setItem(WEBAUTHN_CRED_KEY, id);
    localStorage.setItem(ENABLED_KEY, "true");
    return true;
  } catch {
    return false;
  }
}

export function removeWebAuthn(): void {
  localStorage.removeItem(WEBAUTHN_CRED_KEY);
}

export async function verifyWebAuthn(): Promise<boolean> {
  const id = localStorage.getItem(WEBAUTHN_CRED_KEY);
  if (!id || !webAuthnSupported()) return false;
  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const rawId = Uint8Array.from(atob(id), (c) => c.charCodeAt(0));
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [{ id: rawId, type: "public-key" }],
        userVerification: "required",
        timeout: 60000,
      },
    });
    return !!assertion;
  } catch {
    return false;
  }
}

export function getAutoLockMode(): AutoLockMode {
  if (typeof window === "undefined") return "immediate";
  return (localStorage.getItem(AUTOLOCK_KEY) as AutoLockMode) ?? "immediate";
}

export function setAutoLockMode(mode: AutoLockMode): void {
  localStorage.setItem(AUTOLOCK_KEY, mode);
}

export function markUnlocked(): void {
  sessionStorage.setItem(SESSION_UNLOCKED_KEY, String(Date.now()));
}

const THRESHOLDS_MS: Record<AutoLockMode, number> = {
  immediate: 0,
  "1m": 60_000,
  "5m": 5 * 60_000,
  never: Infinity,
};

/** Whether the lock screen should be shown right now. */
export function shouldLock(): boolean {
  if (typeof window === "undefined") return false;
  if (!isLockEnabled()) return false;
  const at = Number(sessionStorage.getItem(SESSION_UNLOCKED_KEY) ?? 0);
  if (!at) return true;
  const elapsed = Date.now() - at;
  return elapsed >= THRESHOLDS_MS[getAutoLockMode()];
}
