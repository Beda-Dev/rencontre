import {
  Conversation,
  DiscoverSection,
  Gif,
  ManagedFields,
  Message,
  MyProfile,
  Place,
  Profile,
  ProfileDetail,
  ProfileView,
  RightNowPost,
  SpotifyTrack,
} from "./types";
import { encodeGeohash } from "./geo";
import { gifPlaceholder } from "./avatar";

const NAMES = [
  "Alex",
  "Sam",
  "Jordan",
  "Chris",
  "Robin",
  "Max",
  "Théo",
  "Noah",
  "Lucas",
  "Nathan",
  "Eli",
  "Mika",
  "Tom",
  "Léo",
];

const now = Date.now();

function buildDetail(i: number): ProfileDetail {
  const id = String(1000 + i);
  const name = NAMES[i % NAMES.length];
  return {
    profileId: id,
    displayName: name,
    age: 21 + (i % 20),
    distance: 100 + i * 340,
    isFavorite: i % 5 === 0,
    profileImageMediaHash: id,
    seen: now - i * 60_000,
    showAge: true,
    showDistance: true,
    online: i % 3 === 0,
    favoriteNote: i % 5 === 0 ? "On a matché à la soirée du mois dernier" : null,
    aboutMe:
      i % 2 === 0
        ? "Ici pour discuter, pas pressé. Café ou rando le week-end."
        : "Nouveau dans le coin, dispo pour rencontrer du monde.",
    bodyType: (i % 6) + 1,
    ethnicity: (i % 6) + 1,
    grindrTribes: [(i % 8) + 1],
    lookingFor: [(i % 4) + 1],
    relationshipStatus: (i % 4) + 1,
    height: 165 + (i % 30),
    weight: 60_000 + (i % 30) * 1000,
    albumImageMediaHashes: Array.from(
      { length: 3 + (i % 4) },
      (_, j) => `${id}-a${j}`
    ),
  };
}

export const MOCK_PROFILES: ProfileDetail[] = Array.from({ length: 24 }, (_, i) =>
  buildDetail(i)
);

export function toCascadeProfile(p: ProfileDetail): Profile {
  const {
    profileId,
    displayName,
    age,
    distance,
    isFavorite,
    profileImageMediaHash,
    seen,
    showAge,
    showDistance,
    online,
    favoriteNote,
  } = p;
  return {
    profileId,
    displayName,
    age,
    distance,
    isFavorite,
    profileImageMediaHash,
    seen,
    showAge,
    showDistance,
    online,
    favoriteNote,
  };
}

export const MOCK_MANAGED_FIELDS: ManagedFields = {
  lookingFor: [
    { fieldId: 1, name: "Chat" },
    { fieldId: 2, name: "Dates" },
    { fieldId: 3, name: "Amis" },
    { fieldId: 4, name: "Réseau" },
  ],
  relationshipStatus: [
    { fieldId: 1, name: "Célibataire" },
    { fieldId: 2, name: "En couple" },
    { fieldId: 3, name: "Ouvert" },
    { fieldId: 4, name: "Compliqué" },
  ],
  bodyType: [
    { fieldId: 1, name: "Athlétique" },
    { fieldId: 2, name: "Moyen" },
    { fieldId: 3, name: "Costaud" },
    { fieldId: 4, name: "Mince" },
    { fieldId: 5, name: "Musclé" },
    { fieldId: 6, name: "Rond" },
  ],
  ethnicity: [
    { fieldId: 1, name: "Asiatique" },
    { fieldId: 2, name: "Noir" },
    { fieldId: 3, name: "Latino" },
    { fieldId: 4, name: "Métis" },
    { fieldId: 5, name: "Blanc" },
    { fieldId: 6, name: "Autre" },
  ],
  grindrTribes: [
    { fieldId: 1, name: "Ours" },
    { fieldId: 2, name: "Clean-cut" },
    { fieldId: 3, name: "Geek" },
    { fieldId: 4, name: "Sportif" },
    { fieldId: 5, name: "Twink" },
    { fieldId: 6, name: "Cuir" },
    { fieldId: 7, name: "Discret" },
    { fieldId: 8, name: "Trans" },
  ],
  reportReasons: [
    { fieldId: 1, name: "Photo de profil offensante" },
    { fieldId: 2, name: "Texte de profil offensant" },
    { fieldId: 3, name: "Spam" },
    { fieldId: 4, name: "Usurpation d'identité" },
    { fieldId: 5, name: "Mineur" },
  ],
};

// Multi-account (mock mode): one MyProfile per logged-in account, keyed by
// profileId, so switching accounts shows genuinely different demo data.
// "1" is the original single-account demo profile, kept for continuity.
const MOCK_ACCOUNTS = new Map<string, MyProfile>([
  [
    "1",
    {
      profileId: "1",
      email: "demo@example.com",
      displayName: "Toi",
      aboutMe: "Modifie ton profil dans Réglages.",
      age: 28,
      showAge: true,
      showDistance: true,
      profileImageMediaHash: "me",
    },
  ],
]);

function hashToId(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h << 5) - h + seed.charCodeAt(i);
  return String(9000 + (Math.abs(h) % 900));
}

/** Gets (or creates on first login) the mock profile for an account. */
export function getOrCreateMockAccount(email: string, profileId?: string): MyProfile {
  const id = profileId ?? hashToId(email.toLowerCase());
  const existing = MOCK_ACCOUNTS.get(id);
  if (existing) return existing;
  const created: MyProfile = {
    profileId: id,
    email,
    displayName: email.split("@")[0] || "Nouveau compte",
    aboutMe: "Modifie ton profil dans Réglages.",
    age: 25,
    showAge: true,
    showDistance: true,
    profileImageMediaHash: null,
  };
  MOCK_ACCOUNTS.set(id, created);
  return created;
}

export function getMockAccount(profileId: string): MyProfile | undefined {
  return MOCK_ACCOUNTS.get(profileId);
}

/** Currently active mock account — everything in api.ts that used to read
 * the single MOCK_ME constant now reads this instead. */
export let MOCK_ME: MyProfile = MOCK_ACCOUNTS.get("1")!;

export function setActiveMockAccount(profile: MyProfile) {
  MOCK_ME = profile;
}

function buildMessages(otherId: string): Message[] {
  return [
    {
      messageId: `${otherId}-1`,
      body: "Salut, ça va ?",
      sourceProfileId: otherId,
      targetProfileId: MOCK_ME.profileId,
      timestamp: now - 1000 * 60 * 40,
      type: "text",
      media: null,
      reaction: null,
      unsent: false,
    },
    {
      messageId: `${otherId}-2`,
      body: "Oui et toi ? Tu es dans le coin ?",
      sourceProfileId: MOCK_ME.profileId,
      targetProfileId: otherId,
      timestamp: now - 1000 * 60 * 35,
      type: "text",
      media: null,
      reaction: null,
      unsent: false,
    },
    {
      messageId: `${otherId}-3`,
      body: "Oui, pas loin en fait !",
      sourceProfileId: otherId,
      targetProfileId: MOCK_ME.profileId,
      timestamp: now - 1000 * 60 * 30,
      type: "text",
      media: null,
      reaction: null,
      unsent: false,
    },
  ];
}

export const MOCK_MESSAGES: Record<string, Message[]> = Object.fromEntries(
  MOCK_PROFILES.slice(0, 8).map((p) => [p.profileId, buildMessages(p.profileId)])
);

export const MOCK_CONVERSATIONS: Conversation[] = MOCK_PROFILES.slice(0, 8).map(
  (p) => {
    const msgs = MOCK_MESSAGES[p.profileId];
    const last = msgs[msgs.length - 1];
    return {
      profileId: p.profileId,
      displayName: p.displayName,
      profileImageMediaHash: p.profileImageMediaHash,
      lastMessage: last.body,
      lastMessageTimestamp: last.timestamp,
      unreadCount: last.sourceProfileId === p.profileId ? 1 : 0,
      online: p.online,
    };
  }
);

export const MOCK_VIEWS: ProfileView[] = MOCK_PROFILES.slice(3, 13).map((p, i) => ({
  ...toCascadeProfile(p),
  viewedAt: now - i * 1000 * 60 * 25,
}));

const RAW_PLACES: [string, string, number, number][] = [
  ["Paris", "Île-de-France, France", 48.8566, 2.3522],
  ["Lyon", "Auvergne-Rhône-Alpes, France", 45.764, 4.8357],
  ["Marseille", "Provence-Alpes-Côte d'Azur, France", 43.2965, 5.3698],
  ["Montréal", "Québec, Canada", 45.5019, -73.5674],
  ["Bruxelles", "Belgique", 50.8503, 4.3517],
  ["Genève", "Suisse", 46.2044, 6.1432],
  ["Berlin", "Allemagne", 52.52, 13.405],
  ["Barcelone", "Espagne", 41.3874, 2.1686],
  ["New York", "État de New York, États-Unis", 40.7128, -74.006],
  ["Tokyo", "Japon", 35.6762, 139.6503],
];

export const MOCK_PLACES: Place[] = RAW_PLACES.map(([name, region, lat, lng]) => ({
  placeId: name.toLowerCase().replace(/\s+/g, "-"),
  name,
  region,
  lat,
  lng,
  geohash: encodeGeohash(lat, lng),
}));

const GIF_LABELS = [
  "lol",
  "oui",
  "non",
  "wow",
  "salut",
  "câlin",
  "danse",
  "cool",
  "amour",
  "fete",
  "rire",
  "coeur",
];

export const MOCK_GIFS: Gif[] = GIF_LABELS.map((label) => ({
  id: label,
  url: gifPlaceholder(label),
  previewUrl: gifPlaceholder(label),
  width: 240,
  height: 180,
}));

const ALL_CASCADE: Profile[] = MOCK_PROFILES.map(toCascadeProfile);

export function buildDiscoverSections(): DiscoverSection[] {
  return [
    { id: "new", title: "Nouveaux sur Rencontre", profiles: ALL_CASCADE.slice(0, 6) },
    {
      id: "online",
      title: "En ligne maintenant",
      profiles: ALL_CASCADE.filter((p) => p.online).slice(0, 8),
    },
    { id: "suggested", title: "Suggestions pour toi", profiles: ALL_CASCADE.slice(6, 14) },
  ];
}

export const MOCK_TOP_PICKS: Profile[] = ALL_CASCADE.slice(0, 6);
export const MOCK_ALIST: Profile[] = ALL_CASCADE.slice(2, 10);
export const MOCK_VIP_PROFILES: Profile[] = ALL_CASCADE.slice(8, 14);

export const MOCK_RIGHTNOW_POSTS: RightNowPost[] = MOCK_PROFILES.slice(0, 6).map(
  (p, i) => ({
    postId: `rn-${p.profileId}`,
    profileId: p.profileId,
    displayName: p.displayName,
    profileImageMediaHash: p.profileImageMediaHash,
    text: [
      "Dispo pour un verre ce soir 🍻",
      "Balade au parc, qui tente ?",
      "Chill à la maison, viens dire salut",
      "Café en terrasse ☕",
      "Sortie cinéma improvisée",
      "Dispo pour discuter",
    ][i % 6],
    distance: 300 + i * 500,
    posted: now - i * 1000 * 60 * 20,
    expiration: now + (60 - i * 10) * 1000 * 60,
    mine: false,
  })
);

export const MOCK_SPOTIFY_CATALOG: SpotifyTrack[] = [
  { id: "t1", title: "Midnight City", artist: "M83" },
  { id: "t2", title: "Blinding Lights", artist: "The Weeknd" },
  { id: "t3", title: "Levitating", artist: "Dua Lipa" },
  { id: "t4", title: "As It Was", artist: "Harry Styles" },
  { id: "t5", title: "Titanium", artist: "David Guetta ft. Sia" },
  { id: "t6", title: "Instant Crush", artist: "Daft Punk" },
  { id: "t7", title: "Electric Feel", artist: "MGMT" },
  { id: "t8", title: "Dance Monkey", artist: "Tones and I" },
];

export const MOCK_SPOTIFY_FAVORITES: Record<string, SpotifyTrack[]> = Object.fromEntries(
  MOCK_PROFILES.slice(0, 10).map((p, i) => [
    p.profileId,
    MOCK_SPOTIFY_CATALOG.slice(i % 4, (i % 4) + 3),
  ])
);
