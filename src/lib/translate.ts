"use client";

// Real, free translation via MyMemory (https://mymemory.translated.net) —
// no API key needed for light/anonymous use (~5000 chars/day, more with an
// email param). This is a genuine third-party call, independent of the
// mock/real-API toggle: translation isn't a Grindr-shaped endpoint we're
// simulating, it's a real utility feature.

export async function translateText(text: string, targetLang = "fr"): Promise<string> {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
    text
  )}&langpair=autodetect|${encodeURIComponent(targetLang)}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Translation failed: HTTP ${res.status}`);
  const data = await res.json();
  const translated = data?.responseData?.translatedText;
  if (!translated) throw new Error("Translation failed: empty response");
  return translated;
}
