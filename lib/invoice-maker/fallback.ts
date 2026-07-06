import type {
  InvoiceCurrency,
  InvoiceData,
  InvoiceDraft,
  InvoiceItem,
  InvoiceMessages,
  InvoiceStatus,
  InvoiceTone,
} from "./types";
import { DEFAULT_NOTES, DEFAULT_TERMS } from "./types";
import {
  addDaysISO,
  calculateTotals,
  detectCurrencyFromText,
  formatCurrency,
  generateInvoiceNumber,
  newItemId,
  normalizeAmountPaid,
  paymentTermsToDays,
  safeNumber,
  suggestInvoiceStatus,
  todayISO,
} from "./format";

export type FallbackInput = {
  prompt: string;
  businessName?: string;
  clientName?: string;
  currency?: string;
  tone?: string;
  paymentTerms?: string;
};

const CURRENCY_NAMES: Record<InvoiceCurrency, string> = {
  USD: "US Dollar",
  CAD: "Canadian Dollar",
  GBP: "British Pound",
  EUR: "Euro",
  PKR: "Pakistani Rupee",
  AED: "UAE Dirham",
  AUD: "Australian Dollar",
  INR: "Indian Rupee",
};

const TONE_TO_BUSINESS_TONE: Record<InvoiceTone, string> = {
  simple: "Hi",
  friendly: "Hey",
  formal: "Dear",
  premium: "Hello",
};

function clean(value: unknown, max = 400): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function normalizeTone(value: unknown): InvoiceTone {
  const v = (typeof value === "string" ? value : "").toLowerCase();
  if (v === "simple" || v === "premium" || v === "friendly" || v === "formal") return v;
  return "simple";
}

function normalizeStatus(value: unknown): InvoiceStatus {
  const v = (typeof value === "string" ? value : "").toLowerCase();
  if (v === "paid" || v === "sent" || v === "overdue") {
    return v[0].toUpperCase() + v.slice(1) as InvoiceStatus;
  }
  return "Draft";
}

function normalizeCurrency(value: unknown, fallback: InvoiceCurrency): InvoiceCurrency {
  if (typeof value !== "string") return fallback;
  const upper = value.trim().toUpperCase();
  if (["USD", "CAD", "GBP", "EUR", "PKR", "AED", "AUD", "INR"].includes(upper)) {
    return upper as InvoiceCurrency;
  }
  return fallback;
}

/** Pull a numeric amount from text. Matches "$450", "450 USD", "USD 600", etc. */
function findAmounts(text: string): number[] {
  if (!text) return [];
  const matches: number[] = [];
  const re = /(?:[\$£€₹₨]|USD|CAD|GBP|EUR|PKR|AED|AUD|INR)?\s*([0-9]{1,3}(?:[,\s][0-9]{3})*(?:\.[0-9]+)?|[0-9]+(?:\.[0-9]+)?)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const raw = (m[1] || "").replace(/[,\s]/g, "");
    const num = Number(raw);
    if (Number.isFinite(num) && num > 0 && num < 1_000_000) {
      matches.push(num);
    }
  }
  return matches;
}

/** Split prompt into plausible line-item chunks. */
function splitIntoSegments(prompt: string): string[] {
  if (!prompt) return [];
  // Split on commas, semicolons, periods, or newlines — but keep numbering.
  const segments = prompt
    .split(/[\n;]+|(?:,\s*(?=and|also|plus|then|next))|(?<=\.)\s+/i)
    .map((s) => s.trim())
    .filter(Boolean);
  return segments.length > 0 ? segments : [prompt];
}

function extractItemFromSegment(segment: string, fallbackCurrency: InvoiceCurrency): InvoiceItem | null {
  if (!segment) return null;
  // Look for "<description> ... $<amount>" or "<description> ... <amount> USD"
  const amounts = findAmounts(segment);
  if (amounts.length === 0) return null;

  const amount = amounts[amounts.length - 1];

  // Description = text before the matched amount, stripped of leading bullets/dashes/numbers
  const description = segment
    .replace(/\$?\s*[0-9]{1,3}(?:[,\s][0-9]{3})*(?:\.[0-9]+)?|[0-9]+(?:\.[0-9]+)?\s*(?:USD|CAD|GBP|EUR|PKR|AED|AUD|INR|\$|£|€|₹|₨)?/gi, "")
    .replace(/^[\s\-•*–—:]+/, "")
    .replace(/\s+(?:at|for|@)\s*$/i, "")
    .trim()
    .replace(/\s+/g, " ");

  const cleanedDescription = description || segment.replace(/[0-9.,$£€₹₨]+/g, "").trim();

  if (!cleanedDescription || cleanedDescription.length < 2) {
    return null;
  }

  return {
    id: newItemId(),
    description: cleanedDescription.slice(0, 200),
    quantity: 1,
    unitPrice: Math.round(amount * 100) / 100,
    taxable: false,
  };
}

function extractClientName(prompt: string, provided?: string): string {
  const providedClean = clean(provided);
  if (providedClean) return providedClean;

  // Try "Invoice <Name>" or "Bill <Name>" or "For <Name>"
  const patterns = [
    /invoice\s+([A-Z][A-Za-z0-9'&.\- ]{1,60}?)(?:\s+for|\s+\$|\.|,|\n|$)/i,
    /bill\s+([A-Z][A-Za-z0-9'&.\- ]{1,60}?)(?:\s+for|\s+\$|\.|,|\n|$)/i,
    /\bfor\s+([A-Z][A-Za-z0-9'&.\- ]{1,60}?)(?:\s+for|\s+\$|\.|,|\n|$)/i,
    /\bto\s+([A-Z][A-Za-z0-9'&.\- ]{1,60}?)(?:\s+for|\s+\$|\.|,|\n|$)/i,
  ];
  for (const re of patterns) {
    const m = prompt.match(re);
    if (m && m[1]) {
      const candidate = m[1].trim();
      // Avoid pulling common verbs as names
      if (/^(invoice|billing|the|a|an|our|your|my)\b/i.test(candidate)) continue;
      return candidate.replace(/\s+/g, " ").slice(0, 80);
    }
  }
  return "";
}

function detectPaymentTerms(prompt: string, fallback: string): string {
  const lower = prompt.toLowerCase();
  if (lower.includes("due on receipt") || lower.includes("due immediately")) return "Due on receipt";
  if (lower.includes("due tomorrow")) return "Due on receipt";
  if (lower.includes("net 7") || /\bdue\s+in\s+7\b/.test(lower) || lower.includes("7 days") || lower.includes("within a week") || lower.includes("one week")) return "Net 7";
  if (lower.includes("net 15") || /\bdue\s+in\s+15\b/.test(lower) || lower.includes("15 days") || lower.includes("two weeks") || lower.includes("within two weeks")) return "Net 15";
  if (lower.includes("net 30") || /\bdue\s+in\s+30\b/.test(lower) || lower.includes("30 days") || lower.includes("within a month") || lower.includes("one month")) return "Net 30";
  if (lower.includes("net 14") || /\bdue\s+in\s+14\b/.test(lower) || lower.includes("14 days")) return "Net 15";
  if (/\bdue\s+next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/.test(lower)) return "Net 7";
  if (lower.includes("before final files") || lower.includes("before final delivery") || lower.includes("before final handover")) {
    return "Net 7";
  }
  if (lower.includes("due july 15") || lower.match(/\bdue\s+(january|february|march|april|may|june|july|august|september|october|november|december)\b/)) {
    return "Custom";
  }
  return fallback || "Net 7";
}

function detectDueDate(prompt: string, terms: string, baseISO: string): string {
  // Try to find an explicit "due <Month> <day>" or "<day> <month>"
  const lower = prompt.toLowerCase();
  const monthNames = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december",
  ];
  for (let i = 0; i < monthNames.length; i += 1) {
    const month = monthNames[i];
    const re = new RegExp(`\\bdue\\s+(?:on\\s+|by\\s+)?${month}\\s+(\\d{1,2})\\b`, "i");
    const m = lower.match(re);
    if (m && m[1]) {
      const day = Number(m[1]);
      const year = new Date(baseISO).getFullYear();
      const date = new Date(Date.UTC(year, i, day));
      return date.toISOString().slice(0, 10);
    }
  }
  // "due in N days" pattern
  const inDaysMatch = lower.match(/due\s+in\s+(\d+)\s+days?/);
  if (inDaysMatch) {
    return addDaysISO(baseISO, Number(inDaysMatch[1]));
  }
  // "due tomorrow"
  if (lower.includes("due tomorrow")) {
    return addDaysISO(baseISO, 1);
  }
  // "due next <weekday>" — find the next occurrence
  const weekdayMatch = lower.match(/\bdue\s+next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
  if (weekdayMatch) {
    const target = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].indexOf(weekdayMatch[1]);
    const base = new Date(baseISO);
    const baseDay = base.getUTCDay();
    let delta = (target - baseDay + 7) % 7;
    if (delta === 0) delta = 7; // "next X" implies the following one, not today.
    return addDaysISO(baseISO, delta);
  }
  // "due before final files" / "due on receipt" / "due immediately" => today
  if (
    lower.includes("due on receipt") ||
    lower.includes("due immediately") ||
    lower.includes("due tomorrow") ||
    lower.includes("before final files") ||
    lower.includes("before final delivery")
  ) {
    return baseISO;
  }
  // Fallback to terms
  const days = paymentTermsToDays(terms);
  if (days === null) return addDaysISO(baseISO, 7);
  return addDaysISO(baseISO, days);
}

function detectTaxFromText(prompt: string): { label: string; rate: number } | null {
  const lower = prompt.toLowerCase();
  const percentMatch = lower.match(/(\d+(?:\.\d+)?)\s*%/);
  const rate = percentMatch ? safeNumber(percentMatch[1], 0) : 0;

  if (lower.includes("vat") || lower.includes("value added")) {
    return { label: "VAT", rate: rate > 0 ? rate : 0 };
  }
  if (lower.includes("gst") || lower.includes("goods and services")) {
    return { label: "GST", rate: rate > 0 ? rate : 0 };
  }
  if (lower.includes("sales tax")) {
    return { label: "Sales Tax", rate: rate > 0 ? rate : 0 };
  }
  if (lower.includes("tax") && percentMatch) {
    return { label: "Tax", rate };
  }
  return null;
}

function detectDiscount(prompt: string): { type: "none" | "fixed" | "percentage"; value: number } {
  const lower = prompt.toLowerCase();
  const percentMatch = lower.match(/(\d+(?:\.\d+)?)\s*%\s*(?:off|discount)/);
  if (percentMatch) {
    return { type: "percentage", value: safeNumber(percentMatch[1], 0) };
  }
  const fixedMatch = lower.match(/(\$?\s*\d[\d,\.]*)\s*(?:off|discount)/);
  if (fixedMatch) {
    const cleaned = fixedMatch[1].replace(/[^0-9.]/g, "");
    const value = safeNumber(cleaned, 0);
    if (value > 0) return { type: "fixed", value };
  }
  if (lower.includes("discount")) return { type: "fixed", value: 0 };
  return { type: "none", value: 0 };
}

function detectAmountPaid(prompt: string): number {
  const lower = prompt.toLowerCase();
  // "paid in full", "fully paid", "paid fully" => caller will resolve to total.
  if (/\b(paid\s+in\s+full|fully\s+paid|paid\s+fully|paid\s+100\s*%)\b/.test(lower)) {
    return -1; // sentinel: caller fills in the subtotal.
  }
  const patterns = [
    /paid[\s:]+(\$?\s*\d[\d,\.]*)/i,
    /(\d+(?:\.\d+)?)\s*%\s*(?:paid|already paid|received|upfront|advance)/i,
    /(?:upfront|advance|deposit|already paid|received)[\s:]+(\$?\s*\d[\d,\.]*)/i,
  ];
  for (const re of patterns) {
    const m = lower.match(re);
    if (m && m[1]) {
      const cleaned = m[1].replace(/[^0-9.]/g, "");
      const num = safeNumber(cleaned, 0);
      if (num > 0 && num < 100) {
        return 0; // Percentage; resolved later in buildFallbackDraft.
      }
      if (num >= 100) {
        return num;
      }
    }
  }
  return 0;
}

function buildFallbackDraft(input: FallbackInput): InvoiceDraft {
  const prompt = clean(input.prompt, 4000);
  const detectedCurrency = detectCurrencyFromText(prompt);
  const currency = normalizeCurrency(input.currency, detectedCurrency);
  const tone = normalizeTone(input.tone);
  const baseISO = todayISO();

  const businessName = clean(input.businessName, 120) || "Your Studio";
  const clientName = extractClientName(prompt, input.clientName) || "Client";
  const paymentTerms = detectPaymentTerms(prompt, clean(input.paymentTerms, 40) || "Net 7");
  const dueDate = detectDueDate(prompt, paymentTerms, baseISO);
  const tax = detectTaxFromText(prompt);
  const discount = detectDiscount(prompt);
  const paid = detectAmountPaid(prompt);
  const wantsFullPayment = paid === -1;

  const segments = splitIntoSegments(prompt);
  const items: InvoiceItem[] = [];
  for (const seg of segments) {
    const item = extractItemFromSegment(seg, currency);
    if (item) items.push(item);
  }

  // If we didn't extract any items, create a single placeholder item from the prompt
  if (items.length === 0) {
    items.push({
      id: newItemId(),
      description: prompt ? prompt.slice(0, 200) : "Project services",
      quantity: 1,
      unitPrice: 0,
      taxable: false,
    });
  }

  // Compute subtotal for partial-payment / paid-in-full calculations.
  const subtotalNow = items.reduce(
    (sum, it) => sum + safeNumber(it.unitPrice, 0) * safeNumber(it.quantity, 0),
    0,
  );

  // Detect "50% upfront paid" and similar — treat as partial payment percent of the subtotal.
  const partialMatch = prompt.match(/(\d+(?:\.\d+)?)\s*%\s*(?:upfront|paid|advance|received|already)/i);
  let amountPaid = wantsFullPayment
    ? normalizeAmountPaid(subtotalNow)
    : normalizeAmountPaid(paid);
  if (!wantsFullPayment && amountPaid === 0 && partialMatch) {
    const pct = safeNumber(partialMatch[1], 0);
    if (pct > 0 && pct < 100) {
      amountPaid = normalizeAmountPaid(Math.round(subtotalNow * pct) / 100);
    }
  }

  // Build clear, friendlier terms for fallback invoices so the freelancer can send as-is.
  const terms = buildTermsText(paymentTerms, dueDate, baseISO, prompt);

  const invoiceData: InvoiceData = {
    business: {
      name: businessName,
      email: "",
      phone: "",
      address: "",
      website: "",
      paymentInstructions: `Bank transfer, ${CURRENCY_NAMES[currency]}. Reference the invoice number on your payment.`,
    },
    client: {
      name: clientName,
      email: "",
      address: "",
    },
    meta: {
      invoiceNumber: generateInvoiceNumber(),
      invoiceDate: baseISO,
      dueDate,
      currency,
      status: amountPaid >= subtotalNow && subtotalNow > 0 ? "Paid" : amountPaid > 0 ? "Sent" : "Draft",
      reference: "",
    },
    items,
    discount,
    tax: tax ?? { label: "Tax", rate: 0 },
    extraFees: 0,
    amountPaid,
    notes: {
      notes: DEFAULT_NOTES,
      terms,
    },
  };

  // Apply smart status suggestion to handle overdue / paid / etc.
  const totals = calculateTotals(invoiceData);
  invoiceData.meta.status = suggestInvoiceStatus(invoiceData, totals, baseISO);

  const messages = buildMessages(invoiceData, tone);
  return {
    invoice: invoiceData,
    messages,
    source: "fallback",
  };
}

function buildTermsText(terms: string, dueDate: string, baseISO: string, prompt: string): string {
  const lower = prompt.toLowerCase();
  if (lower.includes("before final files") || lower.includes("before final delivery") || lower.includes("before final handover")) {
    return "Final files will be released once the remaining balance is paid. Thank you.";
  }
  if (lower.includes("due on receipt")) {
    return "Payment is due on receipt. Late payments may incur a 1.5% monthly service charge.";
  }
  const days = paymentTermsToDays(terms);
  if (days !== null) {
    return `Payment due within ${days} days. Late payments may incur a 1.5% monthly service charge. Thank you.`;
  }
  return `Payment due by ${new Date(dueDate || baseISO).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}. Thank you.`;
}

function buildMessages(invoice: InvoiceData, tone: InvoiceTone): InvoiceMessages {
  const greeting = TONE_TO_BUSINESS_TONE[tone] || "Hi";
  const client = invoice.client.name || "there";
  const invoiceNumber = invoice.meta.invoiceNumber || "your invoice";
  const dueDate = invoice.meta.dueDate
    ? new Date(invoice.meta.dueDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "the due date";
  const totals = calculateTotals(invoice);
  const amountPaid = totals.amountPaid;
  const balanceDue = totals.balanceDue;
  const totalDisplay = formatCurrency(totals.total, invoice.meta.currency);
  const paidDisplay = formatCurrency(amountPaid, invoice.meta.currency);
  const balanceDisplay = formatCurrency(balanceDue, invoice.meta.currency);
  const hasPaid = amountPaid > 0;
  const businessLabel = invoice.business.name || "your studio";

  const emailSubject = `Invoice ${invoiceNumber} from ${businessLabel}`;
  const emailBody = hasPaid
    ? `${greeting} ${client},\n\n` +
      `Attached is invoice ${invoiceNumber} from ${businessLabel}. The total is ${totalDisplay}, ` +
      `with ${paidDisplay} already paid and the remaining balance of ${balanceDisplay} due ${dueDate}.\n\n` +
      `Please let me know if you have any questions or if the line items need adjusting.\n\n` +
      `Thank you,\n${businessLabel}`
    : `${greeting} ${client},\n\n` +
      `Attached is invoice ${invoiceNumber} from ${businessLabel}. ` +
      `The total is ${totalDisplay}, due ${dueDate}.\n\n` +
      `Please let me know if you have any questions or if the line items need adjusting.\n\n` +
      `Thank you,\n${businessLabel}`;

  const friendlyReminder = hasPaid
    ? `${greeting} ${client}, friendly reminder that invoice ${invoiceNumber} ` +
      `has a remaining balance of ${balanceDisplay} due ${dueDate}. ` +
      `${paidDisplay} has already been received. Let me know if anything needs adjusting. Thanks!`
    : `${greeting} ${client}, friendly reminder that invoice ${invoiceNumber} ` +
      `(${totalDisplay}) is due ${dueDate}. ` +
      `Let me know if anything needs adjusting. Thanks!`;

  const firmReminder = hasPaid
    ? `Hi ${client}, invoice ${invoiceNumber} has a remaining balance of ${balanceDisplay} ` +
      `that is now overdue. Please arrange payment at your earliest convenience, ` +
      `or reply with any concerns so we can resolve this.`
    : `Hi ${client}, invoice ${invoiceNumber} (${totalDisplay}) is now overdue. ` +
      `Please arrange payment at your earliest convenience, or reply with any concerns so we can resolve this.`;

  const whatsappMessage = hasPaid
    ? `${greeting} ${client} — invoice ${invoiceNumber} has a remaining balance of ${balanceDisplay} due ${dueDate}. ` +
      `(${paidDisplay} already received.) Thanks!`
    : `${greeting} ${client} — invoice ${invoiceNumber} for ${totalDisplay} is due ${dueDate}. ` +
      `Let me know if you have any questions. Thanks!`;

  const finalFilesMessage =
    balanceDue <= 0 && hasPaid
      ? `${greeting} ${client}, thanks for paying in full. Final files are ready to share — ` +
        `let me know the best way to send them over. Thanks!`
      : hasPaid
      ? `${greeting} ${client}, thanks for the upfront payment of ${paidDisplay}. ` +
        `The remaining balance of ${balanceDisplay} is due before final files are released. ` +
        `Once the balance clears, the final deliverables are yours. Thanks!`
      : `${greeting} ${client}, final files will be released once payment of ${totalDisplay} is received. ` +
        `Looking forward to wrapping this project. Thanks!`;

  return {
    emailSubject,
    emailBody,
    friendlyReminder,
    firmReminder,
    whatsappMessage,
    finalFilesMessage,
  };
}

export { buildFallbackDraft };
export { buildMessages as buildFallbackMessages };
export { buildMessages };
