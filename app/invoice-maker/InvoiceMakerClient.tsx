"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { TopNav } from "@/components/top-nav";
import { ProductMark } from "@/components/product-icons";
import { SiteFooter } from "@/components/site-footer";
import styles from "./page.module.css";
import {
  DEFAULT_NOTES,
  DEFAULT_TERMS,
  SUPPORTED_CURRENCIES,
  SUPPORTED_DISCOUNT_TYPES,
  SUPPORTED_PAYMENT_TERMS,
  SUPPORTED_STATUSES,
  SUPPORTED_TONES,
  type DiscountInfo,
  type InvoiceCurrency,
  type InvoiceData,
  type InvoiceDraft,
  type InvoiceItem,
  type InvoiceStatus,
  type InvoiceTone,
  type TaxInfo,
} from "@/lib/invoice-maker/types";
import {
  calculateTotals,
  formatCurrency,
  formatDate,
  generateInvoiceNumber,
  newItemId,
  normalizeAmountPaid,
  suggestInvoiceStatus,
  todayISO,
} from "@/lib/invoice-maker/format";

const SAMPLE_PROMPTS = [
  "Invoice Katie for Cheddar pouch packaging design, $450, due in 7 days. Include 50% upfront paid and remaining balance due before final files.",
  "Invoice Acme Labs for brand identity work: logo $600, packaging concept $900, print-ready files $300. Due July 15.",
  "Bill Studio Nine for 12 hours of consulting at $95/hr, Net 15, USD.",
];

const SERVICE_PRESETS: { label: string; description: string }[] = [
  { label: "Packaging Design", description: "Packaging design" },
  { label: "Logo Design", description: "Logo design" },
  { label: "Brand Identity", description: "Brand identity" },
  { label: "Web Design", description: "Web design" },
  { label: "Social Media Design", description: "Social media design" },
  { label: "Consultation", description: "Consultation" },
];

const PROMPT_PLACEHOLDERS = SAMPLE_PROMPTS;

const TONE_LABELS: Record<InvoiceTone, string> = {
  simple: "Simple",
  premium: "Premium",
  friendly: "Friendly",
  formal: "Formal",
};

function emptyBusiness(): InvoiceData["business"] {
  return {
    name: "",
    email: "",
    phone: "",
    address: "",
    website: "",
    paymentInstructions: "",
  };
}

function emptyClient(): InvoiceData["client"] {
  return { name: "", email: "", address: "" };
}

function emptyDiscount(): DiscountInfo {
  return { type: "none", value: 0 };
}

function emptyTax(): TaxInfo {
  return { label: "Tax", rate: 0 };
}

function defaultItem(): InvoiceItem {
  return {
    id: newItemId(),
    description: "",
    quantity: 1,
    unitPrice: 0,
    taxable: false,
  };
}

function makeEmptyInvoice(): InvoiceData {
  const today = todayISO();
  return {
    business: emptyBusiness(),
    client: emptyClient(),
    meta: {
      invoiceNumber: "",
      invoiceDate: today,
      dueDate: today,
      currency: "USD",
      status: "Draft",
      reference: "",
    },
    items: [defaultItem()],
    discount: emptyDiscount(),
    tax: emptyTax(),
    extraFees: 0,
    amountPaid: 0,
    notes: {
      notes: "",
      terms: "",
    },
  };
}

type AiStatus =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; source: "ai" | "fallback"; warnings: string[] }
  | { status: "error"; message: string };

function isPaymentTerms(value: string) {
  return (SUPPORTED_PAYMENT_TERMS as string[]).includes(value);
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

export default function InvoiceMakerClient() {
  const [invoice, setInvoice] = useState<InvoiceData>(() => makeEmptyInvoice());
  const [messages, setMessages] = useState<InvoiceDraft["messages"]>({
    emailSubject: "",
    emailBody: "",
    friendlyReminder: "",
    firmReminder: "",
    whatsappMessage: "",
    finalFilesMessage: "",
  });

  const [prompt, setPrompt] = useState("");
  const [aiStatus, setAiStatus] = useState<AiStatus>({ status: "idle" });
  const [tone, setTone] = useState<InvoiceTone>("simple");
  const [businessNameHint, setBusinessNameHint] = useState("");
  const [clientNameHint, setClientNameHint] = useState("");
  const [paymentTermsHint, setPaymentTermsHint] = useState("");
  const [copyStatus, setCopyStatus] = useState<Record<string, boolean>>({});
  const copyTimer = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const totals = useMemo(() => calculateTotals(invoice), [invoice]);
  const currency = invoice.meta.currency;

  // ───── Update helpers ─────
  const updateMeta = useCallback(
    <K extends keyof InvoiceData["meta"]>(key: K, value: InvoiceData["meta"][K]) => {
      setInvoice((prev) => ({
        ...prev,
        meta: { ...prev.meta, [key]: value },
      }));
    },
    [],
  );

  const updateBusiness = useCallback(
    <K extends keyof InvoiceData["business"]>(key: K, value: InvoiceData["business"][K]) => {
      setInvoice((prev) => ({
        ...prev,
        business: { ...prev.business, [key]: value },
      }));
    },
    [],
  );

  const updateClient = useCallback(
    <K extends keyof InvoiceData["client"]>(key: K, value: InvoiceData["client"][K]) => {
      setInvoice((prev) => ({
        ...prev,
        client: { ...prev.client, [key]: value },
      }));
    },
    [],
  );

  const updateNotes = useCallback(
    <K extends keyof InvoiceData["notes"]>(key: K, value: InvoiceData["notes"][K]) => {
      setInvoice((prev) => ({
        ...prev,
        notes: { ...prev.notes, [key]: value },
      }));
    },
    [],
  );

  const updateItem = useCallback(
    (id: string, patch: Partial<InvoiceItem>) => {
      setInvoice((prev) => ({
        ...prev,
        items: prev.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
      }));
    },
    [],
  );

  const addItem = useCallback(() => {
    setInvoice((prev) => ({ ...prev, items: [...prev.items, defaultItem()] }));
  }, []);

  const removeItem = useCallback((id: string) => {
    setInvoice((prev) => ({
      ...prev,
      items: prev.items.length > 1 ? prev.items.filter((it) => it.id !== id) : prev.items,
    }));
  }, []);

  const duplicateItem = useCallback((id: string) => {
    setInvoice((prev) => {
      const target = prev.items.find((it) => it.id === id);
      if (!target) return prev;
      const clone: InvoiceItem = {
        ...target,
        id: newItemId(),
        description: target.description ? `${target.description} (copy)` : "",
      };
      return { ...prev, items: [...prev.items, clone] };
    });
  }, []);

  const handleReset = useCallback(() => {
    setInvoice(makeEmptyInvoice());
    setMessages({
      emailSubject: "",
      emailBody: "",
      friendlyReminder: "",
      firmReminder: "",
      whatsappMessage: "",
      finalFilesMessage: "",
    });
    setAiStatus({ status: "idle" });
    setCopyStatus({});
  }, []);

  // ───── AI generation ─────
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      setAiStatus({ status: "error", message: "Describe the invoice first." });
      return;
    }
    setAiStatus({ status: "loading" });
    try {
      const res = await fetch("/api/invoice-maker/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          businessName: businessNameHint,
          clientName: clientNameHint,
          currency: invoice.meta.currency,
          tone,
          paymentTerms: paymentTermsHint,
        }),
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error || "Generation failed.");
      }
      const draft = payload.draft as InvoiceDraft;
      const warnings = Array.isArray(payload.warnings)
        ? (payload.warnings as string[])
        : [];
      setInvoice({
        ...draft.invoice,
        amountPaid: normalizeAmountPaid(draft.invoice.amountPaid),
        meta: {
          ...draft.invoice.meta,
          invoiceNumber: draft.invoice.meta.invoiceNumber || generateInvoiceNumber(),
        },
      });
      setMessages(draft.messages);
      setAiStatus({ status: "ready", source: draft.source, warnings });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Generation failed.";
      setAiStatus({ status: "error", message });
    }
  }, [prompt, businessNameHint, clientNameHint, invoice.meta.currency, tone, paymentTermsHint]);

  const handleStartBlank = useCallback(() => {
    setInvoice({
      ...makeEmptyInvoice(),
      meta: { ...makeEmptyInvoice().meta, invoiceNumber: generateInvoiceNumber() },
    });
    setMessages({
      emailSubject: "",
      emailBody: "",
      friendlyReminder: "",
      firmReminder: "",
      whatsappMessage: "",
      finalFilesMessage: "",
    });
    setAiStatus({ status: "idle" });
  }, []);

  const scrollToEditor = useCallback(() => {
    if (typeof document === "undefined") return;
    const el = document.getElementById("invoice-editor");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      const firstField = el.querySelector<HTMLElement>(
        "textarea, input, select, button",
      );
      firstField?.focus({ preventScroll: true });
    }
  }, []);

  // ───── Print / Copy ─────
  const handlePrint = useCallback(() => {
    if (typeof window !== "undefined") {
      window.print();
    }
  }, []);

  const handleCopy = useCallback(async (key: string, text: string) => {
    if (!text) return;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else if (typeof document !== "undefined") {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopyStatus((prev) => ({ ...prev, [key]: true }));
      if (copyTimer.current[key]) {
        clearTimeout(copyTimer.current[key]);
      }
      copyTimer.current[key] = setTimeout(() => {
        setCopyStatus((prev) => ({ ...prev, [key]: false }));
      }, 1800);
    } catch {
      setCopyStatus((prev) => ({ ...prev, [key]: false }));
    }
  }, []);

  // ───── Validation hints ─────
  const inlineWarnings = useMemo(() => {
    const list: string[] = [];
    if (!invoice.client.name.trim()) {
      list.push("Add a client name to make this invoice complete.");
    }
    const noPricedItems =
      invoice.items.length === 0 ||
      invoice.items.every((it) => safeNum(it.unitPrice) <= 0);
    if (noPricedItems) {
      list.push("Add at least one line item with an amount.");
    }
    if (
      !invoice.business.paymentInstructions.trim() &&
      totals.total > 0
    ) {
      list.push("Add payment instructions so the client knows how to pay.");
    }
    if (!invoice.meta.dueDate) {
      list.push("Pick a due date.");
    }
    if (totals.total > 0 && totals.balanceDue <= 0 && invoice.meta.status !== "Paid") {
      list.push("Balance is zero but status is not Paid. Mark as Paid.");
    }
    if (totals.balanceDue > 0 && invoice.meta.status === "Paid") {
      list.push("Status is Paid but a balance is still due. Re-check the amount paid.");
    }
    if (invoice.tax.rate > 0 && !invoice.tax.label.trim()) {
      list.push("Tax rate is set but tax label is empty (add VAT, GST, or Sales Tax).");
    }
    return list;
  }, [
    invoice.client.name,
    invoice.items,
    invoice.business.paymentInstructions,
    invoice.meta.dueDate,
    invoice.meta.status,
    invoice.tax.rate,
    invoice.tax.label,
    totals.total,
    totals.balanceDue,
  ]);

  // True when the invoice has nothing meaningful yet (used to show the empty preview state).
  const isEmpty = useMemo(() => {
    return (
      !invoice.client.name.trim() &&
      !invoice.business.name.trim() &&
      invoice.items.every((it) => !it.description.trim() && safeNum(it.unitPrice) <= 0) &&
      !invoice.notes.notes.trim() &&
      !invoice.notes.terms.trim() &&
      !invoice.meta.reference.trim()
    );
  }, [
    invoice.client.name,
    invoice.business.name,
    invoice.items,
    invoice.notes.notes,
    invoice.notes.terms,
    invoice.meta.reference,
  ]);

  const addServicePreset = useCallback((description: string) => {
    setInvoice((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { id: newItemId(), description, quantity: 1, unitPrice: 0, taxable: false },
      ],
    }));
  }, []);

  const applySmartStatus = useCallback(() => {
    setInvoice((prev) => {
      const freshTotals = calculateTotals(prev);
      const next = suggestInvoiceStatus(prev, freshTotals, todayISO());
      if (next === prev.meta.status) return prev;
      return { ...prev, meta: { ...prev.meta, status: next } };
    });
  }, []);

  const statusClass = `previewStatusPill ${invoice.meta.status.toLowerCase()}`;

  return (
    <>
      <TopNav activeHref="/invoice-maker" variant="centered" />
      <main className={`${styles.page} invoice-maker-page`}>
        <div className={styles.shell}>
          <section className="tool-hero">
            <div className="tool-hero-lockup">
              <ProductMark accent="invoice" size="md" />
              <span className="tool-status-pill">Live</span>
            </div>
            <h1 className="tool-hero-title">Create client invoices from plain English.</h1>
            <p className="tool-hero-lede">
              Describe the work, amount, and client. AI turns it into a clean invoice you can edit, print, download, or send.
            </p>
            <div className="tool-hero-actions">
              <button className={styles.primaryButton} type="button" onClick={scrollToEditor}>
                Start invoicing
              </button>
              <button className={styles.secondaryButton} type="button" onClick={scrollToEditor}>
                How it works
              </button>
            </div>
            <div className="tool-hero-pills">
              <span>Private by default</span>
              <span>Browser-only</span>
              <span>PDF via Print</span>
              <span>No signup</span>
            </div>
          </section>

          <section className={styles.workspace}>
            {/* LEFT: editor */}
            <div className={styles.editorCard} id="invoice-editor">
              <h2>Invoice editor</h2>
              <p className={styles.lede}>
                Describe the work in your own words. AI drafts the line items and totals. Then edit any field below.
              </p>

              {/* AI quick draft */}
              <div className={styles.aiSection}>
                <div className={styles.aiHeaderRow}>
                  <span className={aiStatus.status === "ready" && aiStatus.source === "ai" ? styles.aiBadge : styles.aiBadgeMuted}>
                    {aiStatus.status === "loading" ? (
                      <>
                        <span className={styles.aiPulse} aria-hidden />
                        Generating…
                      </>
                    ) : aiStatus.status === "ready" ? (
                      aiStatus.source === "ai" ? "Drafted by AI" : "Drafted by fallback rules"
                    ) : aiStatus.status === "error" ? (
                      "AI unavailable"
                    ) : (
                      "AI quick draft"
                    )}
                  </span>
                  <span style={{ color: "var(--inv-muted)", fontSize: 12 }}>
                    {aiStatus.status === "ready"
                      ? aiStatus.source === "ai"
                        ? "Personalized from your description"
                        : "Built with deterministic parser"
                      : "Describe the invoice and we will structure it for you."}
                  </span>
                </div>

                <textarea
                  className={styles.promptArea}
                  placeholder={PROMPT_PLACEHOLDERS[0]}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                />

                <div className={styles.aiControlsRow}>
                  <div className={styles.controlRow}>
                    <label htmlFor="invoice-business-hint">Business name (optional)</label>
                    <input
                      id="invoice-business-hint"
                      type="text"
                      value={businessNameHint}
                      onChange={(e) => setBusinessNameHint(e.target.value)}
                      placeholder="Your studio name"
                    />
                  </div>
                  <div className={styles.controlRow}>
                    <label htmlFor="invoice-client-hint">Client name (optional)</label>
                    <input
                      id="invoice-client-hint"
                      type="text"
                      value={clientNameHint}
                      onChange={(e) => setClientNameHint(e.target.value)}
                      placeholder="Client name"
                    />
                  </div>
                </div>

                <div className={styles.aiControlsRow}>
                  <div className={styles.controlRow}>
                    <label htmlFor="invoice-tone">Tone</label>
                    <select
                      id="invoice-tone"
                      value={tone}
                      onChange={(e) => setTone(e.target.value as InvoiceTone)}
                    >
                      {SUPPORTED_TONES.map((t) => (
                        <option key={t} value={t}>
                          {TONE_LABELS[t]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.controlRow}>
                    <label htmlFor="invoice-terms">Payment terms hint (optional)</label>
                    <select
                      id="invoice-terms"
                      value={paymentTermsHint}
                      onChange={(e) => setPaymentTermsHint(e.target.value)}
                    >
                      <option value="">Detect from prompt</option>
                      {SUPPORTED_PAYMENT_TERMS.filter((t) => isPaymentTerms(t)).map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.aiActions}>
                  <button
                    className={styles.primaryButton}
                    type="button"
                    onClick={handleGenerate}
                    disabled={aiStatus.status === "loading" || !prompt.trim()}
                  >
                    {aiStatus.status === "loading" ? "Generating…" : "Generate invoice"}
                  </button>
                  <button
                    className={styles.ghostButton}
                    type="button"
                    onClick={handleStartBlank}
                  >
                    Start from blank
                  </button>
                </div>

                {aiStatus.status === "error" ? (
                  <div className={styles.errorBox}>{aiStatus.message}</div>
                ) : null}

                {(aiStatus.status === "ready" ? aiStatus.warnings : []).map((w, idx) => (
                  <div key={idx} className={styles.aiHints}>
                    {w}
                  </div>
                ))}

                <p className={styles.privacyNote}>
                  Your invoice is generated in this session. We do not store invoice data for this MVP.
                </p>
              </div>

              {/* Business */}
              <div className={styles.editorSection}>
                <h3 className={styles.editorSectionTitle}>
                  <span className="num">01</span> Business
                </h3>
                <div className={`${styles.fieldGrid} ${styles.single}`}>
                  <div className={styles.controlRow}>
                    <label htmlFor="biz-name">Business name</label>
                    <input
                      id="biz-name"
                      type="text"
                      value={invoice.business.name}
                      onChange={(e) => updateBusiness("name", e.target.value)}
                      placeholder="Your studio / company name"
                    />
                  </div>
                </div>
                <div className={styles.fieldGrid}>
                  <div className={styles.controlRow}>
                    <label htmlFor="biz-email">Email</label>
                    <input
                      id="biz-email"
                      type="email"
                      value={invoice.business.email}
                      onChange={(e) => updateBusiness("email", e.target.value)}
                      placeholder="you@business.com"
                    />
                  </div>
                  <div className={styles.controlRow}>
                    <label htmlFor="biz-phone">Phone</label>
                    <input
                      id="biz-phone"
                      type="tel"
                      value={invoice.business.phone}
                      onChange={(e) => updateBusiness("phone", e.target.value)}
                      placeholder="+1 555 010 0123"
                    />
                  </div>
                </div>
                <div className={`${styles.fieldGrid} ${styles.single}`}>
                  <div className={styles.controlRow}>
                    <label htmlFor="biz-address">Address</label>
                    <textarea
                      id="biz-address"
                      rows={2}
                      value={invoice.business.address}
                      onChange={(e) => updateBusiness("address", e.target.value)}
                      placeholder="Street, city, country"
                    />
                  </div>
                </div>
                <div className={styles.fieldGrid}>
                  <div className={styles.controlRow}>
                    <label htmlFor="biz-website">Website</label>
                    <input
                      id="biz-website"
                      type="text"
                      value={invoice.business.website}
                      onChange={(e) => updateBusiness("website", e.target.value)}
                      placeholder="https://yoursite.com"
                    />
                  </div>
                  <div className={styles.controlRow}>
                    <label htmlFor="biz-pay">Payment instructions</label>
                    <textarea
                      id="biz-pay"
                      rows={2}
                      value={invoice.business.paymentInstructions}
                      onChange={(e) => updateBusiness("paymentInstructions", e.target.value)}
                      placeholder="Bank transfer, IBAN, account name…"
                    />
                  </div>
                </div>
              </div>

              {/* Client */}
              <div className={styles.editorSection}>
                <h3 className={styles.editorSectionTitle}>
                  <span className="num">02</span> Client
                </h3>
                <div className={`${styles.fieldGrid} ${styles.single}`}>
                  <div className={styles.controlRow}>
                    <label htmlFor="cli-name">Client name</label>
                    <input
                      id="cli-name"
                      type="text"
                      value={invoice.client.name}
                      onChange={(e) => updateClient("name", e.target.value)}
                      placeholder="Acme Studios"
                    />
                  </div>
                </div>
                <div className={styles.fieldGrid}>
                  <div className={styles.controlRow}>
                    <label htmlFor="cli-email">Client email</label>
                    <input
                      id="cli-email"
                      type="email"
                      value={invoice.client.email}
                      onChange={(e) => updateClient("email", e.target.value)}
                      placeholder="client@business.com"
                    />
                  </div>
                  <div className={styles.controlRow}>
                    <label htmlFor="cli-address">Client address</label>
                    <textarea
                      id="cli-address"
                      rows={2}
                      value={invoice.client.address}
                      onChange={(e) => updateClient("address", e.target.value)}
                      placeholder="Street, city, country"
                    />
                  </div>
                </div>
              </div>

              {/* Invoice meta */}
              <div className={styles.editorSection}>
                <h3 className={styles.editorSectionTitle}>
                  <span className="num">03</span> Invoice details
                </h3>
                <div className={styles.fieldGrid}>
                  <div className={styles.controlRow}>
                    <label htmlFor="inv-number">Invoice number</label>
                    <input
                      id="inv-number"
                      type="text"
                      value={invoice.meta.invoiceNumber}
                      onChange={(e) => updateMeta("invoiceNumber", e.target.value)}
                    />
                  </div>
                  <div className={styles.controlRow}>
                    <label htmlFor="inv-ref">Reference / PO (optional)</label>
                    <input
                      id="inv-ref"
                      type="text"
                      value={invoice.meta.reference}
                      onChange={(e) => updateMeta("reference", e.target.value)}
                      placeholder="PO-2026-001"
                    />
                  </div>
                </div>
                <div className={styles.fieldGrid}>
                  <div className={styles.controlRow}>
                    <label htmlFor="inv-date">Invoice date</label>
                    <input
                      id="inv-date"
                      type="date"
                      value={invoice.meta.invoiceDate}
                      onChange={(e) => updateMeta("invoiceDate", e.target.value)}
                    />
                  </div>
                  <div className={styles.controlRow}>
                    <label htmlFor="inv-due">Due date</label>
                    <input
                      id="inv-due"
                      type="date"
                      value={invoice.meta.dueDate}
                      onChange={(e) => updateMeta("dueDate", e.target.value)}
                    />
                  </div>
                </div>
                <div className={styles.fieldGrid}>
                  <div className={styles.controlRow}>
                    <label htmlFor="inv-currency">Currency</label>
                    <select
                      id="inv-currency"
                      value={invoice.meta.currency}
                      onChange={(e) => updateMeta("currency", e.target.value as InvoiceCurrency)}
                    >
                      {SUPPORTED_CURRENCIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.controlRow}>
                    <label htmlFor="inv-status">Status</label>
                    <div className={styles.statusRow}>
                      <select
                        id="inv-status"
                        value={invoice.meta.status}
                        onChange={(e) => updateMeta("status", e.target.value as InvoiceStatus)}
                      >
                        {SUPPORTED_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className={styles.smartStatusButton}
                        onClick={applySmartStatus}
                        title="Set status from totals and due date"
                      >
                        Auto
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Line items */}
              <div className={styles.editorSection}>
                <h3 className={styles.editorSectionTitle}>
                  <span className="num">04</span> Line items
                </h3>
                <div className={styles.itemsTable}>
                  {invoice.items.map((item) => {
                    const amount = safeNum(item.quantity) * safeNum(item.unitPrice);
                    return (
                      <div className={styles.itemRow} key={item.id}>
                        <div className={styles.fieldRowDesc}>
                          <label>Description</label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateItem(item.id, { description: e.target.value })}
                            placeholder="Service description"
                          />
                        </div>
                        <div className={styles.fieldRowDesc}>
                          <label>Qty</label>
                          <input
                            type="number"
                            min={0}
                            step="any"
                            value={Number.isFinite(item.quantity) ? String(item.quantity) : "0"}
                            onChange={(e) =>
                              updateItem(item.id, { quantity: safeNum(e.target.value) })
                            }
                          />
                        </div>
                        <div className={styles.fieldRowDesc}>
                          <label>Unit price</label>
                          <input
                            type="number"
                            min={0}
                            step="any"
                            value={Number.isFinite(item.unitPrice) ? String(item.unitPrice) : "0"}
                            onChange={(e) =>
                              updateItem(item.id, { unitPrice: safeNum(e.target.value) })
                            }
                          />
                        </div>
                        <label className={styles.taxableCell} title="Taxable">
                          <input
                            type="checkbox"
                            checked={item.taxable}
                            onChange={(e) => updateItem(item.id, { taxable: e.target.checked })}
                          />
                          <span>Tax</span>
                        </label>
                        <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            className={styles.duplicateItemButton}
                            aria-label="Duplicate line item"
                            onClick={() => duplicateItem(item.id)}
                          >
                            ⎘
                          </button>
                          <button
                            type="button"
                            className={styles.removeItemButton}
                            aria-label="Remove line item"
                            onClick={() => removeItem(item.id)}
                          >
                            ×
                          </button>
                        </div>
                        <div className={styles.itemAmount} style={{ gridColumn: "1 / -1" }}>
                          Line total: {formatCurrency(amount, currency)}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className={styles.addItemRow}>
                  <button className={styles.secondaryButton} type="button" onClick={addItem}>
                    + Add item
                  </button>
                </div>
                <div className={styles.presetRow} aria-label="Service presets">
                  <span className={styles.presetLabel}>Quick add:</span>
                  {SERVICE_PRESETS.map((preset) => (
                    <button
                      type="button"
                      key={preset.label}
                      className={styles.presetChip}
                      onClick={() => addServicePreset(preset.description)}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Discount / tax / extras */}
              <div className={styles.editorSection}>
                <h3 className={styles.editorSectionTitle}>
                  <span className="num">05</span> Discount, tax, extras
                </h3>
                <div className={styles.fieldGrid}>
                  <div className={styles.controlRow}>
                    <label htmlFor="disc-type">Discount</label>
                    <select
                      id="disc-type"
                      value={invoice.discount.type}
                      onChange={(e) =>
                        setInvoice((prev) => ({
                          ...prev,
                          discount: { ...prev.discount, type: e.target.value as DiscountInfo["type"] },
                        }))
                      }
                    >
                      {SUPPORTED_DISCOUNT_TYPES.map((d) => (
                        <option key={d} value={d}>
                          {d === "none" ? "None" : d === "fixed" ? "Fixed amount" : "Percentage"}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.controlRow}>
                    <label htmlFor="disc-value">
                      Discount value {invoice.discount.type === "percentage" ? "(%)" : invoice.discount.type === "fixed" ? `(${currency})` : ""}
                    </label>
                    <input
                      id="disc-value"
                      type="number"
                      min={0}
                      step="any"
                      value={Number.isFinite(invoice.discount.value) ? String(invoice.discount.value) : "0"}
                      onChange={(e) =>
                        setInvoice((prev) => ({
                          ...prev,
                          discount: { ...prev.discount, value: safeNum(e.target.value) },
                        }))
                      }
                      disabled={invoice.discount.type === "none"}
                    />
                  </div>
                </div>
                <div className={styles.fieldGrid}>
                  <div className={styles.controlRow}>
                    <label htmlFor="tax-label">Tax label</label>
                    <input
                      id="tax-label"
                      type="text"
                      value={invoice.tax.label}
                      onChange={(e) =>
                        setInvoice((prev) => ({
                          ...prev,
                          tax: { ...prev.tax, label: e.target.value },
                        }))
                      }
                      placeholder="Tax / VAT / GST"
                    />
                  </div>
                  <div className={styles.controlRow}>
                    <label htmlFor="tax-rate">Tax rate (%)</label>
                    <input
                      id="tax-rate"
                      type="number"
                      min={0}
                      step="any"
                      value={Number.isFinite(invoice.tax.rate) ? String(invoice.tax.rate) : "0"}
                      onChange={(e) =>
                        setInvoice((prev) => ({
                          ...prev,
                          tax: { ...prev.tax, rate: safeNum(e.target.value) },
                        }))
                      }
                    />
                  </div>
                </div>
                <div className={styles.fieldGrid}>
                  <div className={styles.controlRow}>
                    <label htmlFor="extra-fees">Shipping / extra fees</label>
                    <input
                      id="extra-fees"
                      type="number"
                      min={0}
                      step="any"
                      value={Number.isFinite(invoice.extraFees) ? String(invoice.extraFees) : "0"}
                      onChange={(e) =>
                        setInvoice((prev) => ({ ...prev, extraFees: safeNum(e.target.value) }))
                      }
                    />
                  </div>
                  <div className={styles.controlRow}>
                    <label htmlFor="amount-paid">Amount paid</label>
                    <input
                      id="amount-paid"
                      type="number"
                      min={0}
                      step="any"
                      value={Number.isFinite(invoice.amountPaid) ? String(invoice.amountPaid) : "0"}
                      onChange={(e) =>
                        setInvoice((prev) => ({
                          ...prev,
                          amountPaid: normalizeAmountPaid(e.target.value),
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Notes / terms */}
              <div className={styles.editorSection}>
                <h3 className={styles.editorSectionTitle}>
                  <span className="num">06</span> Notes & terms
                </h3>
                <div className={`${styles.fieldGrid} ${styles.single}`}>
                  <div className={styles.controlRow}>
                    <label htmlFor="notes-text">Notes to client</label>
                    <textarea
                      id="notes-text"
                      rows={3}
                      value={invoice.notes.notes}
                      onChange={(e) => updateNotes("notes", e.target.value)}
                    />
                  </div>
                </div>
                <div className={`${styles.fieldGrid} ${styles.single}`}>
                  <div className={styles.controlRow}>
                    <label htmlFor="terms-text">Terms</label>
                    <textarea
                      id="terms-text"
                      rows={3}
                      value={invoice.notes.terms}
                      onChange={(e) => updateNotes("terms", e.target.value)}
                    />
                  </div>
                </div>
                <div className={styles.addItemRow}>
                  <button className={styles.ghostButton} type="button" onClick={handleReset}>
                    Reset invoice
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT: live preview */}
            <div className={styles.previewCard}>
              <div className={styles.previewToolbar}>
                <h2>Live preview</h2>
                <div className={styles.previewToolbarActions}>
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={handlePrint}
                  >
                    Print / Save PDF
                  </button>
                </div>
              </div>

              {isEmpty ? (
                <div className={styles.previewHint} role="status">
                  Start by describing the work or by starting from a blank invoice.
                </div>
              ) : inlineWarnings.length > 0 ? (
                <div className={styles.checklist} role="status">
                  <div className={styles.checklistHeader}>
                    <span className={styles.checklistDot} aria-hidden />
                    <strong>Invoice checklist</strong>
                    <span className={styles.checklistCount}>{inlineWarnings.length}</span>
                  </div>
                  <ul className={styles.checklistList}>
                    {inlineWarnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {isEmpty ? (
                <div className={styles.previewEmpty} id="invoice-preview" aria-live="polite">
                  <div className={styles.previewEmptyIcon} aria-hidden>
                    ◇
                  </div>
                  <div className={styles.previewEmptyTitle}>
                    Your invoice preview will appear here.
                  </div>
                  <p className={styles.previewEmptyBody}>
                    Describe the work and click <em>Generate invoice</em>, or start from blank.
                  </p>
                </div>
              ) : (
                <div className={styles.previewWrap} id="invoice-preview">
                  <div className={styles.previewSheet}>
                  <div className={styles.previewTop}>
                    <div className={styles.previewBrand}>
                      <div className={styles.previewBrandName}>
                        {invoice.business.name || "Your Studio"}
                      </div>
                      <div className={styles.previewBrandMeta}>
                        {invoice.business.address ? <div>{invoice.business.address}</div> : null}
                        {invoice.business.email ? <div>{invoice.business.email}</div> : null}
                        {invoice.business.phone ? <div>{invoice.business.phone}</div> : null}
                        {invoice.business.website ? <div>{invoice.business.website}</div> : null}
                      </div>
                    </div>
                    <div className={styles.previewTitle}>
                      <div className={styles.previewTitleLabel}>INVOICE</div>
                      <div className={styles.previewMetaRow}>
                        <strong>#{invoice.meta.invoiceNumber}</strong>
                      </div>
                      <div className={styles.previewMetaRow}>
                        Issued {formatDate(invoice.meta.invoiceDate)}
                      </div>
                      <div className={styles.previewMetaRow}>
                        Due {formatDate(invoice.meta.dueDate)}
                      </div>
                      {invoice.meta.reference ? (
                        <div className={styles.previewMetaRow}>
                          Ref {invoice.meta.reference}
                        </div>
                      ) : null}
                      <div style={{ marginTop: 6 }}>
                        <span className={`${styles.previewStatusPill} ${invoice.meta.status.toLowerCase()}`}>
                          {invoice.meta.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.previewParties}>
                    <div className={styles.previewParty}>
                      <div className={styles.previewPartyLabel}>Bill to</div>
                      <div className={styles.previewPartyName}>
                        {invoice.client.name || "Client name"}
                      </div>
                      <div className={styles.previewPartyMeta}>
                        {invoice.client.address ? <div>{invoice.client.address}</div> : null}
                        {invoice.client.email ? <div>{invoice.client.email}</div> : null}
                      </div>
                    </div>
                  </div>

                  <table className={styles.previewTable}>
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th className={styles.alignRight}>Qty</th>
                        <th className={styles.alignRight}>Unit</th>
                        <th className={styles.alignRight}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map((it) => {
                        const qty = safeNum(it.quantity);
                        const price = safeNum(it.unitPrice);
                        return (
                          <tr key={it.id}>
                            <td>{it.description || "—"}</td>
                            <td className={styles.alignRight}>{qty.toFixed(2)}</td>
                            <td className={styles.alignRight}>{formatCurrency(price, currency)}</td>
                            <td className={styles.alignRight}>
                              {formatCurrency(qty * price, currency)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  <div className={styles.previewTotals}>
                    <div className={styles.previewTotalsRow}>
                      <span>Subtotal</span>
                      <strong>{formatCurrency(totals.subtotal, currency)}</strong>
                    </div>
                    {totals.discount > 0 ? (
                      <div className={styles.previewTotalsRow}>
                        <span>Discount</span>
                        <strong>− {formatCurrency(totals.discount, currency)}</strong>
                      </div>
                    ) : null}
                    {totals.tax > 0 ? (
                      <div className={styles.previewTotalsRow}>
                        <span>
                          {invoice.tax.label} ({invoice.tax.rate}%)
                        </span>
                        <strong>{formatCurrency(totals.tax, currency)}</strong>
                      </div>
                    ) : null}
                    {totals.extraFees > 0 ? (
                      <div className={styles.previewTotalsRow}>
                        <span>Extra fees</span>
                        <strong>{formatCurrency(totals.extraFees, currency)}</strong>
                      </div>
                    ) : null}
                    <div className={`${styles.previewTotalsRow} ${styles.big}`}>
                      <span>Total</span>
                      <strong>{formatCurrency(totals.total, currency)}</strong>
                    </div>
                    {totals.amountPaid > 0 ? (
                      <div className={styles.previewTotalsRow}>
                        <span>Paid</span>
                        <strong>{formatCurrency(totals.amountPaid, currency)}</strong>
                      </div>
                    ) : null}
                    <div className={styles.previewBalanceRow}>
                      <span>Balance due</span>
                      <span>{formatCurrency(totals.balanceDue, currency)}</span>
                    </div>
                  </div>

                  {invoice.business.paymentInstructions.trim() ? (
                    <div className={styles.previewPayment}>
                      <div className={styles.previewPaymentLabel}>Payment instructions</div>
                      <div>{invoice.business.paymentInstructions}</div>
                    </div>
                  ) : null}

                  {invoice.notes.notes.trim() ? (
                    <div className={styles.previewNotes}>
                      <div className={styles.previewNotesLabel}>Notes</div>
                      <div className={styles.previewNotesText}>{invoice.notes.notes}</div>
                    </div>
                  ) : null}

                  {invoice.notes.terms.trim() ? (
                    <div className={styles.previewNotes}>
                      <div className={styles.previewNotesLabel}>Terms</div>
                      <div className={styles.previewNotesText}>{invoice.notes.terms}</div>
                    </div>
                  ) : null}
                  </div>
                </div>
              )}

              {/* AI copy blocks */}
              {isEmpty ? (
                <div className={styles.copyCard} aria-live="polite">
                  <h3>AI copy blocks</h3>
                  <p className={styles.copyEmpty}>
                    Generate an invoice to create email, WhatsApp, reminder, and final-files messages.
                  </p>
                </div>
              ) : (
                <div className={styles.copyCard}>
                  <h3>AI copy blocks</h3>
                  {[
                    { key: "emailSubject", label: "Email subject", text: messages.emailSubject },
                    { key: "emailBody", label: "Email body", text: messages.emailBody },
                    { key: "friendlyReminder", label: "Friendly reminder", text: messages.friendlyReminder },
                    { key: "firmReminder", label: "Firm overdue reminder", text: messages.firmReminder },
                    { key: "whatsappMessage", label: "WhatsApp short message", text: messages.whatsappMessage },
                    { key: "finalFilesMessage", label: "Final files release message", text: messages.finalFilesMessage },
                  ].map((block) => (
                    <div className={styles.copyRow} key={block.key}>
                      <div>
                        <div className={styles.copyLabel}>{block.label}</div>
                        <div className={styles.copyText}>{block.text || "—"}</div>
                      </div>
                      <button
                        type="button"
                        className={
                          copyStatus[block.key]
                            ? `${styles.copyButton} ${styles.copied}`
                            : styles.copyButton
                        }
                        onClick={() => handleCopy(block.key, block.text)}
                        disabled={!block.text}
                      >
                        {copyStatus[block.key] ? "Copied" : "Copy"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className={styles.faq} aria-label="Invoice Maker FAQ">
            {[
              ["Is my invoice saved anywhere?", "No. AI Invoice Maker keeps everything in this browser tab. Reloading the page clears the data. For the MVP, no invoice data is sent to a database."],
              ["Can I export this invoice as a PDF?", "Yes. Click \"Print / Save PDF\" and choose \"Save as PDF\" in the print dialog. We use browser print instead of a heavy PDF library to keep the bundle small."],
              ["Is this a real accounting tool?", "No. It is a fast invoice generator for freelancers and small studios. It does not file taxes, send payments, or sync with accounting software."],
              ["What happens if AI is unavailable?", "The fallback parser extracts amounts, client names, due dates, and discount hints using deterministic rules. You will still get a usable invoice draft."],
              ["Which currencies are supported?", "USD, CAD, GBP, EUR, PKR, AED, AUD, and INR. Add other currencies by editing the invoice total and label manually."],
              ["Can I send the invoice to a client?", "Use the AI-generated email body and copy block, paste into your mail app, attach the PDF, and send. Direct email send is coming later."],
            ].map(([q, a]) => (
              <article className={styles.faqItem} key={q}>
                <h3>{q}</h3>
                <p>{a}</p>
              </article>
            ))}
          </section>

          <section className={styles.roadmap} aria-label="Coming later">
            <div className={styles.roadmapBadge}>Coming later</div>
            <p className={styles.roadmapBody}>
              Multi-currency totals, Recurring invoices, Saved invoice history, Direct email send, Stripe / PayPal links.
            </p>
          </section>

          <SiteFooter />
        </div>
      </main>
    </>
  );
}
