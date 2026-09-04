"use client";

import { getConfig } from "./config";
import { avatarFor } from "./avatar";
import {
  buildDiscoverSections,
  getOrCreateMockAccount,
  MOCK_ALIST,
  MOCK_CONVERSATIONS,
  MOCK_GIFS,
  MOCK_MANAGED_FIELDS,
  MOCK_ME,
  MOCK_MESSAGES,
  MOCK_PLACES,
  MOCK_PROFILES,
  MOCK_RIGHTNOW_POSTS,
  MOCK_SPOTIFY_CATALOG,
  MOCK_SPOTIFY_FAVORITES,
  MOCK_TOP_PICKS,
  MOCK_VIEWS,
  MOCK_VIP_PROFILES,
  setActiveMockAccount,
  toCascadeProfile,
} from "./mockData";
import {
  getActiveAccountId,
  listAccounts,
  removeAccount as removeSavedAccount,
  SavedAccount,
  setActiveAccountId,
  updateAccountProfile,
  upsertAccount,
} from "./accounts";
import { encodeGeohash, haversineMeters, jitterCoords } from "./geo";
import { fileToDataUrl } from "./mediaFile";
import { translateText } from "./translate";
import {
  AlistProfile,
  BoostStatus,
  BoostType,
  CascadeParams,
  Conversation,
  DiscoverSection,
  Gif,
  ManagedFields,
  Message,
  MessageMedia,
  MyProfile,
  Place,
  Profile,
  ProfileDetail,
  ProfileView,
  RightNowPost,
  RoamStatus,
  SpotifyTrack,
  TapStats,
  VipProfile,
} from "./types";

const SESSION_KEY = "locatr.sessionId";
const DELAY = 250;

// In-memory only (mock mode): profiles blocked this session, mirroring
// POST /v3/blocks/<id> + DELETE /v3/me/blocks from the documented API.
const blockedIds = new Set<string>();
// In-memory only (mock mode): profiles tapped ("waved") this session, mirroring
// POST /v2/taps/add.
const tappedIds = new Set<string>();
// In-memory only (mock mode): current roam/travel state, mirroring GET /v1/roam.
let roamState: RoamStatus = { active: false, place: null };
// In-memory only (mock mode): boost session, mirroring GET /v2/boost/sessions.
let boostState: BoostStatus = { active: false, type: null, expiresAt: null };
// In-memory only (mock mode): tap counters, mirroring /v2/taps/received + /v1/interactions/taps/sent.
const tapStats: TapStats = { sent: 0, received: 17 };
// In-memory only (mock mode): passed Top Picks, mirroring PUT /v1/toppicks/passed/{id}.
const passedTopPickIds = new Set<string>();
// In-memory only (mock mode): my active Right Now post, mirroring GET /v3/rightnow/active-post.
let myRightNowPost: RightNowPost | null = null;
// In-memory only (mock mode): my Spotify favorites, mirroring POST /v4/spotify/favorites.
let mySpotifyFavorites: SpotifyTrack[] = MOCK_SPOTIFY_CATALOG.slice(0, 3);

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function makeMessage(
  targetProfileId: string,
  type: Message["type"],
  body: string,
  media: MessageMedia | null = null
): Message {
  return {
    messageId: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    body,
    sourceProfileId: MOCK_ME.profileId,
    targetProfileId,
    timestamp: Date.now(),
    type,
    media,
    reaction: null,
    unsent: false,
  };
}

function pushMockMessage(profileId: string, msg: Message) {
  MOCK_MESSAGES[profileId] = [...(MOCK_MESSAGES[profileId] ?? []), msg];
}

/** MessageTarget — { type: "Direct", targetId }. */
function directTarget(profileId: string) {
  return { type: "Direct", targetId: Number(profileId) };
}

/** Resolve a media hash to a displayable image URL (mock avatar or your own CDN). */
export function mediaUrl(hash: string | null, label?: string): string {
  const { useMock, apiBaseUrl } = getConfig();
  if (!hash) return avatarFor("unknown", label ?? "?");
  // Already a locally-uploaded/recorded file (data:/blob: URL) — use as-is.
  if (hash.startsWith("data:") || hash.startsWith("blob:")) return hash;
  if (useMock) return avatarFor(hash, label);
  // Point this at your own image CDN/proxy once real API data is wired in.
  return `${apiBaseUrl}/media/${hash}`;
}

function getSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(SESSION_KEY);
}

function setSessionId(id: string | null) {
  if (typeof window === "undefined") return;
  if (id) window.localStorage.setItem(SESSION_KEY, id);
  else window.localStorage.removeItem(SESSION_KEY);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const { apiBaseUrl } = getConfig();
  const sessionId = getSessionId();
  const res = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      // Documented auth scheme: literal "Grindr3 " prefix + Session ID (JWT).
      ...(sessionId ? { Authorization: `Grindr3 ${sessionId}` } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`API ${path} failed: HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  isAuthenticated(): boolean {
    const { useMock } = getConfig();
    if (useMock) return getSessionId() !== "logged-out";
    return getSessionId() !== null;
  },

  /**
   * POST /v8/sessions — SessionCreateRequest. On success we also save this
   * account's authToken locally (see lib/accounts.ts): that's what lets
   * switchAccount() below start a fresh session later without asking for
   * the password again, exactly like the documented "every subsequent
   * session" flow.
   */
  async login(email: string, _password: string): Promise<void> {
    const { useMock } = getConfig();
    if (useMock) {
      await sleep(DELAY);
      const profile = getOrCreateMockAccount(email);
      setActiveMockAccount(profile);
      setSessionId(`mock-session-${profile.profileId}`);
      upsertAccount({
        profileId: profile.profileId,
        email: profile.email,
        displayName: profile.displayName,
        profileImageMediaHash: profile.profileImageMediaHash,
        authToken: `mock-auth-${profile.profileId}`,
        addedAt: Date.now(),
      });
      setActiveAccountId(profile.profileId);
      return;
    }
    const data = await request<{ sessionId: string; profileId: string; authToken: string }>(
      "/v8/sessions",
      {
        method: "POST",
        body: JSON.stringify({
          email,
          password: _password,
          authToken: null,
          token: null,
          geohash: null,
        }),
      }
    );
    setSessionId(data.sessionId);
    upsertAccount({
      profileId: data.profileId,
      email,
      displayName: email,
      profileImageMediaHash: null,
      authToken: data.authToken,
      addedAt: Date.now(),
    });
    setActiveAccountId(data.profileId);
    api
      .getMe()
      .then((me) =>
        updateAccountProfile(data.profileId, {
          displayName: me.displayName,
          profileImageMediaHash: me.profileImageMediaHash,
        })
      )
      .catch(() => {});
  },

  /**
   * "Continue with Google". The real flow (vendor id 2) is: get a Google
   * server auth code on-device, exchange it via your backend for a Google
   * access token, then POST it here as `thirdPartyToken`.
   * POST /v8/sessions/thirdparty — ThirdPartyRequest.
   */
  async loginWithGoogle(thirdPartyToken = ""): Promise<void> {
    const { useMock } = getConfig();
    if (useMock) {
      await sleep(DELAY);
      const profile = getOrCreateMockAccount("google-user@gmail.com");
      setActiveMockAccount(profile);
      setSessionId(`mock-session-${profile.profileId}`);
      upsertAccount({
        profileId: profile.profileId,
        email: profile.email,
        displayName: profile.displayName,
        profileImageMediaHash: profile.profileImageMediaHash,
        authToken: `mock-auth-${profile.profileId}`,
        addedAt: Date.now(),
      });
      setActiveAccountId(profile.profileId);
      return;
    }
    const data = await request<{ sessionId: string; profileId: string; authToken: string }>(
      "/v8/sessions/thirdparty",
      {
        method: "POST",
        body: JSON.stringify({
          thirdPartyVendor: 2 /* Google */,
          thirdPartyToken,
          geohash: null,
        }),
      }
    );
    setSessionId(data.sessionId);
    upsertAccount({
      profileId: data.profileId,
      email: "",
      displayName: "Compte Google",
      profileImageMediaHash: null,
      authToken: data.authToken,
      addedAt: Date.now(),
    });
    setActiveAccountId(data.profileId);
  },

  /** Lists accounts saved on this device (localStorage) — the account
   * switcher's data source. Purely local, no request involved. */
  getAccounts(): SavedAccount[] {
    return listAccounts();
  },

  getActiveAccountId(): string | null {
    return getActiveAccountId();
  },

  /**
   * Switches to an already-logged-in account without a password, mirroring
   * the documented "every subsequent session" flow: POST /v8/sessions with
   * `{ authToken, email, token: null }` instead of a password.
   */
  async switchAccount(profileId: string): Promise<void> {
    const account = listAccounts().find((a) => a.profileId === profileId);
    if (!account) throw new Error("Unknown account");
    const { useMock } = getConfig();
    if (useMock) {
      await sleep(DELAY);
      const profile = getOrCreateMockAccount(account.email, account.profileId);
      setActiveMockAccount(profile);
      setSessionId(`mock-session-${profileId}`);
      setActiveAccountId(profileId);
      return;
    }
    const data = await request<{ sessionId: string }>("/v8/sessions", {
      method: "POST",
      body: JSON.stringify({
        email: account.email,
        authToken: account.authToken,
        password: null,
        token: null,
        geohash: null,
      }),
    });
    setSessionId(data.sessionId);
    setActiveAccountId(profileId);
  },

  /** Forgets a saved account on this device only — no server call, nothing
   * documented for "delete account" is involved here. */
  removeAccount(profileId: string): void {
    const wasActive = getActiveAccountId() === profileId;
    removeSavedAccount(profileId);
    if (wasActive) setSessionId(null);
  },

  logout(): void {
    const { useMock } = getConfig();
    setSessionId(useMock ? "logged-out" : null);
  },

  /** GET /v4/me/profile (self). Response is the full documented Profile
   * object (30+ fields) — map the ones you need into MyProfile here. */
  async getMe(): Promise<MyProfile> {
    const { useMock } = getConfig();
    if (useMock) {
      await sleep(DELAY);
      return MOCK_ME;
    }
    return request<MyProfile>("/v4/me/profile");
  },

  /** PATCH /v4/me/profile — ProfilePatch (aboutMe, displayName, bodyType,
   * ethnicity, height, weight, showAge, showDistance, socialNetworks, …). */
  async updateMe(patch: Partial<MyProfile>): Promise<MyProfile> {
    const { useMock } = getConfig();
    if (useMock) {
      await sleep(DELAY);
      Object.assign(MOCK_ME, patch);
      updateAccountProfile(MOCK_ME.profileId, {
        displayName: MOCK_ME.displayName,
        profileImageMediaHash: MOCK_ME.profileImageMediaHash,
      });
      return MOCK_ME;
    }
    const me = await request<MyProfile>("/v4/me/profile", {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    const activeId = getActiveAccountId();
    if (activeId) {
      updateAccountProfile(activeId, {
        displayName: me.displayName,
        profileImageMediaHash: me.profileImageMediaHash,
      });
    }
    return me;
  },

  /**
   * There is no single "managed fields" endpoint anymore — the current API
   * splits this across GET /v1/tags (tribes/interests), GET /public/v2/genders,
   * GET /v1/pronouns and GET /v3/assignment (A/B config/flags). None of these
   * are on your backend by default, so this aggregates all four in parallel.
   */
  async getManagedFields(): Promise<ManagedFields> {
    const { useMock } = getConfig();
    if (useMock) {
      await sleep(DELAY);
      return MOCK_MANAGED_FIELDS;
    }
    const [tags, genders, pronouns] = await Promise.all([
      request<{ tags: { id: number; name: string }[] }>("/v1/tags"),
      request<{ genders: { id: number; name: string }[] }>("/public/v2/genders"),
      request<{ pronouns: { id: number; name: string }[] }>("/v1/pronouns"),
    ]);
    // These four real endpoints don't map cleanly onto the legacy
    // lookingFor/relationshipStatus/bodyType/ethnicity/tribes/reportReasons
    // shape — adapt this once you know which of your backend's fields you
    // actually want to surface in the UI.
    void tags;
    void genders;
    void pronouns;
    return MOCK_MANAGED_FIELDS;
  },

  /**
   * GET /v4/cascade. Geohash is a query param there — `nearbyGeohash` for a
   * live "near me" cascade, or `exploreGeohash` when roaming — not part of
   * the path. Real param names also differ from our simplified ones:
   * `onlineOnly` (not `online`), `favorites` (not `favorite`), `photoOnly`
   * matches. Response envelope is `{ items, nextPage, … }`, not `{ profiles }`.
   */
  async getCascade(params: CascadeParams = {}): Promise<Profile[]> {
    const { useMock } = getConfig();
    if (useMock) {
      await sleep(DELAY);
      let profiles = MOCK_PROFILES.filter((p) => !blockedIds.has(p.profileId)).map(
        toCascadeProfile
      );
      // With a real (or roamed-to) position available, scatter mock profiles
      // around it and compute genuine haversine distances instead of the
      // static placeholder numbers baked into the mock data.
      if (params.lat !== undefined && params.lng !== undefined) {
        const { lat, lng } = params;
        profiles = profiles.map((p) => {
          const spot = jitterCoords(lat, lng, p.profileId);
          return { ...p, distance: haversineMeters(lat, lng, spot.lat, spot.lng) };
        });
      }
      if (params.online) profiles = profiles.filter((p) => p.online);
      if (params.favorite) profiles = profiles.filter((p) => p.isFavorite);
      if (params.photoOnly)
        profiles = profiles.filter((p) => p.profileImageMediaHash);
      return profiles;
    }
    // lat/lng are mock-only convenience (see above) — the real endpoint only
    // takes a geohash, and uses onlineOnly/favorites, not online/favorite.
    const qs = new URLSearchParams();
    if (params.geohash) qs.set("nearbyGeohash", params.geohash);
    if (params.online) qs.set("onlineOnly", "true");
    if (params.favorite) qs.set("favorites", "true");
    if (params.photoOnly) qs.set("photoOnly", "true");
    if (params.pageNumber) qs.set("pageNumber", String(params.pageNumber));
    return request<{ items: Profile[] }>(`/v4/cascade?${qs}`).then((r) => r.items);
  },

  /** GET /v7/profiles/{id} — response is `{ profiles: [Profile] }`, a
   * 1-item array, not the object directly. */
  async getProfile(profileId: string): Promise<ProfileDetail> {
    const { useMock } = getConfig();
    if (useMock) {
      await sleep(DELAY);
      const p = MOCK_PROFILES.find((x) => x.profileId === profileId);
      if (!p) throw new Error("not found");
      return p;
    }
    return request<{ profiles: ProfileDetail[] }>(`/v7/profiles/${profileId}`).then(
      (r) => r.profiles[0]
    );
  },

  /** POST/DELETE /v3/me/favorites/{profileId}. */
  async toggleFavorite(profileId: string, favorite: boolean): Promise<void> {
    const { useMock } = getConfig();
    if (useMock) {
      await sleep(DELAY);
      const p = MOCK_PROFILES.find((x) => x.profileId === profileId);
      if (p) p.isFavorite = favorite;
      return;
    }
    await request(`/v3/me/favorites/${profileId}`, {
      method: favorite ? "POST" : "DELETE",
    });
  },

  /** POST /v3/me/blocks/{profileId} (unblock: DELETE /v3/me/blocks/{id}, or
   * DELETE /v3/me/blocks to clear all). */
  async blockUser(profileId: string): Promise<void> {
    const { useMock } = getConfig();
    if (useMock) {
      await sleep(DELAY);
      blockedIds.add(profileId);
      return;
    }
    await request(`/v3/me/blocks/${profileId}`, { method: "POST" });
  },

  /**
   * POST /v4/inbox — the real conversation list is fetched via POST, not
   * GET (the body is an InboxFilterRequest for paging/filters — `{}` for
   * "everything"). Response is `{ entries: [{ type, data: {conversationId,
   * participants, unreadCount, preview, …} }] }`; map `data` into our
   * simplified Conversation shape here (needs each entry's other
   * participant resolved to displayName/profileImageMediaHash/online).
   */
  async getConversations(): Promise<Conversation[]> {
    const { useMock } = getConfig();
    if (useMock) {
      await sleep(DELAY);
      return MOCK_CONVERSATIONS.filter((c) => !blockedIds.has(c.profileId));
    }
    return request<{ entries: { data: Conversation }[] }>("/v4/inbox", {
      method: "POST",
      body: JSON.stringify({}),
    }).then((r) => r.entries.map((e) => e.data));
  },

  /**
   * GET /v5/chat/conversation/{conversationId}/message. The real API keys
   * conversations by a `conversationId` (from /v4/inbox), not directly by
   * the other profile's id — have your backend resolve/create that mapping
   * so this can keep taking a profileId, matching the rest of the UI.
   */
  async getMessages(profileId: string): Promise<Message[]> {
    const { useMock } = getConfig();
    if (useMock) {
      await sleep(DELAY);
      return MOCK_MESSAGES[profileId] ?? [];
    }
    return request<{ messages: Message[] }>(
      `/v5/chat/conversation/by-profile/${profileId}/message`
    ).then((r) => r.messages);
  },

  async sendMessage(profileId: string, body: string): Promise<Message> {
    const { useMock } = getConfig();
    const msg = makeMessage(profileId, "text", body);
    if (useMock) {
      await sleep(DELAY);
      pushMockMessage(profileId, msg);
      return msg;
    }
    return request<Message>(`/v4/chat/message/send`, {
      method: "POST",
      body: JSON.stringify({
        type: "Text",
        target: directTarget(profileId),
        body: { text: body },
      }),
    });
  },

  /** POST /v5|v6/chat/media/upload then a Text→Image message send, mirroring
   * SendImageBody { mediaId }. Mock mode skips the upload step entirely. */
  async sendImageMessage(profileId: string, file: File): Promise<Message> {
    const { useMock } = getConfig();
    if (useMock) {
      await sleep(DELAY);
      const url = await fileToDataUrl(file);
      const msg = makeMessage(profileId, "image", "", { url });
      pushMockMessage(profileId, msg);
      return msg;
    }
    const { mediaId } = await request<{ mediaId: number }>(`/v5/chat/media/upload`, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    return request<Message>(`/v4/chat/message/send`, {
      method: "POST",
      body: JSON.stringify({
        type: "Image",
        target: directTarget(profileId),
        body: { mediaId },
      }),
    });
  },

  /** Voice message: chat media upload with Content-Type audio/* and `length`
   * (SendAudioBody { mediaId }). Recorded client-side via MediaRecorder. */
  async sendAudioMessage(
    profileId: string,
    blob: Blob,
    durationSec: number
  ): Promise<Message> {
    const { useMock } = getConfig();
    if (useMock) {
      await sleep(DELAY);
      const url = URL.createObjectURL(blob);
      const msg = makeMessage(profileId, "audio", "", { url, length: durationSec });
      pushMockMessage(profileId, msg);
      return msg;
    }
    const { mediaId } = await request<{ mediaId: number }>(`/v5/chat/media/upload`, {
      method: "POST",
      headers: { "Content-Type": blob.type || "audio/webm" },
      body: blob,
    });
    return request<Message>(`/v4/chat/message/send`, {
      method: "POST",
      body: JSON.stringify({
        type: "Audio",
        target: directTarget(profileId),
        body: { mediaId },
      }),
    });
  },

  /** Video message: same upload path as audio, plus `looping`/`maxViews`
   * (SendVideoBody). */
  async sendVideoMessage(
    profileId: string,
    blob: Blob,
    durationSec: number
  ): Promise<Message> {
    const { useMock } = getConfig();
    if (useMock) {
      await sleep(DELAY);
      const url = URL.createObjectURL(blob);
      const msg = makeMessage(profileId, "video", "", {
        url,
        length: durationSec,
        looping: false,
      });
      pushMockMessage(profileId, msg);
      return msg;
    }
    const { mediaId } = await request<{ mediaId: number }>(`/v5/chat/media/upload`, {
      method: "POST",
      headers: { "Content-Type": blob.type || "video/webm" },
      body: blob,
    });
    return request<Message>(`/v4/chat/message/send`, {
      method: "POST",
      body: JSON.stringify({
        type: "Video",
        target: directTarget(profileId),
        body: { mediaId, looping: false, maxViews: 1 },
      }),
    });
  },

  /**
   * Real API sends full Giphy metadata directly (GiphyBody) — the gif itself
   * lives on Giphy's CDN, no upload step. Our GIF picker is fully offline
   * (see MOCK_GIFS/gifPlaceholder), so this just attaches that placeholder.
   */
  async sendGifMessage(profileId: string, gif: Gif): Promise<Message> {
    const { useMock } = getConfig();
    if (useMock) {
      await sleep(DELAY);
      const msg = makeMessage(profileId, "gif", "", {
        url: gif.url,
        width: gif.width,
        height: gif.height,
      });
      pushMockMessage(profileId, msg);
      return msg;
    }
    return request<Message>(`/v4/chat/message/send`, {
      method: "POST",
      body: JSON.stringify({
        type: "Giphy",
        target: directTarget(profileId),
        body: {
          id: gif.id,
          urlPath: gif.url,
          stillPath: gif.previewUrl,
          previewPath: gif.previewUrl,
          width: gif.width,
          height: gif.height,
          imageHash: gif.id,
        },
      }),
    });
  },

  /**
   * POST /v4/chat/message/reaction — MessageReactionRequest needs
   * `conversationId` (see getMessages comment) and a `reactionType`
   * **integer**, not an emoji string. Only `1` = 🔥 is documented; the rest
   * of open-grind's reverse-engineering hasn't pinned down the other IDs, and
   * there's no known "undo" — so our 5-emoji picker can't be mapped
   * faithfully here. This sends `1` for any pick as a placeholder; replace
   * once you've reverse-engineered (or your backend defines) the real IDs.
   */
  async reactToMessage(
    profileId: string,
    messageId: string,
    emoji: string | null
  ): Promise<void> {
    const { useMock } = getConfig();
    if (useMock) {
      await sleep(DELAY);
      const list = MOCK_MESSAGES[profileId] ?? [];
      const msg = list.find((m) => m.messageId === messageId);
      if (msg) msg.reaction = emoji;
      return;
    }
    await request(`/v4/chat/message/reaction`, {
      method: "POST",
      body: JSON.stringify({ conversationId: profileId, messageId, reactionType: 1 }),
    });
  },

  /** POST /v4/chat/message/unsend — MessageMutationRequest { conversationId,
   * messageId }; turns the message into "This message was unsent." Only
   * works on messages you sent. */
  async unsendMessage(profileId: string, messageId: string): Promise<void> {
    const { useMock } = getConfig();
    if (useMock) {
      await sleep(DELAY);
      const list = MOCK_MESSAGES[profileId] ?? [];
      const msg = list.find((m) => m.messageId === messageId);
      if (msg) {
        msg.unsent = true;
        msg.reaction = null;
      }
      return;
    }
    await request(`/v4/chat/message/unsend`, {
      method: "POST",
      body: JSON.stringify({ conversationId: profileId, messageId }),
    });
  },

  /** POST /v2/taps/add — a lightweight "wave" that doesn't open a chat. */
  /** POST /v2/taps/add — { recipientId, tapType }. tapType: 0 = friendly
   * "hi"/🍪, 1 = 🔥, 2 = 😈, 3 = none. We only ever send the friendly wave. */
  async sendTap(profileId: string): Promise<void> {
    const { useMock } = getConfig();
    if (useMock) {
      await sleep(DELAY);
      tappedIds.add(profileId);
      return;
    }
    await request(`/v2/taps/add`, {
      method: "POST",
      body: JSON.stringify({ recipientId: Number(profileId), tapType: 0 }),
    });
  },

  hasTapped(profileId: string): boolean {
    return tappedIds.has(profileId);
  },

  /** GET /v7/views/list — response is `{ profiles, previews, totalViewers, … }`. */
  async getViews(): Promise<ProfileView[]> {
    const { useMock } = getConfig();
    if (useMock) {
      await sleep(DELAY);
      return MOCK_VIEWS.filter((v) => !blockedIds.has(v.profileId));
    }
    return request<{ profiles: ProfileView[] }>("/v7/views/list").then(
      (r) => r.profiles
    );
  },

  /** PUT /v1/favorites/notes/{targetProfileId} — FavoriteNoteRequest field
   * is `notes` (plural), not `note`. */
  async setFavoriteNote(profileId: string, note: string): Promise<void> {
    const { useMock } = getConfig();
    if (useMock) {
      await sleep(DELAY);
      const p = MOCK_PROFILES.find((x) => x.profileId === profileId);
      if (p) p.favoriteNote = note || null;
      return;
    }
    await request(`/v1/favorites/notes/${profileId}`, {
      method: "PUT",
      body: JSON.stringify({ notes: note || null }),
    });
  },

  /** PUT /v4/location — LocationUpdateRequest { geohash }, moves the account
   * there immediately (does not affect online status). */
  async updateLocation(geohash: string): Promise<void> {
    const { useMock } = getConfig();
    if (useMock) {
      await sleep(DELAY);
      return;
    }
    await request(`/v4/location`, {
      method: "PUT",
      body: JSON.stringify({ geohash }),
    });
  },

  /** GET /v3/places/search — response `{ places: [{ name, address, lat, lon,
   * placeId, importance }] }`. Real Place has no geohash field; we derive
   * one client-side from lat/lon since our Roam flow needs it. */
  async searchPlaces(query: string): Promise<Place[]> {
    const { useMock } = getConfig();
    const q = query.trim().toLowerCase();
    if (useMock) {
      await sleep(DELAY);
      if (!q) return MOCK_PLACES;
      return MOCK_PLACES.filter(
        (p) => p.name.toLowerCase().includes(q) || p.region.toLowerCase().includes(q)
      );
    }
    return request<{
      places: { name: string; address: string; lat: number; lon: number; placeId: string }[];
    }>(`/v3/places/search?query=${encodeURIComponent(query)}`).then((r) =>
      r.places.map((p) => ({
        placeId: p.placeId,
        name: p.name,
        region: p.address,
        lat: p.lat,
        lng: p.lon,
        geohash: encodeGeohash(p.lat, p.lon),
      }))
    );
  },

  /**
   * GET /v1/roam — current roam/travel state. Marked `UndocumentedObject` in
   * the reference API spec (its exact response shape hasn't been fully
   * reverse-engineered), so treat this response type as a best guess.
   */
  async getRoamStatus(): Promise<RoamStatus> {
    const { useMock } = getConfig();
    if (useMock) {
      await sleep(DELAY);
      return roamState;
    }
    return request<RoamStatus>("/v1/roam");
  },

  /**
   * PUT /v1/roam/location to start roaming to a place. Also undocumented in
   * detail; no dedicated "stop roaming" endpoint is known either — clearing
   * is modeled here as roaming back to `null`, adjust to whatever your
   * backend actually implements.
   */
  async setRoam(place: Place | null): Promise<RoamStatus> {
    const { useMock } = getConfig();
    if (useMock) {
      await sleep(DELAY);
      roamState = { active: place !== null, place };
      return roamState;
    }
    return request<RoamStatus>("/v1/roam/location", {
      method: "PUT",
      body: JSON.stringify({ geohash: place?.geohash ?? null }),
    });
  },

  /** GET /v1/location/neighborhood/{geohash} — also undocumented in detail;
   * response shape here is a best guess (`{ name }`). */
  async getNeighborhood(geohash: string): Promise<string> {
    const { useMock } = getConfig();
    if (useMock) {
      await sleep(DELAY);
      const place = MOCK_PLACES.find((p) => geohash.startsWith(p.geohash.slice(0, 4)));
      return place ? `${place.name}, ${place.region}` : "Zone inconnue";
    }
    return request<{ name: string }>(`/v1/location/neighborhood/${geohash}`).then(
      (r) => r.name
    );
  },

  /**
   * POST /v4/media/upload (legacy) — `thumbCoords` (required query param,
   * "left,top,right,bottom" as a rect string) must describe a *square* crop
   * of the uploaded image; the real client lets the user drag a crop box,
   * we don't have that UI so this sends a placeholder full-image square —
   * replace with a real cropper if you need accurate thumbnails. Response
   * is LegacyMediaUploadResponse `{ hash, imageSizes, mediaId }`.
   */
  async uploadProfilePhoto(file: File): Promise<string> {
    const { useMock } = getConfig();
    if (useMock) {
      await sleep(DELAY);
      const url = await fileToDataUrl(file);
      MOCK_ME.profileImageMediaHash = url;
      updateAccountProfile(MOCK_ME.profileId, { profileImageMediaHash: url });
      return url;
    }
    const { hash } = await request<{ hash: string }>(
      `/v4/media/upload?thumbCoords=0,0,512,512`,
      { method: "POST", headers: { "Content-Type": file.type }, body: file }
    );
    const activeId = getActiveAccountId();
    if (activeId) updateAccountProfile(activeId, { profileImageMediaHash: hash });
    return hash;
  },

  /**
   * GET /v1/gifs/search — offline mock (see MOCK_GIFS/gifPlaceholder). The
   * real endpoint proxies Giphy and its response is intentionally left
   * loosely-typed in the reference spec (raw Giphy search-response shape:
   * `{ data: [{ id, images: { original: { url }, ... } }] }`), not the
   * `{gifs}` wrapper below — adjust the mapping once you're proxying it.
   */
  async searchGifs(query: string): Promise<Gif[]> {
    const { useMock } = getConfig();
    const q = query.trim().toLowerCase();
    if (useMock) {
      await sleep(DELAY);
      return q ? MOCK_GIFS.filter((g) => g.id.includes(q)) : MOCK_GIFS;
    }
    type GiphyItem = { id: string; images: { original: { url: string; width: string; height: string }; fixed_width_small?: { url: string } } };
    return request<{ data: GiphyItem[] }>(
      `/v1/gifs/search?q=${encodeURIComponent(query)}`
    ).then((r) =>
      r.data.map((g) => ({
        id: g.id,
        url: g.images.original.url,
        previewUrl: g.images.fixed_width_small?.url ?? g.images.original.url,
        width: Number(g.images.original.width),
        height: Number(g.images.original.height),
      }))
    );
  },

  /** GET /v1/gifs/trending — same Giphy-shaped response as search. */
  async getTrendingGifs(): Promise<Gif[]> {
    const { useMock } = getConfig();
    if (useMock) {
      await sleep(DELAY);
      return MOCK_GIFS;
    }
    type GiphyItem = { id: string; images: { original: { url: string; width: string; height: string }; fixed_width_small?: { url: string } } };
    return request<{ data: GiphyItem[] }>(`/v1/gifs/trending`).then((r) =>
      r.data.map((g) => ({
        id: g.id,
        url: g.images.original.url,
        previewUrl: g.images.fixed_width_small?.url ?? g.images.original.url,
        width: Number(g.images.original.width),
        height: Number(g.images.original.height),
      }))
    );
  },

  /**
   * GET /v3/albums/{albumId}/view — records that you opened someone's
   * album. Takes an **albumId**, not a profileId; our app doesn't model
   * albums as separate entities, so have your backend resolve "this
   * profile's current album" for you. No-ops if there's nothing to record.
   */
  async recordAlbumView(profileId: string): Promise<void> {
    const { useMock } = getConfig();
    if (useMock) {
      await sleep(DELAY);
      return;
    }
    await request(`/v3/albums/by-profile/${profileId}/view`, { method: "GET" });
  },

  /**
   * GET /v4/discover — themed rows of recommended profiles. The reference
   * spec only describes this feed in prose (`DiscoverFeedData`), without a
   * formal schema, so the exact response shape below is a best guess —
   * verify against a real response once you have a backend.
   */
  async getDiscoverSections(): Promise<DiscoverSection[]> {
    const { useMock } = getConfig();
    if (useMock) {
      await sleep(DELAY);
      return buildDiscoverSections();
    }
    return request<{ sections: DiscoverSection[] }>("/v4/discover").then(
      (r) => r.sections
    );
  },

  /**
   * No "list my Top Picks" endpoint is documented at all — only
   * `GET/POST /v1/toppicks/entitlements/messaging/{profileId}` (whether you
   * can message a given pick) and `PUT /v1/toppicks/passed/{id}` (skip one)
   * exist in the reference spec. The feed itself is presumably folded into
   * `/v4/discover` or pushed via notifications on the real client — treat
   * this path as a placeholder for your own backend.
   */
  async getTopPicks(): Promise<Profile[]> {
    const { useMock } = getConfig();
    if (useMock) {
      await sleep(DELAY);
      return MOCK_TOP_PICKS.filter((p) => !passedTopPickIds.has(p.profileId));
    }
    return request<{ profiles: Profile[] }>("/v1/toppicks").then((r) => r.profiles);
  },

  /** PUT /v1/toppicks/passed/{passedProfileId}. */
  async passTopPick(profileId: string): Promise<void> {
    const { useMock } = getConfig();
    if (useMock) {
      await sleep(DELAY);
      passedTopPickIds.add(profileId);
      return;
    }
    await request(`/v1/toppicks/passed/${profileId}`, { method: "PUT" });
  },

  /** GET /v3/alist/profiles — algorithmic top-match recommendations.
   * Response marked `UndocumentedObject` (AListProfilesResponse) in the
   * reference spec — exact shape unconfirmed, `{ profiles }` is a guess. */
  async getAlist(): Promise<AlistProfile[]> {
    const { useMock } = getConfig();
    if (useMock) {
      await sleep(DELAY);
      return MOCK_ALIST;
    }
    return request<{ profiles: AlistProfile[] }>("/v3/alist/profiles").then(
      (r) => r.profiles
    );
  },

  /** GET /v3/vip-profiles — response key is literally `"vip-profiles"`
   * (with the hyphen), not `profiles`. */
  async getVipProfiles(): Promise<VipProfile[]> {
    const { useMock } = getConfig();
    if (useMock) {
      await sleep(DELAY);
      return MOCK_VIP_PROFILES;
    }
    return request<{ "vip-profiles": VipProfile[] }>("/v3/vip-profiles").then(
      (r) => r["vip-profiles"]
    );
  },

  /** GET /v6/rightnow/feed (v4/v5 verified to return the same shape) —
   * RightNowFeedResponse `{ items: [{ type: "right_now_post_v3" | ...,
   * data: PostData }], viewerCount }`. `data` carries the real fields
   * (profileId, mediaHash, text, distance, posted, expiration, …) — map
   * those into our simplified RightNowPost here. */
  async getRightNowFeed(): Promise<RightNowPost[]> {
    const { useMock } = getConfig();
    if (useMock) {
      await sleep(DELAY);
      const mine = myRightNowPost ? [myRightNowPost] : [];
      return [...mine, ...MOCK_RIGHTNOW_POSTS.filter((p) => !blockedIds.has(p.profileId))];
    }
    return request<{ items: { data: RightNowPost }[] }>("/v6/rightnow/feed").then(
      (r) => r.items.map((i) => i.data)
    );
  },

  /** GET /v3/rightnow/active-post — response marked `UndocumentedObject`
   * (RightNowGetActivePostResponse) in the reference spec. */
  async getActiveRightNowPost(): Promise<RightNowPost | null> {
    const { useMock } = getConfig();
    if (useMock) {
      await sleep(DELAY);
      return myRightNowPost;
    }
    return request<RightNowPost | null>("/v3/rightnow/active-post");
  },

  /** POST /v3/rightnow/posts — publish a Right Now post. Request/response
   * also marked `UndocumentedObject` (CreatePostRequest /
   * RightNowCreatePostResponse) in the reference spec; `{ text }` is a
   * reasonable guess given PostData.text, verify against a live response. */
  async createRightNowPost(text: string): Promise<RightNowPost> {
    const { useMock } = getConfig();
    if (useMock) {
      await sleep(DELAY);
      myRightNowPost = {
        postId: `rn-mine-${Date.now()}`,
        profileId: MOCK_ME.profileId,
        displayName: MOCK_ME.displayName,
        profileImageMediaHash: MOCK_ME.profileImageMediaHash,
        text,
        distance: 0,
        posted: Date.now(),
        expiration: Date.now() + 60 * 60 * 1000,
        mine: true,
      };
      return myRightNowPost;
    }
    return request<RightNowPost>("/v3/rightnow/posts", {
      method: "POST",
      body: JSON.stringify({ text }),
    });
  },

  /** No dedicated "delete my Right Now post" endpoint is documented —
   * `PATCH /{version}/rightnow/posts/{postId}` exists for edits, so this
   * models deletion as a placeholder DELETE; confirm against your backend. */
  async deleteRightNowPost(): Promise<void> {
    const { useMock } = getConfig();
    if (useMock) {
      await sleep(DELAY);
      myRightNowPost = null;
      return;
    }
    await request(`/v3/rightnow/posts/mine`, { method: "DELETE" });
  },

  /** GET /v2/boost/sessions — response marked `UndocumentedObject`
   * (BoostSessionResponse) in the reference spec; shape below is a guess. */
  async getBoostStatus(): Promise<BoostStatus> {
    const { useMock } = getConfig();
    if (useMock) {
      await sleep(DELAY);
      if (boostState.active && boostState.expiresAt && boostState.expiresAt < Date.now()) {
        boostState = { active: false, type: null, expiresAt: null };
      }
      return boostState;
    }
    return request<BoostStatus>("/v2/boost/sessions");
  },

  /** POST /v1/boost/preferences/{standard|super|mega} — request body also
   * `UndocumentedObject` (BoostPreferencesRequest) and this endpoint
   * returns no JSON body (200 with empty response) on the real API, unlike
   * our mock which returns the resulting BoostStatus for convenience — call
   * getBoostStatus() afterwards against a real backend. */
  async startBoost(type: BoostType): Promise<BoostStatus> {
    const { useMock } = getConfig();
    if (useMock) {
      await sleep(DELAY);
      boostState = { active: true, type, expiresAt: Date.now() + 30 * 60 * 1000 };
      return boostState;
    }
    await request(`/v1/boost/preferences/${type}`, { method: "POST" });
    return api.getBoostStatus();
  },

  /**
   * GET /v2/taps/received → `{ profiles: TapProfile[] }` (count = length).
   * GET /v1/interactions/taps/sent → a bare array (not wrapped in an
   * object), also count via length.
   */
  async getTapStats(): Promise<TapStats> {
    const { useMock } = getConfig();
    if (useMock) {
      await sleep(DELAY);
      return { ...tapStats, sent: tappedIds.size };
    }
    const [received, sent] = await Promise.all([
      request<{ profiles: unknown[] }>("/v2/taps/received"),
      request<unknown[]>("/v1/interactions/taps/sent"),
    ]);
    return { received: received.profiles.length, sent: sent.length };
  },

  /**
   * POST /v5/chat/translate on the real Grindr API — but here this always
   * calls a real, free third-party service (MyMemory) instead of a mock,
   * regardless of the mock/real-API toggle. See lib/translate.ts.
   */
  async translateMessage(body: string, targetLang = "fr"): Promise<string> {
    return translateText(body, targetLang);
  },

  /** GET /v4/spotify/favorites/{profileId} — response marked
   * `UndocumentedObject` (SpotifyBackendResponse); `{ tracks }` is a guess. */
  async getSpotifyFavorites(profileId: string): Promise<SpotifyTrack[]> {
    const { useMock } = getConfig();
    if (useMock) {
      await sleep(DELAY);
      if (profileId === MOCK_ME.profileId) return mySpotifyFavorites;
      return MOCK_SPOTIFY_FAVORITES[profileId] ?? [];
    }
    return request<{ tracks: SpotifyTrack[] }>(`/v4/spotify/favorites/${profileId}`).then(
      (r) => r.tracks
    );
  },

  /** No Spotify *search/catalog* endpoint is documented at all — real
   * Grindr presumably calls Spotify's own search API and only stores the
   * resulting track IDs via POST /v4/spotify/favorites. This path is purely
   * a convenience for our own backend to expose a pickable track list. */
  async getSpotifyCatalog(): Promise<SpotifyTrack[]> {
    const { useMock } = getConfig();
    if (useMock) {
      await sleep(DELAY);
      return MOCK_SPOTIFY_CATALOG;
    }
    return request<{ tracks: SpotifyTrack[] }>(`/spotify/catalog`).then(
      (r) => r.tracks
    );
  },

  /** POST /v4/spotify/favorites — set my own favorite tracks. Body also
   * marked `UndocumentedObject` (SpotifyPostRequest); `{ trackIds }` is a
   * reasonable guess but unconfirmed. */
  async setSpotifyFavorites(tracks: SpotifyTrack[]): Promise<void> {
    const { useMock } = getConfig();
    if (useMock) {
      await sleep(DELAY);
      mySpotifyFavorites = tracks;
      return;
    }
    await request(`/v4/spotify/favorites`, {
      method: "POST",
      body: JSON.stringify({ trackIds: tracks.map((t) => t.id) }),
    });
  },
};
