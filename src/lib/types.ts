// Shapes mirror the (unofficial, reverse-engineered) Grindr v3/v8 REST API field
// names so mock data and future real API responses can share the same types.

export interface ManagedField {
  fieldId: number;
  name: string;
}

export interface ManagedFields {
  lookingFor: ManagedField[];
  relationshipStatus: ManagedField[];
  bodyType: ManagedField[];
  ethnicity: ManagedField[];
  grindrTribes: ManagedField[];
  reportReasons: ManagedField[];
}

/** A single tile in the cascade/grid (nearby users). */
export interface Profile {
  profileId: string;
  displayName: string | null;
  age: number | null;
  distance: number | null; // meters
  isFavorite: boolean;
  profileImageMediaHash: string | null;
  seen: number; // unix ms
  showAge: boolean;
  showDistance: boolean;
  online: boolean;
  favoriteNote: string | null;
}

/** Full profile, as returned by /v3/profiles/<id>. */
export interface ProfileDetail extends Profile {
  aboutMe: string;
  bodyType: number | null;
  ethnicity: number | null;
  grindrTribes: number[];
  lookingFor: number[];
  relationshipStatus: number | null;
  height: number; // cm, -1 hidden
  weight: number; // grams, -1 hidden
  albumImageMediaHashes: string[];
}

// Subset of the documented MessageType enum we actually render (the full
// enum also has Location, Gaymoji, ExpiringImage, Album, VideoCall, …).
export type MessageType = "text" | "image" | "gif" | "audio" | "video";

export interface MessageMedia {
  url: string; // data:/blob: URL locally, or your CDN URL from a real backend
  width?: number;
  height?: number;
  /** seconds — audio/video only (SendAudioBody/SendVideoBody `length`). */
  length?: number;
  /** video only (SendVideoBody `looping`). */
  looping?: boolean;
}

export interface Message {
  messageId: string;
  body: string;
  sourceProfileId: string;
  targetProfileId: string;
  timestamp: number;
  type: MessageType;
  media: MessageMedia | null;
  reaction: string | null;
  unsent: boolean;
  /** ExpiringImage — SendExpiringImageBody { mediaId, expiring: true }. */
  expiring: boolean;
  /** Once true, an expiring image should render as "already viewed". */
  viewed: boolean;
}

/** GET /v1/gifs/search, /v1/gifs/trending — modeled on GiphyBody. */
export interface Gif {
  id: string;
  url: string;
  previewUrl: string;
  width: number;
  height: number;
}

/** A profile that recently viewed yours (/v4/views, /v6/views/eyeball). */
export interface ProfileView extends Profile {
  viewedAt: number;
}

export interface Conversation {
  profileId: string;
  displayName: string | null;
  profileImageMediaHash: string | null;
  lastMessage: string;
  lastMessageTimestamp: number;
  unreadCount: number;
  online: boolean;
  muted: boolean;
  pinned: boolean;
}

export interface SessionResponse {
  profileId: string;
  sessionId: string;
  xmppToken: string;
}

export interface MyProfile {
  profileId: string;
  email: string;
  displayName: string;
  aboutMe: string;
  age: number;
  showAge: boolean;
  showDistance: boolean;
  profileImageMediaHash: string | null;
}

export interface CascadeParams {
  online?: boolean;
  photoOnly?: boolean;
  favorite?: boolean;
  pageNumber?: number;
  /** nearbyGeohash/exploreGeohash on the real API. */
  geohash?: string;
  /** Mock-mode convenience only (the real API derives this server-side from
   * the geohash) — lets mock profiles scatter realistically around wherever
   * the browser (or an active roam location) says "here" is. */
  lat?: number;
  lng?: number;
}

/** A searchable place to "roam" to (GET /v3/places/search, PUT /v1/roam/location). */
export interface Place {
  placeId: string;
  name: string;
  region: string;
  lat: number;
  lng: number;
  geohash: string;
}

/** GET /v1/roam — current roam/travel state. */
export interface RoamStatus {
  active: boolean;
  place: Place | null;
}

/** GET /v4/discover — themed rows of recommended profiles. */
export interface DiscoverSection {
  id: string;
  title: string;
  profiles: Profile[];
}

/** GET /v3/alist/profiles — algorithmic top-match recommendations. */
export type AlistProfile = Profile;

/** GET /v3/vip-profiles — people who favorited/viewed you as a VIP perk. */
export type VipProfile = Profile;

/** PostData — one card in the Right Now feed (GET /v4|v5|v6/rightnow/feed). */
export interface RightNowPost {
  postId: string;
  profileId: string;
  displayName: string | null;
  profileImageMediaHash: string | null;
  text: string;
  distance: number | null;
  posted: number; // unix ms
  expiration: number; // unix ms
  mine: boolean;
}

export type BoostType = "standard" | "super" | "mega";

/** GET /v2/boost/sessions — temporary visibility boost. */
export interface BoostStatus {
  active: boolean;
  type: BoostType | null;
  expiresAt: number | null;
}

/** GET /v2/taps/received, /v1/interactions/taps/sent. */
export interface TapStats {
  sent: number;
  received: number;
}

/** GET /v4/spotify/favorites/{profileId} — favorite tracks shown on a profile. */
export interface SpotifyTrack {
  id: string;
  title: string;
  artist: string;
}

/** GET /v1/chat/phrases — saved quick-reply phrases. */
export interface SavedPhrase {
  id: string;
  text: string;
}

/**
 * A scheduled future trip (POST /v6/profiles/travel) — distinct from Roam:
 * Roam changes where the cascade shows you *right now*; a travel plan is a
 * dated future visit, shown as a badge on your profile ahead of time.
 */
export interface TravelPlan {
  id: string;
  place: Place;
  startDate: number; // unix ms
  endDate: number; // unix ms
  showOnProfile: boolean;
}

/** GET /v3.1/me/blocks — the reverse of blocking someone (POST /v3/me/blocks/{id}). */
export interface BlockedProfile {
  profileId: string;
  displayName: string | null;
  profileImageMediaHash: string | null;
  blockedTime: number;
}

/** GET /v1/hides — softer than a block: you disappear from their cascade
 * (mocked here as: they disappear from yours), reversible, silent. */
export type HiddenProfile = Pick<Profile, "profileId" | "displayName" | "profileImageMediaHash">;

/** GET /v7/search — real endpoint is filter-based (age/height/tribes/…),
 * not free-text; our mock adds a `query` text filter as a UI convenience. */
export interface SearchParams {
  query?: string;
  ageMin?: number;
  ageMax?: number;
  online?: boolean;
}
