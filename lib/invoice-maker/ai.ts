import Anthropic from "@anthropic-ai/sdk";
import { buildFallbackDraft, buildMessages, type FallbackInput } from "./fallback";
import {
  DEFAULT_NOTES,
  DEFAULT_TERMS,
  type InvoiceData,
  type InvoiceDraft,
  type InvoiceItem,
} from "./types";
import {
  calculateTotals,
  formatCurrency,
  generateInvoiceNumber,
  newItemId,
  normalizeAmountPaid,
  suggestInvoiceStatus,
  todayISO,
} from "./format";

const MINIMAX_MODEL = process.env.MINIMAX_MODEL?.trim() || "MiniMax-M3";
const MINIMAX_BASE_URL =
  process.env.MINIMAX_BASE_URL?.trim() || "https://api.minimax.io/anthropic";

const SYSTEM_PROMPT = `You are Invoice Maker, an expert invoice writer for freelancers and small studios.

Your job: turn a messy project description into a clean, client-ready invoice JSON.

TONE RULES (strict):
- Direct, professional, never abusive.
- No insults, no shame, no threats.
- Do not invent legal claims, tax obligations, jurisdiction rules, or qualifications.
- Do not add fake tax unless the user mentions tax/VAT/GST/sales tax.
- Do not promise payment guarantees.
- Keep reminders short, professional, and respectful.

PARSING RULES:
- Extract client name if mentioned (e.g. "Invoice Katie", "for Acme Labs", "to <Name>").
- Extract each service as a separate line item with description, quantity, unit price.
- If quantity is missing, default to 1.
- If currency is missing, default to USD unless the user mentions PKR, USD, CAD, GBP, EUR, AED, AUD, INR or symbols.
- If invoice number is missing, generate "INV-YYYY-NNN".
- If due date is missing, default to Net 7 from today.
- Discount: extract only if the user mentions "X% off" or "$X off" or "discount".
- Tax: extract only if the user mentions tax/VAT/GST/sales tax plus a percent.
- Notes/terms: keep short and professional. Empty string if not specified.
- Payment instructions: empty string unless the user provides bank details.

AMOUNT-PAID RULES (strict):
- "amountPaid" is always a non-negative number (never negative).
- If the user says "X% upfront paid" / "X% deposit paid" / "X% already received" with subtotal S, set amountPaid to round(S * X / 100, 2). Example: subtotal 450, "50% upfront paid" => amountPaid 225.
- If the user states a flat amount like "$225 already paid", use that as amountPaid.
- If nothing about payment is mentioned, amountPaid = 0.
- NEVER guess the total in messages. You will see the computed total/paid/balance below; copy must match those exact numbers.

REMINDER MESSAGES:
- emailSubject: clear, includes invoice number.
- emailBody: 3 to 5 sentences, friendly. If amountPaid > 0, mention the paid amount AND the remaining balance. If amountPaid = 0, mention the total.
- friendlyReminder: 1 sentence. If amountPaid > 0, mention the remaining balance. If amountPaid = 0, mention the total.
- firmReminder: 1 sentence, firm but respectful overdue notice. If amountPaid > 0, mention the remaining balance.
- whatsappMessage: 1 to 2 short sentences. Same paid/balance rules.
- In every message, the actual amount/balance number you write must be the value the user system computes from the invoice JSON. Never invent a different number.

OUTPUT RULES (strict):
- Return ONLY a single JSON object. No markdown. No preamble. No commentary.
- Match the requested tone (simple/premium/friendly/formal).
- All numeric values must be plain numbers, not strings.
- All string values must be plain strings.
- "taxable" must be true or false.
- "items" must be an array with at least 1 entry.

JSON SHAPE (return exactly this):
{
  "invoice": {
    "business": {
      "name": "string",
      "email": "string",
      "phone": "string",
      "address": "string",
      "website": "string",
      "paymentInstructions": "string"
    },
    "client": {
      "name": "string",
      "email": "string",
      "address": "string"
    },
    "meta": {
      "invoiceNumber": "string",
      "invoiceDate": "YYYY-MM-DD",
      "dueDate": "YYYY-MM-DD",
      "currency": "USD|CAD|GBP|EUR|PKR|AED|AUD|INR",
      "status": "Draft|Sent|Paid|Overdue",
      "reference": "string"
    },
    "items": [
      {
        "description": "string",
        "quantity": 1,
        "unitPrice": 100,
        "taxable": false
      }
    ],
    "discount": {"type":"none|fixed|percentage","value":0},
    "tax": {"label":"string","rate":0},
    "extraFees": 0,
    "amountPaid": 0,
    "notes": {"notes": "string", "terms": "string"}
  },
  "messages": {
    "emailSubject": "string",
    "emailBody": "string",
    "friendlyReminder": "string",
    "firmReminder": "string",
    "whatsappMessage": "string",
    "finalFilesMessage": "string"
  }
}`;

function safeStr(value: unknown, max = 400): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function safeNum(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.\-]/g, "");
    if (!cleaned) return fallback;
    const num = Number(cleaned);
    if (Number.isFinite(num)) return num;
  }
  return fallback;
}

function safeBool(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return false;
}

function sanitizeItems(raw: unknown): InvoiceItem[] {
  if (!Array.isArray(raw)) return [];
  const items: InvoiceItem[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const obj = entry as Record<string, unknown>;
    const description = safeStr(obj.description, 200);
    if (!description) continue;
    items.push({
      id: newItemId(),
      description,
      quantity: Math.max(0, safeNum(obj.quantity, 1)),
      unitPrice: Math.max(0, safeNum(obj.unitPrice, 0)),
      taxable: safeBool(obj.taxable),
    });
    if (items.length >= 25) break;
  }
  return items;
}

function sanitizeInvoice(raw: unknown): InvoiceData | null {
  if (!raw || typeof raw !== "object") return null;
  const root = raw as Record<string, unknown>;
  const invoice = root.invoice && typeof root.invoice === "object" ? (root.invoice as Record<string, unknown>) : null;
  if (!invoice) return null;

  const business = (invoice.business && typeof invoice.business === "object" ? invoice.business : {}) as Record<string, unknown>;
  const client = (invoice.client && typeof invoice.client === "object" ? invoice.client : {}) as Record<string, unknown>;
  const meta = (invoice.meta && typeof invoice.meta === "object" ? invoice.meta : {}) as Record<string, unknown>;
  const discount = (invoice.discount && typeof invoice.discount === "object" ? invoice.discount : {}) as Record<string, unknown>;
  const tax = (invoice.tax && typeof invoice.tax === "object" ? invoice.tax : {}) as Record<string, unknown>;
  const notes = (invoice.notes && typeof invoice.notes === "object" ? invoice.notes : {}) as Record<string, unknown>;

  const items = sanitizeItems(invoice.items);
  if (items.length === 0) return null;

  const currencyRaw = safeStr(meta.currency, 8).toUpperCase();
  const allowedCurrencies = ["USD", "CAD", "GBP", "EUR", "PKR", "AED", "AUD", "INR"];
  const currency = allowedCurrencies.includes(currencyRaw) ? currencyRaw : "USD";

  const statusRaw = safeStr(meta.status, 12);
  const allowedStatuses = ["Draft", "Sent", "Paid", "Overdue"];
  const status = allowedStatuses.includes(statusRaw) ? statusRaw : "Draft";

  const discountTypeRaw = safeStr(discount.type, 12);
  const allowedDiscountTypes = ["none", "fixed", "percentage"];
  const discountType = allowedDiscountTypes.includes(discountTypeRaw) ? discountTypeRaw : "none";

  const today = todayISO();
  const invoiceNumber = safeStr(meta.invoiceNumber, 32) || generateInvoiceNumber();
  const invoiceDate = safeStr(meta.invoiceDate, 10) || today;
  const dueDate = safeStr(meta.dueDate, 10) || invoiceDate;

  return {
    business: {
      name: safeStr(business.name, 120),
      email: safeStr(business.email, 200),
      phone: safeStr(business.phone, 60),
      address: safeStr(business.address, 400),
      website: safeStr(business.website, 200),
      paymentInstructions: safeStr(business.paymentInstructions, 800),
    },
    client: {
      name: safeStr(client.name, 120),
      email: safeStr(client.email, 200),
      address: safeStr(client.address, 400),
    },
    meta: {
      invoiceNumber,
      invoiceDate,
      dueDate,
      currency: currency as InvoiceData["meta"]["currency"],
      status: status as InvoiceData["meta"]["status"],
      reference: safeStr(meta.reference, 80),
    },
    items,
    discount: {
      type: discountType as InvoiceData["discount"]["type"],
      value: Math.max(0, safeNum(discount.value, 0)),
    },
    tax: {
      label: safeStr(tax.label, 40) || "Tax",
      rate: Math.max(0, safeNum(tax.rate, 0)),
    },
    extraFees: Math.max(0, safeNum(invoice.extraFees, 0)),
    amountPaid: normalizeAmountPaid(invoice.amountPaid),
    notes: {
      notes: safeStr(notes.notes, 1000) || DEFAULT_NOTES,
      terms: safeStr(notes.terms, 1000) || DEFAULT_TERMS,
    },
  };
}

function sanitizeMessages(raw: unknown): InvoiceDraft["messages"] {
  const root = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const messages =
    root.messages && typeof root.messages === "object"
      ? (root.messages as Record<string, unknown>)
      : root;
  return {
    emailSubject: safeStr(messages.emailSubject, 200),
    emailBody: safeStr(messages.emailBody, 2000),
    friendlyReminder: safeStr(messages.friendlyReminder, 500),
    firmReminder: safeStr(messages.firmReminder, 500),
    whatsappMessage: safeStr(messages.whatsappMessage, 500),
    finalFilesMessage: safeStr(messages.finalFilesMessage, 600),
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

export async function generateInvoiceDraft(
  input: FallbackInput,
): Promise<InvoiceDraft> {
  const fallback = buildFallbackDraft(input);

  const apiKey = process.env.MINIMAX_API_KEY?.trim();
  if (!apiKey) {
    return fallback;
  }

  const promptText = safeStr(input.prompt, 4000);
  if (!promptText) return fallback;

  const userPrompt = [
    `Tone: ${safeStr(input.tone, 20) || "simple"}`,
    `Business name: ${safeStr(input.businessName, 120) || "(none)"}`,
    `Client name hint: ${safeStr(input.clientName, 120) || "(none)"}`,
    `Currency hint: ${safeStr(input.currency, 8) || "(detect from prompt)"}`,
    `Payment terms hint: ${safeStr(input.paymentTerms, 40) || "(detect from prompt)"}`,
    `User description: ${promptText}`,
    `Today's date: ${todayISO()}`,
    "Return the JSON object only.",
  ].join("\n");

  try {
    const client = new Anthropic({ apiKey, baseURL: MINIMAX_BASE_URL });
    const message = await client.messages.create({
      model: MINIMAX_MODEL,
      max_tokens: 2500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = message.content
      .map((part) => (part.type === "text" ? part.text : ""))
      .join("")
      .trim();

    const parsed = extractJsonObject(text);
    const sanitizedInvoice = sanitizeInvoice(parsed);
    if (!sanitizedInvoice) return fallback;

    // Apply smart status suggestion so the AI draft respects overdue/paid logic
    // and never shows a negative amountPaid.
    const totals = calculateTotals(sanitizedInvoice);
    sanitizedInvoice.meta.status = suggestInvoiceStatus(
      sanitizedInvoice,
      totals,
      todayISO(),
    );

    const messages = sanitizeMessages(parsed);
    const total = totals.total;
    const totalDisplay = formatCurrency(total, sanitizedInvoice.meta.currency);
    const paidDisplay = formatCurrency(totals.amountPaid, sanitizedInvoice.meta.currency);
    const balanceDisplay = formatCurrency(totals.balanceDue, sanitizedInvoice.meta.currency);
    const hasPaid = totals.amountPaid > 0;

    // Build messages from the AI's sanitized invoice so paid/balance always
    // reflect the actual computed totals (not the fallback's possibly-buggy
    // regex-based item extraction).
    const localMessages = buildMessages(sanitizedInvoice, input.tone as never);

    const injectTotal = (text: string, fallback: string) => {
      if (!text) return fallback;
      // Replace any "<num> <CURRENCY>" or "<num><CURRENCY>" with the actual formatted total.
      let updated = text.replace(
        /\b\d[\d,]*(?:\.\d+)?\s*(USD|CAD|GBP|EUR|PKR|AED|AUD|INR)\b/g,
        totalDisplay,
      );
      // If the AI made up a bare number with a currency symbol, replace it too.
      updated = updated.replace(
        /\$\s*\d[\d,]*(?:\.\d+)?|\b\d[\d,]*(?:\.\d+)?\s*\$/g,
        totalDisplay,
      );
      return updated;
    };

    // When a partial payment exists, the AI is unreliable with paid/balance numbers.
    // Always rebuild the messages locally from the computed totals so the values match.
    const useLocalMessages = hasPaid;
    const finalEmailSubject =
      messages.emailSubject || localMessages.emailSubject;
    const finalEmailBody = useLocalMessages
      ? localMessages.emailBody
      : injectTotal(messages.emailBody, localMessages.emailBody);
    const finalFriendly = useLocalMessages
      ? localMessages.friendlyReminder
      : injectTotal(messages.friendlyReminder, localMessages.friendlyReminder);
    const finalFirm = useLocalMessages
      ? localMessages.firmReminder
      : injectTotal(messages.firmReminder, localMessages.firmReminder);
    const finalWhatsapp = useLocalMessages
      ? localMessages.whatsappMessage
      : injectTotal(messages.whatsappMessage, localMessages.whatsappMessage);
    const finalFinalFiles = useLocalMessages
      ? localMessages.finalFilesMessage
      : injectTotal(messages.finalFilesMessage, localMessages.finalFilesMessage);

    return {
      invoice: sanitizedInvoice,
      messages: {
        emailSubject: finalEmailSubject,
        emailBody: finalEmailBody,
        friendlyReminder: finalFriendly,
        firmReminder: finalFirm,
        whatsappMessage: finalWhatsapp,
        finalFilesMessage: finalFinalFiles,
      },
      source: "ai",
    };
  } catch {
    return fallback;
  }
}
