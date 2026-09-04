"use client";

// Multi-account switching, WhatsApp/Telegram-style: log in once per account,
// then switch between saved accounts instantly afterwards.
//
// This is built entirely on the documented session flow — no new API:
//   - First login: POST /v8/sessions with email+password → { authToken, ... }
//   - Every subsequent session (including switching back to an account):
//     POST /v8/sessions with { authToken, email, token: null } → fresh sessionId
// We just keep every account's authToken locally instead of only the most
// recent one, and re-run that second flow when switching.

export interface SavedAccount {
  profileId: string;
  email: string;
  displayName: string;
  profileImageMediaHash: string | null;
  /** Persistent auth token (password-equivalent per the docs) — lets us
   * start a fresh session for this account without asking for the password
   * again, exactly like the documented "every subsequent session" flow. */
  authToken: string;
  addedAt: number;
}

const ACCOUNTS_KEY = "locatr.accounts";
const ACTIVE_KEY = "locatr.activeAccountId";

function readAccounts(): SavedAccount[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAccounts(accounts: SavedAccount[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function listAccounts(): SavedAccount[] {
  return readAccounts();
}

export function getActiveAccountId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_KEY);
}

export function setActiveAccountId(profileId: string | null) {
  if (typeof window === "undefined") return;
  if (profileId) window.localStorage.setItem(ACTIVE_KEY, profileId);
  else window.localStorage.removeItem(ACTIVE_KEY);
}

export function getActiveAccount(): SavedAccount | null {
  const id = getActiveAccountId();
  if (!id) return null;
  return readAccounts().find((a) => a.profileId === id) ?? null;
}

/** Save or update an account after a successful login. */
export function upsertAccount(account: SavedAccount) {
  const accounts = readAccounts();
  const i = accounts.findIndex((a) => a.profileId === account.profileId);
  if (i >= 0) accounts[i] = { ...accounts[i], ...account };
  else accounts.push(account);
  writeAccounts(accounts);
}

export function updateAccountProfile(
  profileId: string,
  patch: Partial<Pick<SavedAccount, "displayName" | "profileImageMediaHash">>
) {
  const accounts = readAccounts();
  const i = accounts.findIndex((a) => a.profileId === profileId);
  if (i >= 0) {
    accounts[i] = { ...accounts[i], ...patch };
    writeAccounts(accounts);
  }
}

/** Forgets an account on this device (does not touch the server). */
export function removeAccount(profileId: string) {
  writeAccounts(readAccounts().filter((a) => a.profileId !== profileId));
  if (getActiveAccountId() === profileId) setActiveAccountId(null);
}
