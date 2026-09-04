"use client";

// Realtime layer for chat, modeled after the documented Grindr WebSocket
// (wss://grindr.mobi/v1/ws, same `Authorization: Grindr3 <sessionId>` header,
// events like ws.connection.established / chat message events).
//
// - Mock mode: no network at all, just an occasional simulated incoming
//   message so the chat UI has something live to show.
// - Real mode: opens an actual WebSocket at `${apiBaseUrl}/ws` (adjust the
//   URL/auth scheme to match your backend — browsers can't set custom
//   `Authorization` headers on WebSocket handshakes, so most backends pass
//   the session token as a query param or a first "auth" frame instead).

import { getConfig } from "./config";
import { MOCK_PROFILES } from "./mockData";
import { Message } from "./types";

type RealtimeHandler = (message: Message) => void;

export interface RealtimeConnection {
  close(): void;
}

export type RealtimeEvent =
  | { kind: "message"; profileId: string; displayName: string | null; message: Message }
  | { kind: "tap"; profileId: string; displayName: string | null }
  | { kind: "view"; profileId: string; displayName: string | null };

type GlobalHandler = (event: RealtimeEvent) => void;

function toWebSocketUrl(apiBaseUrl: string): string | null {
  try {
    const url = new URL(apiBaseUrl);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.pathname = `${url.pathname.replace(/\/$/, "")}/ws`;
    return url.toString();
  } catch {
    return null;
  }
}

/** Subscribes to incoming messages for a single conversation. */
export function connectConversation(
  profileId: string,
  onMessage: RealtimeHandler
): RealtimeConnection {
  const { useMock, apiBaseUrl } = getConfig();

  if (useMock) {
    // Simulate an occasional incoming reply so the thread feels alive.
    const timer = setTimeout(
      () => {
        onMessage({
          messageId: `sim-${Date.now()}`,
          body: "👋",
          sourceProfileId: profileId,
          targetProfileId: "1",
          timestamp: Date.now(),
          type: "text",
          media: null,
          reaction: null,
          unsent: false,
        });
      },
      8000 + Math.random() * 12000
    );
    return { close: () => clearTimeout(timer) };
  }

  const wsUrl = toWebSocketUrl(apiBaseUrl);
  if (!wsUrl) return { close: () => {} };

  const sessionId =
    typeof window !== "undefined"
      ? window.localStorage.getItem("locatr.sessionId")
      : null;
  const socket = new WebSocket(
    `${wsUrl}${sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : ""}`
  );

  socket.addEventListener("message", (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data?.type === "chat" && data.sourceProfileId === profileId) {
        onMessage(data as Message);
      }
    } catch {
      // ignore malformed frames
    }
  });

  return { close: () => socket.close() };
}

/**
 * App-wide notification stream — new messages, taps, and profile views,
 * regardless of what page you're on. Same idea as connectConversation
 * above, just not scoped to a single open thread. Powers the toast stack
 * (see NotificationProvider) and live-updates the relevant query caches.
 */
export function connectGlobalEvents(onEvent: GlobalHandler): RealtimeConnection {
  const { useMock, apiBaseUrl } = getConfig();

  if (useMock) {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const delay = 15000 + Math.random() * 20000;
      timer = setTimeout(() => {
        if (cancelled) return;
        const kinds: RealtimeEvent["kind"][] = ["message", "tap", "view"];
        const kind = kinds[Math.floor(Math.random() * kinds.length)];
        // Message senders come from the same pool as existing mock
        // conversations, so the live update lines up with what the chat
        // list already shows; taps/views can come from anyone nearby.
        const pool = kind === "message" ? MOCK_PROFILES.slice(0, 8) : MOCK_PROFILES.slice(0, 12);
        const profile = pool[Math.floor(Math.random() * pool.length)];
        if (kind === "message") {
          onEvent({
            kind: "message",
            profileId: profile.profileId,
            displayName: profile.displayName,
            message: {
              messageId: `sim-${Date.now()}`,
              body: ["Salut 👋", "Toujours dans le coin ?", "😏", "On se voit quand ?"][
                Math.floor(Math.random() * 4)
              ],
              sourceProfileId: profile.profileId,
              targetProfileId: "1",
              timestamp: Date.now(),
              type: "text",
              media: null,
              reaction: null,
              unsent: false,
            },
          });
        } else {
          onEvent({ kind, profileId: profile.profileId, displayName: profile.displayName });
        }
        schedule();
      }, delay);
    };
    schedule();
    return {
      close: () => {
        cancelled = true;
        clearTimeout(timer);
      },
    };
  }

  const wsUrl = toWebSocketUrl(apiBaseUrl);
  if (!wsUrl) return { close: () => {} };

  const sessionId =
    typeof window !== "undefined"
      ? window.localStorage.getItem("locatr.sessionId")
      : null;
  const socket = new WebSocket(
    `${wsUrl}${sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : ""}`
  );

  socket.addEventListener("message", (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data?.type === "chat") {
        onEvent({
          kind: "message",
          profileId: data.sourceProfileId,
          displayName: data.displayName ?? null,
          message: data as Message,
        });
      } else if (data?.type === "tap") {
        onEvent({ kind: "tap", profileId: data.profileId, displayName: data.displayName ?? null });
      } else if (data?.type === "view") {
        onEvent({ kind: "view", profileId: data.profileId, displayName: data.displayName ?? null });
      }
    } catch {
      // ignore malformed frames
    }
  });

  return { close: () => socket.close() };
}
