import { NextResponse } from "next/server";
import { AiUnavailableError, aiConfigured, generateJson } from "@/lib/gemini.server";
import { baseSystem, PROMPTS } from "@/lib/aiPrompts";
import type { AiTask } from "@/lib/aiTypes";

export const runtime = "nodejs";

const STRINGS = { type: "array", items: { type: "string" } };

/** Lets the UI hide the AI entry points when no key is configured. */
export async function GET() {
  return NextResponse.json({ configured: aiConfigured() });
}

export async function POST(req: Request) {
  if (!aiConfigured()) {
    return NextResponse.json(
      { error: "Les fonctionnalités IA ne sont pas configurées sur ce serveur." },
      { status: 503 }
    );
  }

  let body: AiTask;
  try {
    body = (await req.json()) as AiTask;
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  try {
    switch (body.task) {
      case "replySuggestions":
      case "icebreaker": {
        const prompt =
          body.task === "replySuggestions"
            ? PROMPTS.replySuggestions(body.messages, body.profile, body.tone)
            : PROMPTS.icebreaker(body.profile, body.tone);
        return NextResponse.json(
          await generateJson({
            system: baseSystem(body.style),
            prompt,
            schema: {
              type: "object",
              properties: {
                suggestions: { ...STRINGS, minItems: "3", maxItems: "3" },
              },
              required: ["suggestions"],
            },
          })
        );
      }

      case "scamCheck":
        return NextResponse.json(
          await generateJson({
            system:
              "Tu es un détecteur d'arnaques pour une application de rencontre. Tu analyses des messages " +
              "reçus par l'utilisateur et tu signales uniquement des signaux d'arnaque réels et cités. " +
              "Tu es calibré pour éviter les faux positifs : dans le doute, tu ne signales rien. " +
              "Tu réponds exclusivement en JSON valide, en français.",
            prompt: PROMPTS.scamCheck(body.messages),
            schema: {
              type: "object",
              properties: {
                risk: { type: "string", format: "enum", enum: ["none", "low", "high"] },
                reasons: STRINGS,
              },
              required: ["risk", "reasons"],
            },
          })
        );

      case "conversationSummary":
        return NextResponse.json(
          await generateJson({
            system: baseSystem(body.style),
            prompt: PROMPTS.conversationSummary(body.messages),
            schema: {
              type: "object",
              properties: { summary: { type: "string" }, facts: STRINGS },
              required: ["summary", "facts"],
            },
          })
        );

      case "bioAssistant":
        return NextResponse.json(
          await generateJson({
            system: baseSystem(body.style),
            prompt: PROMPTS.bioAssistant(body.bio, body.tone),
            schema: {
              type: "object",
              properties: {
                variants: { ...STRINGS, minItems: "3", maxItems: "3" },
                warnings: STRINGS,
              },
              required: ["variants", "warnings"],
            },
          })
        );

      case "naturalSearch":
        return NextResponse.json(
          await generateJson({
            system:
              "Tu convertis une requête en langage naturel en filtres de recherche stricts. " +
              "Tu n'inventes jamais un filtre qui n'a pas été exprimé : dans ce cas la valeur est null. " +
              "Tu réponds exclusivement en JSON valide, en français.",
            prompt: PROMPTS.naturalSearch(body.query),
            schema: {
              type: "object",
              properties: {
                ageMin: { type: "integer", nullable: true },
                ageMax: { type: "integer", nullable: true },
                online: { type: "boolean", nullable: true },
                query: { type: "string", nullable: true },
                explanation: { type: "string" },
              },
              required: ["ageMin", "ageMax", "online", "query", "explanation"],
            },
          })
        );

      case "profileSummary":
        return NextResponse.json(
          await generateJson({
            system: baseSystem(body.style),
            prompt: PROMPTS.profileSummary(body.profile, body.me),
            schema: {
              type: "object",
              properties: { summary: { type: "string" }, commonPoints: STRINGS },
              required: ["summary", "commonPoints"],
            },
          })
        );

      default:
        return NextResponse.json({ error: "Tâche inconnue." }, { status: 400 });
    }
  } catch (err) {
    if (err instanceof AiUnavailableError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    return NextResponse.json({ error: "L'IA n'a pas pu répondre." }, { status: 502 });
  }
}
