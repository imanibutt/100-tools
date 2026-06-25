import { NextResponse } from "next/server";
import { generateReminderMessage, type AIReminderInput } from "@/lib/brutal-reminder/ai";
import type { ReminderCadence, ReminderTone } from "@/lib/brutal-reminder/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function isTone(value: string): value is ReminderTone {
  return value === "normal" || value === "brutal";
}

function isCadence(value: string): value is ReminderCadence {
  return value === "daily" || value === "weekdays" || value === "weekly";
}

export async function POST(request: Request) {
  let body: {
    goal?: unknown;
    whyItMatters?: unknown;
    excuse?: unknown;
    firstStep?: unknown;
    tone?: unknown;
    cadence?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const goal = clean(body.goal, 500);
  const whyItMatters = clean(body.whyItMatters, 500);
  const excuse = clean(body.excuse, 400);
  const firstStep = clean(body.firstStep, 400);
  const toneRaw = clean(body.tone, 20);
  const cadenceRaw = clean(body.cadence, 20);

  if (!goal) {
    return NextResponse.json({ error: "Add the goal that actually matters." }, { status: 400 });
  }

  if (!isTone(toneRaw)) {
    return NextResponse.json({ error: "Tone must be normal or brutal." }, { status: 400 });
  }

  if (!isCadence(cadenceRaw)) {
    return NextResponse.json({ error: "Cadence must be daily, weekdays, or weekly." }, { status: 400 });
  }

  const input: AIReminderInput = {
    goal,
    whyItMatters: whyItMatters || undefined,
    excuse: excuse || undefined,
    firstStep: firstStep || undefined,
    tone: toneRaw,
    cadence: cadenceRaw,
  };

  try {
    const message = await generateReminderMessage(input);
    return NextResponse.json({
      ok: true,
      source: message.source,
      message,
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "AI generation failed.";
    return NextResponse.json(
      {
        ok: false,
        error: reason,
        message: null,
      },
      { status: 500 },
    );
  }
}
