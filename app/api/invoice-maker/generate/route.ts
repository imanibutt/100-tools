import { NextResponse } from "next/server";
import { generateInvoiceDraft } from "@/lib/invoice-maker/ai";
import {
  SUPPORTED_CURRENCIES,
  SUPPORTED_TONES,
  type InvoiceCurrency,
  type InvoiceTone,
} from "@/lib/invoice-maker/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(value: unknown, max = 4000): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function isTone(value: unknown): value is InvoiceTone {
  return typeof value === "string" && (SUPPORTED_TONES as string[]).includes(value);
}

function isCurrency(value: unknown): value is InvoiceCurrency {
  return (
    typeof value === "string" &&
    (SUPPORTED_CURRENCIES as string[]).includes(value)
  );
}

export async function POST(request: Request) {
  let body: {
    prompt?: unknown;
    businessName?: unknown;
    clientName?: unknown;
    currency?: unknown;
    tone?: unknown;
    paymentTerms?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const prompt = clean(body.prompt, 4000);
  if (!prompt) {
    return NextResponse.json(
      { error: "Describe the invoice before generating." },
      { status: 400 },
    );
  }

  const tone = isTone(body.tone) ? body.tone : "simple";
  const currency = isCurrency(body.currency) ? body.currency : undefined;

  try {
    const draft = await generateInvoiceDraft({
      prompt,
      businessName: clean(body.businessName, 120) || undefined,
      clientName: clean(body.clientName, 120) || undefined,
      currency,
      tone,
      paymentTerms: clean(body.paymentTerms, 40) || undefined,
    });

    const warnings: string[] = [];
    if (draft.source === "fallback") {
      warnings.push("AI is unavailable — drafted using fallback parsing rules.");
    }
    if (!draft.invoice.client.name.trim()) {
      warnings.push("Add a client name to make this invoice complete.");
    }
    if (
      draft.invoice.items.length === 0 ||
      draft.invoice.items.every((it) => it.unitPrice <= 0)
    ) {
      warnings.push("Add at least one line item with an amount.");
    }

    return NextResponse.json({
      ok: true,
      source: draft.source,
      draft,
      warnings,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invoice could not be generated.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
