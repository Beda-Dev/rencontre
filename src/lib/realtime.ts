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
import { Message } from "./types";

type RealtimeHandler = (message: Message) => void;

export interface RealtimeConnection {
  close(): void;
}

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
