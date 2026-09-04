import type { AiTone } from "./aiTypes";

export interface AiSettings {
  /** Master switch — off hides every AI entry point in the UI. */
  enabled: boolean;
  replySuggestions: boolean;
  icebreaker: boolean;
  scamCheck: boolean;
  /** Runs the scam check automatically when a thread opens. */
  autoScamCheck: boolean;
  conversationSummary: boolean;
  bioAssistant: boolean;
  naturalSearch: boolean;
  profileSummary: boolean;
  /** Default tone pre-selected everywhere. */
  tone: AiTone;
  /** Free-text description of how the user writes, injected into the prompts. */
  customStyle: string;
}

const KEY = "meets.aiSettings";

export const DEFAULT_AI_SETTINGS: AiSettings = {
  enabled: true,
  replySuggestions: true,
  icebreaker: true,
  scamCheck: true,
  autoScamCheck: false,
  conversationSummary: true,
  bioAssistant: true,
  naturalSearch: true,
  profileSummary: true,
  tone: "naturel",
  customStyle: "",
};

export function getAiSettings(): AiSettings {
  if (typeof window === "undefined") return DEFAULT_AI_SETTINGS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_AI_SETTINGS;
    return { ...DEFAULT_AI_SETTINGS, ...(JSON.parse(raw) as Partial<AiSettings>) };
  } catch {
    return DEFAULT_AI_SETTINGS;
  }
}

export function setAiSettings(patch: Partial<AiSettings>): AiSettings {
  const next = { ...getAiSettings(), ...patch };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage unavailable (private mode) — settings just don't persist
  }
  return next;
}
