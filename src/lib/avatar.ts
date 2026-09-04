// Generates a local, offline placeholder avatar (colored initial) as a data URI,
// so mock profiles never depend on external images or depict real people.

const PALETTE = [
  "#a78bfa",
  "#e8590c",
  "#c2255c",
  "#7048e8",
  "#1971c2",
  "#0c8599",
  "#2f9e44",
  "#e67700",
];

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function avatarFor(seed: string, label?: string): string {
  const color = PALETTE[hashString(seed) % PALETTE.length];
  const initial = (label ?? seed).trim().charAt(0).toUpperCase() || "?";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320">
    <rect width="320" height="320" fill="${color}"/>
    <text x="50%" y="53%" font-family="Arial, sans-serif" font-size="140" fill="white"
      text-anchor="middle" dominant-baseline="middle">${initial}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const EMOJI_POOL = ["😂", "🔥", "👀", "🎉", "😎", "💀", "✨", "🥳", "😏", "👋"];

/**
 * Fully offline stand-in for a real Giphy result (the real Giphy message
 * type points at media0.giphy.com — we never call that from the browser).
 * Renders a small looping-looking emoji badge so the GIF picker UI has
 * something to show.
 */
export function gifPlaceholder(seed: string): string {
  const color = PALETTE[hashString(seed) % PALETTE.length];
  const emoji = EMOJI_POOL[hashString(seed + "e") % EMOJI_POOL.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="180">
    <rect width="240" height="180" rx="14" fill="${color}"/>
    <text x="50%" y="52%" font-size="72" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
    <text x="10" y="166" font-family="Arial, sans-serif" font-size="16" fill="rgba(255,255,255,.7)">GIF</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
