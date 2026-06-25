import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const MINIMAX_MODEL = process.env.MINIMAX_MODEL?.trim() || "MiniMax-M3";
const MINIMAX_BASE_URL =
  process.env.MINIMAX_BASE_URL?.trim() || "https://api.minimax.io/anthropic";

const MAX_CV_CHARS = 20000;
const MAX_JD_CHARS = 20000;

const SYSTEM_PROMPT = `You are a senior technical recruiter and ATS specialist with 15 years of experience reviewing resumes for Fortune 500 companies, startups, and ATS systems like Workday, Greenhouse, Lever, iCIMS, Taleo, and SuccessFactors.

Your job: review a candidate's CV and return a strict JSON object that a small web app will render as actionable suggestions. The candidate will then decide which suggestions to apply.

RULES:
- Return ONLY a single valid JSON object. No markdown fences, no commentary, no preamble.
- Be specific. Every reason, rationale, and note must reference something concrete from the CV text (e.g. "Section header 'Where I've Worked' is not a standard ATS label", "Bullet 'helped the team' uses a weak verb and lacks a metric").
- Do not invent facts. If a section is missing, say it's missing. Do not fabricate experience, employers, dates, or skills.
- Do not strengthen weak claims into strong ones. If a bullet says "helped increase sales", the suggested rewrite should say "contributed to a sales increase" or similar, not "drove a 200% sales increase".
- Do not add slang, jokes, metaphors, or invented context.
- Never use em dashes in any string value.
- Do not start two consecutive sentences with the same word.

WHEN A JOB DESCRIPTION IS PROVIDED:
- Score role-fit separately from ATS-format score. The two scores are different.
- The roleFit.missingKeywords array should contain real keywords from the JD that are absent from the CV. Maximum 12 entries, each 1-3 words, lowercase.
- The roleFit.notes should be 2-4 short observations (one sentence each) about how well the CV's experience matches the JD's requirements. Do not pad.

WHEN NO JOB DESCRIPTION IS PROVIDED:
- Skip the roleFit block entirely. Do not return it as null or empty.
- Focus the review on ATS-friendliness, clarity, and impact of the existing content.

SECTION GUIDANCE:
- summary: if missing or weak, suggest a 2-3 sentence professional summary that mirrors the candidate's actual experience. The suggested text MUST be grounded in facts already in the CV.
- experience: for each work entry that has bullets, return one suggestion per work entry (index 0-based into the work entries array). If a work entry has no bullets or the bullets are strong, you may omit it. The suggested bullets should be 3-5 short bullets, each starting with a strong action verb and including a concrete metric or outcome when possible. Preserve the original meaning.
- skills: only suggest a skills rewrite if the current skills list is empty, poorly organized, or clearly missing categories. Otherwise omit.
- education: only suggest if there is a clear issue (missing graduation year, missing degree, etc.). Otherwise omit.
- formatting: 0-5 short notes about ATS-formatting issues that are NOT section rewrites (e.g. "Uses tables which most ATS systems cannot parse", "Section headers in ALL CAPS may confuse some ATS systems", "Contact info missing LinkedIn URL"). Each note one sentence.

SCORING:
- The top-level score (0-100) reflects ATS-friendliness and clarity. It is NOT a job-match score.
- 0-30: major structural issues, missing standard sections, or content that ATS systems will likely fail to parse.
- 31-60: parseable but with several issues that hurt ranking (weak verbs, missing metrics, non-standard headers).
- 61-80: solid, ATS-friendly, with minor improvements possible.
- 81-100: clean, well-structured, strong action verbs, quantified impact.
- Be honest. Do not inflate scores. Most real CVs land in 40-70.

JSON SHAPE (return exactly this, with optional fields omitted if not applicable):
{
  "score": number,
  "reasons": string[],
  "roleFit"?: {
    "score": number,
    "missingKeywords": string[],
    "notes": string[]
  },
  "sections": {
    "summary"?: {
      "current": string,
      "suggested": string,
      "rationale": string
    },
    "experience"?: Array<{
      "index": number,
      "currentBullets": string,
      "suggestedBullets": string,
      "rationale": string
    }>,
    "skills"?: {
      "current": string,
      "suggested": string,
      "rationale": string
    },
    "education"?: {
      "current": string,
      "suggested": string,
      "rationale": string
    },
    "formatting"?: string[]
  }
}`;

function stripMarkdownFences(text: string): string {
  const trimmed = text.trim();
  // Remove a single leading ```json or ``` line and a single trailing ``` line.
  const fenceMatch = trimmed.match(/^```(?:json)?\s*\n([\s\S]*?)\n```\s*$/i);
  if (fenceMatch) return fenceMatch[1].trim();
  return trimmed;
}

function safeNumber(value: unknown, min: number, max: number): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const clamped = Math.max(min, Math.min(max, Math.round(value)));
  return clamped;
}

function safeStringArray(value: unknown, maxLen: number): string[] | null {
  if (!Array.isArray(value)) return null;
  const result: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    const trimmed = item.trim();
    if (!trimmed) continue;
    if (trimmed.length > maxLen) continue;
    result.push(trimmed);
  }
  return result;
}

function validateReview(parsed: unknown): {
  ok: boolean;
  reason?: string;
  data?: Record<string, unknown>;
} {
  if (!parsed || typeof parsed !== "object") {
    return { ok: false, reason: "response is not an object" };
  }
  const obj = parsed as Record<string, unknown>;
  const score = safeNumber(obj.score, 0, 100);
  if (score === null) return { ok: false, reason: "score missing or invalid" };
  const reasons = safeStringArray(obj.reasons, 200);
  if (!reasons || reasons.length === 0) {
    return { ok: false, reason: "reasons missing or empty" };
  }
  if (reasons.length > 8) reasons.length = 8;
  return { ok: true, data: { score, reasons } };
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { cvText, jobDescription } = body as {
    cvText?: unknown;
    jobDescription?: unknown;
  };

  if (typeof cvText !== "string" || cvText.trim().length < 100) {
    return NextResponse.json(
      { error: "Please paste at least 100 characters of CV text." },
      { status: 400 }
    );
  }
  if (cvText.length > MAX_CV_CHARS) {
    return NextResponse.json(
      { error: `CV text is too long (max ${MAX_CV_CHARS} characters).` },
      { status: 400 }
    );
  }

  let jdText = "";
  if (jobDescription !== undefined && jobDescription !== null) {
    if (typeof jobDescription !== "string") {
      return NextResponse.json(
        { error: "jobDescription must be a string if provided" },
        { status: 400 }
      );
    }
    jdText = jobDescription.trim();
    if (jdText.length > MAX_JD_CHARS) {
      return NextResponse.json(
        { error: `Job description is too long (max ${MAX_JD_CHARS} characters).` },
        { status: 400 }
      );
    }
  }

  const apiKey = process.env.MINIMAX_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "MINIMAX_API_KEY is not set. Add it to .env.local and restart the server.",
      },
      { status: 503 }
    );
  }

  const userMessage = jdText
    ? `CV to review:\n\n${cvText}\n\n---\n\nTarget job description:\n\n${jdText}`
    : `CV to review:\n\n${cvText}`;

  try {
    const client = new Anthropic({ apiKey, baseURL: MINIMAX_BASE_URL });
    const message = await client.messages.create({
      model: MINIMAX_MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const raw = message.content
      .map((part) => (part.type === "text" ? part.text : ""))
      .join("")
      .trim();

    const cleaned = stripMarkdownFences(raw);
    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch (err) {
      console.error(
        "[ats-review] model did not return valid JSON",
        err instanceof Error ? err.message : err
      );
      return NextResponse.json(
        {
          error:
            "The AI returned an unexpected response. Please try again, or shorten your CV/job description.",
        },
        { status: 502 }
      );
    }

    const validation = validateReview(parsed);
    if (!validation.ok || !validation.data) {
      console.error("[ats-review] validation failed:", validation.reason);
      return NextResponse.json(
        {
          error:
            "The AI response was missing required fields. Please try again.",
        },
        { status: 502 }
      );
    }

    // Pass through the rest of the optional fields. We've already validated
    // score and reasons. Other fields are best-effort.
    const obj = parsed as Record<string, unknown>;
    const sections = (obj.sections && typeof obj.sections === "object"
      ? (obj.sections as Record<string, unknown>)
      : null);

    const result: Record<string, unknown> = validation.data;

    if (jdText) {
      const roleFitRaw =
        obj.roleFit && typeof obj.roleFit === "object"
          ? (obj.roleFit as Record<string, unknown>)
          : null;
      if (roleFitRaw) {
        const rfScore = safeNumber(roleFitRaw.score, 0, 100);
        const missing =
          safeStringArray(roleFitRaw.missingKeywords, 40) || [];
        const notes = safeStringArray(roleFitRaw.notes, 300) || [];
        if (rfScore !== null) {
          result.roleFit = {
            score: rfScore,
            missingKeywords: missing.slice(0, 12),
            notes: notes.slice(0, 4),
          };
        }
      }
    }

    if (sections) {
      const out: Record<string, unknown> = {};

      const summaryRaw = sections.summary as
        | Record<string, unknown>
        | undefined;
      if (
        summaryRaw &&
        typeof summaryRaw.current === "string" &&
        typeof summaryRaw.suggested === "string" &&
        typeof summaryRaw.rationale === "string"
      ) {
        out.summary = {
          current: summaryRaw.current,
          suggested: summaryRaw.suggested,
          rationale: summaryRaw.rationale,
        };
      }

      const experienceRaw = Array.isArray(sections.experience)
        ? (sections.experience as unknown[])
        : null;
      if (experienceRaw) {
        const exp: Array<{
          index: number;
          currentBullets: string;
          suggestedBullets: string;
          rationale: string;
        }> = [];
        for (const item of experienceRaw) {
          if (!item || typeof item !== "object") continue;
          const it = item as Record<string, unknown>;
          const idx = safeNumber(it.index, 0, 50);
          if (idx === null) continue;
          if (
            typeof it.currentBullets === "string" &&
            typeof it.suggestedBullets === "string" &&
            typeof it.rationale === "string"
          ) {
            exp.push({
              index: idx,
              currentBullets: it.currentBullets,
              suggestedBullets: it.suggestedBullets,
              rationale: it.rationale,
            });
          }
        }
        if (exp.length > 0) out.experience = exp;
      }

      const skillsRaw = sections.skills as
        | Record<string, unknown>
        | undefined;
      if (
        skillsRaw &&
        typeof skillsRaw.current === "string" &&
        typeof skillsRaw.suggested === "string" &&
        typeof skillsRaw.rationale === "string"
      ) {
        out.skills = {
          current: skillsRaw.current,
          suggested: skillsRaw.suggested,
          rationale: skillsRaw.rationale,
        };
      }

      const eduRaw = sections.education as
        | Record<string, unknown>
        | undefined;
      if (
        eduRaw &&
        typeof eduRaw.current === "string" &&
        typeof eduRaw.suggested === "string" &&
        typeof eduRaw.rationale === "string"
      ) {
        out.education = {
          current: eduRaw.current,
          suggested: eduRaw.suggested,
          rationale: eduRaw.rationale,
        };
      }

      const formatting = safeStringArray(sections.formatting, 300);
      if (formatting && formatting.length > 0) {
        out.formatting = formatting.slice(0, 5);
      }

      if (Object.keys(out).length > 0) {
        result.sections = out;
      }
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown ATS review error";
    console.error("[ats-review] review failed:", message);
    return NextResponse.json(
      { error: `ATS review failed: ${message}` },
      { status: 502 }
    );
  }
}
