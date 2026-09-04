import { GoogleGenAI } from "@google/genai";

const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";

function apiKeys(): string[] {
  return [
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
  ].filter((k): k is string => !!k && k.trim().length > 0);
}

export function aiConfigured(): boolean {
  return apiKeys().length > 0;
}

export class AiUnavailableError extends Error {}

/**
 * Runs a prompt through Gemini, falling back to the next configured key when
 * one fails — quota exhaustion on a free key is the expected case, so a
 * failure on key N is never fatal while key N+1 exists.
 */
export async function generateJson<T>(params: {
  system: string;
  prompt: string;
  schema: Record<string, unknown>;
}): Promise<T> {
  const keys = apiKeys();
  if (keys.length === 0) {
    throw new AiUnavailableError("Aucune clé Gemini configurée.");
  }

  let lastError: unknown;
  for (const key of keys) {
    try {
      const ai = new GoogleGenAI({ apiKey: key });
      const res = await ai.models.generateContent({
        model: MODEL,
        contents: params.prompt,
        config: {
          systemInstruction: params.system,
          responseMimeType: "application/json",
          responseSchema: params.schema,
          temperature: 0.9,
        },
      });
      const text = res.text;
      if (!text) throw new Error("Réponse vide.");
      return JSON.parse(text) as T;
    } catch (err) {
      lastError = err;
    }
  }
  throw new AiUnavailableError(
    lastError instanceof Error ? lastError.message : "Toutes les clés Gemini ont échoué."
  );
}
