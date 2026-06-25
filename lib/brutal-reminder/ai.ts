import Anthropic from "@anthropic-ai/sdk";
import { getReminderSubject } from "./content";

export type AIReminderInput = {
  goal: string;
  whyItMatters?: string;
  excuse?: string;
  firstStep?: string;
  tone: "normal" | "brutal";
  cadence: "daily" | "weekdays" | "weekly";
};

export type AIReminderVariation = {
  title: string;
  body: string;
};

export type AIReminderMessage = {
  cleanGoal: string;
  smallStep: string;
  notificationTitle: string;
  notificationBody: string;
  realityCheck: string;
  encouragement: string;
  variations: AIReminderVariation[];
  doneMessage: string;
  snoozeMessage: string;
  notYetMessage: string;
  source: "ai" | "fallback";
};

const MINIMAX_MODEL = process.env.MINIMAX_MODEL?.trim() || "MiniMax-M3";
const MINIMAX_BASE_URL =
  process.env.MINIMAX_BASE_URL?.trim() || "https://api.minimax.io/anthropic";

const SYSTEM_PROMPT = `You are Brutal Reminder, an honest, direct accountability coach.

Your job: turn a user's messy goal into ONE small daily action and write a short, sharp browser notification that helps them do it today.

TONE RULES (strict):
- Direct, never abusive.
- No insults, no shaming, no diagnosis of mental health, addiction, weight, or personal issues.
- No pressure that could harm (no self-harm, no threats, no coercion).
- No fake claims, no fake quotes, no fake credentials.
- No long motivational speeches. No "you got this" filler. No exclamation marks.
- Brutal means honest, sharp, practical, no-excuse, still respectful.
- Keep the user's own goal, meaning, and constraint in their words when possible.

OUTPUT RULES (strict):
- Return ONLY a single JSON object. No markdown. No preamble. No commentary.
- Match the requested tone ("normal" = calm, supportive; "brutal" = sharp, honest).
- notificationTitle: 3 to 7 words, no emojis, no period.
- notificationBody: 1 to 2 short sentences, max 140 characters.
- realityCheck: 1 sentence, max 140 characters, no insults.
- encouragement: 1 sentence after a "done", short and real, no praise inflation.
- variations: between 5 and 7 entries. Each title 3 to 7 words. Each body max 140 chars. Distinct angles on the same step.
- doneMessage: 1 short sentence the user sees after they tap Done.
- notYetMessage: 1 short sentence that asks for honesty, no shame.
- snoozeMessage: 1 short sentence that acknowledges a snooze, no judgment.
- smallStep: rewrite the smallest useful step in 5 to 15 words, action verb first, concrete.
- cleanGoal: rewrite the goal in 6 to 14 words, action-oriented, removes fluff.
- Never include the user email, timezone, or any private data.

JSON SHAPE (return exactly this):
{
  "cleanGoal": "string",
  "smallStep": "string",
  "notificationTitle": "string",
  "notificationBody": "string",
  "realityCheck": "string",
  "encouragement": "string",
  "variations": [{"title":"string","body":"string"}],
  "doneMessage": "string",
  "notYetMessage": "string",
  "snoozeMessage": "string"
}`;

function safeStr(value: unknown, max = 240) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function clampLen(value: string, max: number) {
  if (value.length <= max) return value;
  return value.slice(0, max - 1).trimEnd() + "…";
}

function shortStep(value: string) {
  return clampLen(value.replace(/\s+/g, " ").trim(), 140);
}

function buildFallback(input: AIReminderInput): AIReminderMessage {
  const cleanGoalRaw = safeStr(input.goal, 200).replace(/\s+/g, " ").trim();
  const smallStepRaw = safeStr(input.firstStep, 400) || "Do the smallest visible action for 10 minutes.";
  const excuse = safeStr(input.excuse, 200);
  const why = safeStr(input.whyItMatters, 200);
  const isBrutal = input.tone === "brutal";

  const cleanGoal = clampLen(cleanGoalRaw || "Move one step forward today.", 100);
  const smallStep = shortStep(smallStepRaw);

  const baseTitle = getReminderSubject(isBrutal ? "brutal" : "normal");
  const defaultBody = shortStep(
    `${smallStep.charAt(0).toUpperCase() + smallStep.slice(1)}. ${excuse ? excuse + " loses today." : "Distraction can wait."}`,
  );

  const realityCheck = isBrutal
    ? clampLen(
        excuse
          ? `${excuse} is not the enemy. Doing nothing while saying it is.`
          : "Doing nothing while planning to do something still counts as nothing.",
        140,
      )
    : clampLen(
        why
          ? `You said this matters: ${why}. One small step honors that.`
          : "You do not need to finish today. You need to start today.",
        140,
      );

  const encouragement = isBrutal
    ? "Done. That is the kind of action the next you needed."
    : "Done. One more step than yesterday. Keep the streak small and real.";

  const variations: AIReminderVariation[] = [
    {
      title: baseTitle,
      body: defaultBody,
    },
    {
      title: "One small step",
      body: shortStep(`${smallStep}. 10 minutes. Then decide.`),
    },
    {
      title: isBrutal ? "Distraction is waiting" : "Your goal is waiting",
      body: shortStep(
        isBrutal
          ? `${smallStep}. Scrolling will still be there after.`
          : `${smallStep}. It is the only thing on the list today.`,
      ),
    },
    {
      title: "Start the timer",
      body: shortStep(`Set a 10-minute timer. ${smallStep}. Stop when the timer stops.`),
    },
    {
      title: isBrutal ? "No story. Just the step." : "Today's move",
      body: shortStep(`${smallStep}.`),
    },
    {
      title: "Did you do it?",
      body: shortStep(
        isBrutal
          ? `Honest answer only. ${smallStep}.`
          : `Tap one of the three buttons after you ${smallStep.toLowerCase()}.`,
      ),
    },
    {
      title: isBrutal ? "Stop negotiating" : "Quick check-in",
      body: shortStep(isBrutal ? `${smallStep}. Now.` : `Ready when you are. ${smallStep}.`),
    },
  ];

  return {
    cleanGoal,
    smallStep,
    notificationTitle: clampLen(baseTitle, 70),
    notificationBody: defaultBody,
    realityCheck,
    encouragement,
    variations: variations.slice(0, 7),
    doneMessage: "Done recorded. That step counts.",
    notYetMessage: "Not yet recorded. Be honest, then make the step smaller.",
    snoozeMessage: "Snoozed. We will ask again in a few hours.",
    source: "fallback",
  };
}

function sanitizeOutput(raw: unknown, input: AIReminderInput): AIReminderMessage | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;

  const cleanGoal = safeStr(data.cleanGoal, 200);
  const smallStep = safeStr(data.smallStep, 400);
  const notificationTitle = safeStr(data.notificationTitle, 70);
  const notificationBody = safeStr(data.notificationBody, 200);
  const realityCheck = safeStr(data.realityCheck, 200);
  const encouragement = safeStr(data.encouragement, 200);
  const doneMessage = safeStr(data.doneMessage, 200);
  const snoozeMessage = safeStr(data.snoozeMessage, 200);
  const notYetMessage = safeStr(data.notYetMessage, 200);

  if (!cleanGoal || !smallStep || !notificationTitle || !notificationBody) {
    return null;
  }

  const variationsRaw = Array.isArray(data.variations) ? data.variations : [];
  const variations: AIReminderVariation[] = [];
  for (const item of variationsRaw) {
    if (!item || typeof item !== "object") continue;
    const title = safeStr((item as Record<string, unknown>).title, 70);
    const body = safeStr((item as Record<string, unknown>).body, 200);
    if (title && body) {
      variations.push({ title, body });
    }
    if (variations.length >= 7) break;
  }

  if (variations.length < 5) return null;

  return {
    cleanGoal,
    smallStep: shortStep(smallStep),
    notificationTitle: clampLen(notificationTitle, 70),
    notificationBody: clampLen(notificationBody, 140),
    realityCheck: clampLen(realityCheck, 140),
    encouragement: clampLen(encouragement || "Done. One step closer.", 140),
    variations,
    doneMessage: clampLen(doneMessage || "Done recorded.", 200),
    snoozeMessage: clampLen(snoozeMessage || "Snoozed. Reminder will return.", 200),
    notYetMessage: clampLen(notYetMessage || "Not yet. Make the step smaller.", 200),
    source: "ai",
  };
}

function extractJsonObject(text: string): unknown {
  if (!text) return null;
  const trimmed = text.trim();

  const direct = (() => {
    try {
      return JSON.parse(trimmed);
    } catch {
      return null;
    }
  })();
  if (direct) return direct;

  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch {
      return null;
    }
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    try {
      return JSON.parse(trimmed.slice(start, end + 1));
    } catch {
      return null;
    }
  }

  return null;
}

export async function generateReminderMessage(
  input: AIReminderInput,
): Promise<AIReminderMessage> {
  const fallback = buildFallback(input);

  const apiKey = process.env.MINIMAX_API_KEY?.trim();
  if (!apiKey) {
    return fallback;
  }

  const userPrompt = [
    `Tone: ${input.tone}`,
    `Cadence: ${input.cadence}`,
    `Goal: ${safeStr(input.goal, 400) || "(none)"}`,
    `Why it matters: ${safeStr(input.whyItMatters, 400) || "(none)"}`,
    `Biggest distraction or excuse: ${safeStr(input.excuse, 400) || "(none)"}`,
    `Smallest useful step (user wrote): ${safeStr(input.firstStep, 400) || "(none)"}`,
    "Return the JSON object only.",
  ].join("\n");

  try {
    const client = new Anthropic({ apiKey, baseURL: MINIMAX_BASE_URL });
    const message = await client.messages.create({
      model: MINIMAX_MODEL,
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = message.content
      .map((part) => (part.type === "text" ? part.text : ""))
      .join("")
      .trim();

    const parsed = extractJsonObject(text);
    const sanitized = sanitizeOutput(parsed, input);

    if (sanitized) {
      return sanitized;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

export function buildFallbackMessage(input: AIReminderInput): AIReminderMessage {
  return buildFallback(input);
}
