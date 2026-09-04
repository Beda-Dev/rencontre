import type {
  AiBioResult,
  AiChatMessage,
  AiProfileContext,
  AiProfileSummaryResult,
  AiScamResult,
  AiSearchResult,
  AiSuggestionsResult,
  AiSummaryResult,
  AiTask,
  AiTone,
} from "./aiTypes";
import type { Message, MyProfile, ProfileDetail, SpotifyTrack } from "./types";
import { getAiSettings } from "./aiSettings";

async function call<T>(task: AiTask): Promise<T> {
  const { customStyle } = getAiSettings();
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(customStyle ? { ...task, style: customStyle } : task),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || "L'IA n'a pas pu répondre.");
  return json as T;
}

export async function aiConfigured(): Promise<boolean> {
  try {
    const res = await fetch("/api/ai");
    const json = await res.json();
    return !!json?.configured;
  } catch {
    return false;
  }
}

/** Strips a profile down to the few text fields the model actually needs. */
export function toProfileContext(
  profile: Pick<ProfileDetail, "displayName" | "age" | "aboutMe"> & {
    grindrTribes?: number[];
    lookingFor?: number[];
  },
  opts: { tribeNames?: string[]; lookingForNames?: string[]; tracks?: SpotifyTrack[] } = {}
): AiProfileContext {
  return {
    displayName: profile.displayName,
    age: profile.age,
    aboutMe: profile.aboutMe ?? "",
    tribes: opts.tribeNames ?? [],
    lookingFor: opts.lookingForNames ?? [],
    tracks: (opts.tracks ?? []).map((t) => `${t.title} — ${t.artist}`),
  };
}

export function myProfileContext(me: MyProfile): AiProfileContext {
  return {
    displayName: me.displayName,
    age: me.age,
    aboutMe: me.aboutMe ?? "",
    tribes: [],
    lookingFor: [],
    tracks: [],
  };
}

/** Text-only view of a thread — media messages carry nothing useful here. */
export function toChatMessages(messages: Message[], myProfileId: string): AiChatMessage[] {
  return messages
    .filter((m) => m.type === "text" && !m.unsent && m.body.trim().length > 0)
    .map((m) => ({
      from: m.sourceProfileId === myProfileId ? ("me" as const) : ("them" as const),
      text: m.body,
    }));
}

export const ai = {
  replySuggestions: (messages: AiChatMessage[], profile: AiProfileContext, tone: AiTone) =>
    call<AiSuggestionsResult>({ task: "replySuggestions", messages, profile, tone }),

  icebreaker: (profile: AiProfileContext, tone: AiTone) =>
    call<AiSuggestionsResult>({ task: "icebreaker", profile, tone }),

  scamCheck: (messages: AiChatMessage[]) => call<AiScamResult>({ task: "scamCheck", messages }),

  conversationSummary: (messages: AiChatMessage[]) =>
    call<AiSummaryResult>({ task: "conversationSummary", messages }),

  bioAssistant: (bio: string, tone: AiTone) => call<AiBioResult>({ task: "bioAssistant", bio, tone }),

  naturalSearch: (query: string) => call<AiSearchResult>({ task: "naturalSearch", query }),

  profileSummary: (profile: AiProfileContext, me: AiProfileContext) =>
    call<AiProfileSummaryResult>({ task: "profileSummary", profile, me }),
};
