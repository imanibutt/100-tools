import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

const SYSTEM_PROMPTS: Record<string, string> = {
  standard: `You are a writing editor that polishes rough drafts into clear, natural, professional prose.

RULES:
- Preserve the original meaning, facts, claims, arguments, and structure. Do not add, remove, or invent any claim, example, statistic, or piece of context.
- Do not exaggerate or downplay the source. Preserve the intensity of every word: "very good" must stay "very good" (it must not become "highly effective"); "bad" must stay "bad" (it must not become "terrible"). Do not strengthen weak claims or weaken strong ones.
- Tighten awkward phrasing. Replace wordy or clunky constructions with clearer ones of similar length and formality.
- Vary sentence length for readability while staying in the same register the author uses.
- Keep the author's voice. Do not insert filler phrases ("to be fair", "honestly", "the thing is"), casual interjections, rhetorical questions, first-person statements, or transitions the source did not use.
- Preserve the source's level of formality. Do not make the text more casual than the original.
- Do not add slang, jokes, metaphors, or invented context.
- Never use em dashes.
- Do not start two consecutive sentences with the same word.
- Output ONLY the revised text, no explanations or preamble.`,

  aggressive: `You are a writing editor that substantially rewrites rough drafts for clarity, directness, and natural flow.

RULES:
- Preserve every fact, claim, statistic, and named entity from the source. Do not add new examples, hypotheticals, jokes, metaphors, invented context, or claims the author did not make.
- Preserve the intensity of every claim. While you restructure, do not strengthen weak claims or weaken strong ones. The author's stance on the subject must come through unchanged.
- Restructure sentences and paragraphs aggressively. Reorder clauses, split long sentences, and combine fragments, but keep all original content.
- Use plain, direct language. Prefer active voice and short, concrete words.
- Use contractions freely for a conversational tone.
- Add light hedging ("probably", "seems like", "in most cases") only where it fits without changing the meaning.
- Vary paragraph length for rhythm. One-sentence paragraphs are fine.
- Keep the author's overall point of view and conclusion. Do not insert rhetorical questions, first-person asides, or filler the source did not have.
- Do not add slang, jokes, metaphors, or invented context.
- Never use em dashes.
- Output ONLY the revised text, no explanations or preamble.`,

  academic: `You are a writing editor that polishes academic drafts into formal, concise, well-structured prose.

RULES:
- Preserve the author's argument, thesis, evidence, citations, and any specific sources. Do not invent studies, citations, statistics, claims, or examples.
- Preserve the intensity of every claim. Hedge where the source hedges; do not introduce or strengthen hedges on specific factual claims, and do not strengthen weak academic claims into strong ones.
- Keep academic vocabulary, technical terms, and field-specific phrasing intact.
- Use formal, polished prose. Avoid casual transitions, contractions, colloquialisms, rhetorical questions, and filler phrases.
- Use passive voice only when the source uses it or when it is conventional for the field.
- Use precise hedging language ("This suggests", "It appears that", "There is evidence that") where appropriate, but do not weaken specific claims into vague ones.
- Vary sentence length for readability. Mix simple and complex sentences.
- Keep the source's paragraph structure and section order. You may split or merge paragraphs only when it clearly improves clarity.
- Do not add slang, jokes, metaphors, or invented context.
- Never use em dashes.
- Output ONLY the revised text, no explanations or preamble.`,
};

const OPENAI_MODEL = process.env.HUMANPASS_OPENAI_MODEL || "gpt-5.5";
const ANTHROPIC_MODEL =
  process.env.HUMANPASS_ANTHROPIC_MODEL || "claude-sonnet-4-5-20250514";
const MINIMAX_MODEL = process.env.MINIMAX_MODEL?.trim() || "MiniMax-M3";
const MINIMAX_BASE_URL =
  process.env.MINIMAX_BASE_URL?.trim() || "https://api.minimax.io/anthropic";

function extractOpenAIText(data: any): string {
  if (typeof data.output_text === "string") return data.output_text;

  const chunks: string[] = [];
  for (const item of data.output ?? []) {
    for (const part of item.content ?? []) {
      if (typeof part.text === "string") chunks.push(part.text);
    }
  }
  return chunks.join("").trim();
}

async function rewriteWithOpenAI(systemPrompt: string, text: string) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      instructions: systemPrompt,
      input: `Revise this draft so it reads naturally and clearly while preserving the meaning:\n\n${text}`,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI rewrite failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  return extractOpenAIText(data);
}

async function rewriteWithAnthropic(systemPrompt: string, text: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return null;

  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Revise this draft so it reads naturally and clearly while preserving the meaning:\n\n${text}`,
      },
    ],
  });

  return message.content
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();
}

async function rewriteWithMiniMax(systemPrompt: string, text: string) {
  const apiKey = process.env.MINIMAX_API_KEY?.trim();
  if (!apiKey) return null;

  const client = new Anthropic({ apiKey, baseURL: MINIMAX_BASE_URL });
  const message = await client.messages.create({
    model: MINIMAX_MODEL,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Revise this draft so it reads naturally and clearly while preserving the meaning:\n\n${text}`,
      },
    ],
  });

  return message.content
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();
}

export async function POST(req: NextRequest) {
  const { text, mode = "standard" } = await req.json();

  if (!text || typeof text !== "string") {
    return new Response(JSON.stringify({ error: "No text provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const systemPrompt = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.standard;

  try {
    const provider = process.env.HUMANPASS_PROVIDER || "minimax";
    let rewritten: string | null = null;

    if (provider === "openai") {
      rewritten = await rewriteWithOpenAI(systemPrompt, text);
    } else if (provider === "anthropic") {
      rewritten = await rewriteWithAnthropic(systemPrompt, text);
    } else if (provider === "minimax") {
      rewritten = await rewriteWithMiniMax(systemPrompt, text);
      if (!rewritten) {
        return new Response(
          "HumanPass is configured with HUMANPASS_PROVIDER=minimax but MINIMAX_API_KEY is not set. Add MINIMAX_API_KEY to .env.local and restart the server.",
          {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          }
        );
      }
    } else {
      return new Response(
        `HumanPass received an unknown HUMANPASS_PROVIDER value: "${provider}". Use one of: minimax, openai, anthropic.`,
        {
          status: 500,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        }
      );
    }

    if (!rewritten) {
      return new Response(
        "HumanPass needs OPENAI_API_KEY, ANTHROPIC_API_KEY, or MINIMAX_API_KEY in the service environment.",
        {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        }
      );
    }

    return new Response(rewritten, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown rewrite error";
    console.error("[humanpass] rewrite failed", message);
    return new Response(`HumanPass rewrite failed: ${message}`, {
      status: 502,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
