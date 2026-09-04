/**
 * Shared client/server contract for the AI features. These never touch the
 * Grindr-shaped API surface — they go to our own /api/ai route, which holds
 * the Gemini keys server-side.
 */

export type AiTone = "naturel" | "drole" | "direct" | "flirt";

export const AI_TONES: { value: AiTone; label: string }[] = [
  { value: "naturel", label: "Naturel" },
  { value: "drole", label: "Drôle" },
  { value: "direct", label: "Direct" },
  { value: "flirt", label: "Flirt" },
];

/** Minimal, anonymised profile context sent to Gemini. */
export interface AiProfileContext {
  displayName: string | null;
  age: number | null;
  aboutMe: string;
  tribes: string[];
  lookingFor: string[];
  tracks: string[];
}

export interface AiChatMessage {
  from: "me" | "them";
  text: string;
}

/** User-defined writing style, appended to the system prompt when set. */
export interface AiStyle {
  style?: string;
}

export type AiTask = AiStyle &
  (
    | {
        task: "replySuggestions";
        messages: AiChatMessage[];
        profile: AiProfileContext;
        tone: AiTone;
      }
    | { task: "icebreaker"; profile: AiProfileContext; tone: AiTone }
    | { task: "scamCheck"; messages: AiChatMessage[] }
    | { task: "conversationSummary"; messages: AiChatMessage[] }
    | { task: "bioAssistant"; bio: string; tone: AiTone }
    | { task: "naturalSearch"; query: string }
    | { task: "profileSummary"; profile: AiProfileContext; me: AiProfileContext }
  );

export interface AiSuggestionsResult {
  suggestions: string[];
}

export interface AiScamResult {
  risk: "none" | "low" | "high";
  reasons: string[];
}

export interface AiSummaryResult {
  summary: string;
  facts: string[];
}

export interface AiBioResult {
  variants: string[];
  warnings: string[];
}

export interface AiSearchResult {
  ageMin: number | null;
  ageMax: number | null;
  online: boolean | null;
  query: string | null;
  explanation: string;
}

export interface AiProfileSummaryResult {
  summary: string;
  commonPoints: string[];
}
