export type InvoiceCurrency =
  | "USD"
  | "CAD"
  | "GBP"
  | "EUR"
  | "PKR"
  | "AED"
  | "AUD"
  | "INR";

export const SUPPORTED_CURRENCIES: InvoiceCurrency[] = [
  "USD",
  "CAD",
  "GBP",
  "EUR",
  "PKR",
  "AED",
  "AUD",
  "INR",
];

export type InvoiceStatus = "Draft" | "Sent" | "Paid" | "Overdue";
export const SUPPORTED_STATUSES: InvoiceStatus[] = [
  "Draft",
  "Sent",
  "Paid",
  "Overdue",
];

export type InvoiceTone = "simple" | "premium" | "friendly" | "formal";
export const SUPPORTED_TONES: InvoiceTone[] = [
  "simple",
  "premium",
  "friendly",
  "formal",
];

export type DiscountType = "none" | "fixed" | "percentage";
export const SUPPORTED_DISCOUNT_TYPES: DiscountType[] = [
  "none",
  "fixed",
  "percentage",
];

export type PaymentTerms =
  | "Due on receipt"
  | "Net 7"
  | "Net 15"
  | "Net 30"
  | "Custom";
export const SUPPORTED_PAYMENT_TERMS: PaymentTerms[] = [
  "Due on receipt",
  "Net 7",
  "Net 15",
  "Net 30",
  "Custom",
];

export type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxable: boolean;
};

export type BusinessInfo = {
  name: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  paymentInstructions: string;
};

export type ClientInfo = {
  name: string;
  email: string;
  address: string;
};

export type InvoiceMeta = {
  invoiceNumber: string;
  invoiceDate: string; // ISO yyyy-mm-dd
  dueDate: string; // ISO yyyy-mm-dd
  currency: InvoiceCurrency;
  status: InvoiceStatus;
  reference: string;
};

export type DiscountInfo = {
  type: DiscountType;
  value: number;
};

export type TaxInfo = {
  label: string;
  rate: number; // percent, e.g. 8.5 for 8.5%
};

export type InvoiceTotals = {
  subtotal: number;
  discount: number;
  tax: number;
  extraFees: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
};

export type InvoiceNotes = {
  notes: string;
  terms: string;
};

export type InvoiceMessages = {
  emailSubject: string;
  emailBody: string;
  friendlyReminder: string;
  firmReminder: string;
  whatsappMessage: string;
  finalFilesMessage: string;
};

export type InvoiceData = {
  business: BusinessInfo;
  client: ClientInfo;
  meta: InvoiceMeta;
  items: InvoiceItem[];
  discount: DiscountInfo;
  tax: TaxInfo;
  extraFees: number;
  amountPaid: number;
  notes: InvoiceNotes;
};

export type InvoiceDraft = {
  invoice: InvoiceData;
  messages: InvoiceMessages;
  source: "ai" | "fallback";
};

export type GenerateInvoiceRequest = {
  prompt: string;
  businessName?: string;
  clientName?: string;
  currency?: InvoiceCurrency | string;
  tone?: InvoiceTone | string;
  paymentTerms?: string;
};

export type GenerateInvoiceResponse = {
  ok: boolean;
  source: "ai" | "fallback";
  draft: InvoiceDraft;
  warnings: string[];
};

export const DEFAULT_TERMS =
  "Payment is due within the agreed window. Late payments may incur a 1.5% monthly service charge. Thank you for your business.";

export const DEFAULT_NOTES = "Thanks for the work together. Reach out anytime if you have questions about this invoice.";
