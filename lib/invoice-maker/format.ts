import type {
  DiscountInfo,
  InvoiceCurrency,
  InvoiceItem,
  InvoiceTotals,
  TaxInfo,
} from "./types";

const CURRENCY_LOCALE: Record<InvoiceCurrency, string> = {
  USD: "en-US",
  CAD: "en-CA",
  GBP: "en-GB",
  EUR: "en-DE",
  PKR: "en-PK",
  AED: "en-AE",
  AUD: "en-AU",
  INR: "en-IN",
};

export function safeNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.\-]/g, "");
    if (!cleaned) return fallback;
    const parsed = Number(cleaned);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

export function roundCurrency(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

export function calculateSubtotal(items: InvoiceItem[]): number {
  let subtotal = 0;
  for (const item of items) {
    const qty = Math.max(0, safeNumber(item.quantity, 0));
    const price = Math.max(0, safeNumber(item.unitPrice, 0));
    subtotal += qty * price;
  }
  return roundCurrency(subtotal);
}

export function calculateDiscount(
  subtotal: number,
  discount: DiscountInfo,
): number {
  const value = Math.max(0, safeNumber(discount.value, 0));
  if (discount.type === "fixed") {
    return roundCurrency(Math.min(subtotal, value));
  }
  if (discount.type === "percentage") {
    const rate = Math.min(100, value);
    return roundCurrency((subtotal * rate) / 100);
  }
  return 0;
}

export function calculateTaxableSubtotal(items: InvoiceItem[]): number {
  let sum = 0;
  for (const item of items) {
    if (!item.taxable) continue;
    const qty = Math.max(0, safeNumber(item.quantity, 0));
    const price = Math.max(0, safeNumber(item.unitPrice, 0));
    sum += qty * price;
  }
  return roundCurrency(sum);
}

export function calculateTax(
  afterDiscount: number,
  tax: TaxInfo,
  taxableSubtotal?: number,
): number {
  const rate = Math.max(0, safeNumber(tax.rate, 0));
  if (rate === 0) return 0;
  const base =
    typeof taxableSubtotal === "number" ? taxableSubtotal : afterDiscount;
  return roundCurrency((Math.max(0, base) * rate) / 100);
}

export function calculateTotals(args: {
  items: InvoiceItem[];
  discount: DiscountInfo;
  tax: TaxInfo;
  extraFees?: number;
  amountPaid?: number;
}): InvoiceTotals {
  const items = Array.isArray(args.items) ? args.items : [];
  const subtotal = calculateSubtotal(items);
  const discount = calculateDiscount(subtotal, args.discount);
  const taxableSubtotal = calculateTaxableSubtotal(items);
  const afterDiscount = Math.max(0, subtotal - discount);
  // If any line is taxable, apply tax to the proportional taxable slice of the discounted subtotal.
  let taxBase = afterDiscount;
  if (taxableSubtotal > 0 && subtotal > 0) {
    const ratio = taxableSubtotal / subtotal;
    taxBase = roundCurrency(Math.max(0, afterDiscount * ratio));
  }
  const tax = calculateTax(afterDiscount, args.tax, taxBase);
  const extraFees = roundCurrency(Math.max(0, safeNumber(args.extraFees, 0)));
  const total = roundCurrency(afterDiscount + tax + extraFees);
  const amountPaid = roundCurrency(Math.max(0, safeNumber(args.amountPaid, 0)));
  const balanceDue = roundCurrency(Math.max(0, total - amountPaid));
  return {
    subtotal,
    discount,
    tax,
    extraFees,
    total,
    amountPaid,
    balanceDue,
  };
}

export function formatCurrency(
  amount: number,
  currency: InvoiceCurrency | string,
  locale?: string,
): string {
  const value = safeNumber(amount, 0);
  const code = (currency || "USD").toString().toUpperCase();
  const useLocale = locale || CURRENCY_LOCALE[code as InvoiceCurrency] || "en-US";
  try {
    return new Intl.NumberFormat(useLocale, {
      style: "currency",
      currency: code,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${code} ${value.toFixed(2)}`;
  }
}

export function formatDate(input: string | Date): string {
  if (!input) return "";
  const date = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) return "";
  try {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysISO(baseISO: string, days: number): string {
  const base = new Date(baseISO || todayISO());
  if (Number.isNaN(base.getTime())) return todayISO();
  const next = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
  return next.toISOString().slice(0, 10);
}

export function daysBetween(aISO: string, bISO: string): number {
  const a = new Date(aISO).getTime();
  const b = new Date(bISO).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.round((b - a) / (24 * 60 * 60 * 1000));
}

export function paymentTermsToDays(terms: string): number | null {
  const t = (terms || "").trim().toLowerCase();
  if (t === "due on receipt") return 0;
  if (t === "net 7") return 7;
  if (t === "net 15") return 15;
  if (t === "net 30") return 30;
  return null;
}

export function detectCurrencyFromText(text: string): InvoiceCurrency {
  const upper = (text || "").toUpperCase();
  const symbols: Record<string, InvoiceCurrency> = {
    USD: "USD",
    "$": "USD",
    CAD: "CAD",
    GBP: "GBP",
    "£": "GBP",
    EUR: "EUR",
    "€": "EUR",
    PKR: "PKR",
    "RS": "PKR",
    "₨": "PKR",
    AED: "AED",
    "د.إ": "AED",
    AUD: "AUD",
    INR: "INR",
    "₹": "INR",
  };
  // Prefer explicit 3-letter codes if present.
  const codeMatch = upper.match(/\b(USD|CAD|GBP|EUR|PKR|AED|AUD|INR)\b/);
  if (codeMatch) {
    const code = codeMatch[1] as InvoiceCurrency;
    return code;
  }
  for (const [key, value] of Object.entries(symbols)) {
    if (upper.includes(key)) return value;
  }
  return "USD";
}

export function generateInvoiceNumber(prefix = "INV"): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${year}-${random}`;
}

export function newItemId(): string {
  return `item-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36)}`;
}

export function parseMaybeNumber(value: unknown): number {
  if (typeof value === "number") return safeNumber(value);
  if (typeof value === "string") {
    const cleaned = value.replace(/[, ]/g, "");
    if (!cleaned) return 0;
    return safeNumber(cleaned, 0);
  }
  return 0;
}

/**
 * Coerce any value into a non-negative numeric paid amount.
 * Strips currency symbols, commas, and any leading minus sign so
 * the stored value is always displayed as a positive "Paid" line.
 */
export function normalizeAmountPaid(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return roundCurrency(Math.max(0, value));
  }
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.]/g, "");
    if (!cleaned) return 0;
    const num = Number(cleaned);
    if (Number.isFinite(num)) return roundCurrency(Math.max(0, num));
  }
  return 0;
}

export function balanceDueFor(total: number, amountPaid: number): number {
  return roundCurrency(Math.max(0, safeNumber(total, 0) - safeNumber(amountPaid, 0)));
}

/**
 * Compare two ISO date strings (yyyy-mm-dd) without time-of-day drift.
 * Returns -1 if a < b, 0 if equal, 1 if a > b. Returns 0 on invalid input.
 */
export function compareISODate(aISO: string, bISO: string): number {
  const a = new Date(aISO || "");
  const b = new Date(bISO || "");
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
  const aDay = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate());
  const bDay = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());
  if (aDay < bDay) return -1;
  if (aDay > bDay) return 1;
  return 0;
}

/**
 * Pick a smart invoice status from totals + due date + current status.
 * Rules:
 * - balanceDue === 0  -> "Paid"
 * - due date in the past and balanceDue > 0 -> "Overdue"
 * - amountPaid > 0 with balance remaining -> keep "Sent" (or current if it's "Draft")
 * - otherwise -> keep current (typically "Draft" or "Sent")
 */
export function suggestInvoiceStatus(
  invoice: { meta: { status: string; dueDate: string } },
  totals: InvoiceTotals,
  todayISOString: string,
): "Draft" | "Sent" | "Paid" | "Overdue" {
  const balanceDue = totals.balanceDue;
  const total = totals.total;
  if (total > 0 && balanceDue <= 0) return "Paid";
  if (compareISODate(invoice.meta.dueDate, todayISOString) < 0 && balanceDue > 0) {
    return "Overdue";
  }
  // Preserve explicit "Draft" choice; otherwise default to "Sent" when amountPaid > 0.
  const current = invoice.meta.status;
  if (current === "Draft" || current === "Overdue") {
    return totals.amountPaid > 0 ? "Sent" : current;
  }
  return totals.amountPaid > 0 ? "Sent" : "Draft";
}
