"use client";

import Link from "next/link";
import { useState, useRef, useCallback, useMemo } from "react";
import styles from "./page.module.css";

/* ─── Types ─── */
interface WorkEntry {
  id: string;
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  bullets: string;
}

interface EduEntry {
  id: string;
  degree: string;
  institution: string;
  startDate: string;
  endDate: string;
}

interface CertEntry {
  id: string;
  name: string;
  issuer: string;
  date: string;
}

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  portfolio: string;
  targetTitle: string;
  summary: string;
  workEntries: WorkEntry[];
  eduEntries: EduEntry[];
  skills: string;
  certEntries: CertEntry[];
  jobDescription: string;
}

/* ─── Constants ─── */
const STRONG_VERBS = [
  "achieved", "accelerated", "architected", "automated", "built", "championed",
  "consolidated", "delivered", "designed", "developed", "drove", "eliminated",
  "engineered", "established", "expanded", "generated", "implemented",
  "improved", "increased", "initiated", "launched", "led", "managed",
  "maximized", "mentored", "migrated", "negotiated", "optimized",
  "orchestrated", "overhauled", "pioneered", "reduced", "redesigned",
  "resolved", "restructured", "revamped", "scaled", "secured",
  "simplified", "spearheaded", "streamlined", "strengthened", "supervised",
  "transformed", "tripled", "unified", "upgraded",
];

const WEAK_VERBS: Record<string, string[]> = {
  did: ["executed", "delivered", "completed"],
  made: ["created", "developed", "built"],
  helped: ["facilitated", "supported", "enabled"],
  worked: ["collaborated", "contributed", "partnered"],
  got: ["obtained", "secured", "acquired"],
  used: ["leveraged", "utilized", "applied"],
  was: ["served as", "functioned as", "operated as"],
  went: ["transitioned", "advanced", "progressed"],
  tried: ["pursued", "attempted", "endeavored"],
  ran: ["managed", "directed", "administered"],
  handled: ["managed", "coordinated", "oversaw"],
  responsible: ["accountable for", "owned", "led"],
};

const EXAMPLE_CV: FormData = {
  fullName: "Sarah Chen",
  email: "sarah.chen@email.com",
  phone: "+1 (555) 234-5678",
  location: "San Francisco, CA",
  linkedin: "linkedin.com/in/sarahchen",
  portfolio: "sarahchen.design",
  targetTitle: "Product Marketing Manager",
  summary:
    "Results-driven product marketing manager with 6+ years of experience launching B2B SaaS products. Proven track record of increasing pipeline by 40% through data-driven campaigns, competitive positioning, and cross-functional collaboration with product and sales teams.",
  workEntries: [
    {
      id: "w1",
      title: "Senior Product Marketing Manager",
      company: "CloudScale Inc.",
      startDate: "2022-01",
      endDate: "Present",
      bullets:
        "Led go-to-market strategy for 3 major product launches, generating $2.4M in pipeline within first quarter\nDeveloped competitive battle cards adopted by 85% of sales team, improving win rate by 18%\nOrchestrated cross-functional campaigns with product, sales, and design teams across 4 regions\nCreated product positioning framework used company-wide for all new feature releases",
    },
    {
      id: "w2",
      title: "Product Marketing Manager",
      company: "DataFlow Systems",
      startDate: "2019-06",
      endDate: "2021-12",
      bullets:
        "Spearheaded rebranding initiative that increased brand awareness by 32% measured via surveys\nBuilt and managed a content pipeline producing 12 case studies and 24 blog posts per quarter\nDesigned onboarding email sequences that improved trial-to-paid conversion by 22%",
    },
  ],
  eduEntries: [
    {
      id: "e1",
      degree: "MBA, Marketing",
      institution: "UC Berkeley Haas School of Business",
      startDate: "2017",
      endDate: "2019",
    },
    {
      id: "e2",
      degree: "B.S. Communications",
      institution: "University of Washington",
      startDate: "2013",
      endDate: "2017",
    },
  ],
  skills:
    "Product positioning, Go-to-market strategy, Competitive analysis, Content marketing, Sales enablement, Google Analytics, HubSpot, Salesforce, A/B testing, Market research, Cross-functional leadership, SQL",
  certEntries: [
    {
      id: "c1",
      name: "Pragmatic Institute Certified — PMC Level III",
      issuer: "Pragmatic Institute",
      date: "2023",
    },
    {
      id: "c2",
      name: "Google Analytics Certification",
      issuer: "Google",
      date: "2022",
    },
  ],
  jobDescription:
    "We are looking for a Product Marketing Manager to own go-to-market strategy for our enterprise SaaS platform. You will create compelling product positioning, develop sales enablement materials, conduct competitive analysis, and collaborate with product and sales teams. Requirements: 5+ years in product marketing, experience with B2B SaaS, strong analytical skills, proficiency in HubSpot or Salesforce.",
};

const uid = () => Math.random().toString(36).slice(2, 9);

const blankWork = (): WorkEntry => ({
  id: uid(),
  title: "",
  company: "",
  startDate: "",
  endDate: "",
  bullets: "",
});

const blankEdu = (): EduEntry => ({
  id: uid(),
  degree: "",
  institution: "",
  startDate: "",
  endDate: "",
});

const blankCert = (): CertEntry => ({
  id: uid(),
  name: "",
  issuer: "",
  date: "",
});

const emptyForm: FormData = {
  fullName: "",
  email: "",
  phone: "",
  location: "",
  linkedin: "",
  portfolio: "",
  targetTitle: "",
  summary: "",
  workEntries: [blankWork()],
  eduEntries: [blankEdu()],
  skills: "",
  certEntries: [],
  jobDescription: "",
};

/* ─── Printable CV document ─── */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildPrintableHtml(data: FormData): string {
  const contactItems = [
    data.email,
    data.phone,
    data.location,
    data.linkedin,
    data.portfolio,
  ]
    .filter(Boolean)
    .map((s) => `<span>${escapeHtml(s)}</span>`)
    .join("");

  const workSection = data.workEntries.some((w) => w.title || w.company)
    ? `<section>
        <h2>Work Experience</h2>
        ${data.workEntries
          .filter((w) => w.title || w.company)
          .map((w) => {
            const dateRange =
              w.startDate || w.endDate
                ? ` <span class="dates">${escapeHtml(
                    formatDate(w.startDate)
                  )} \u2013 ${escapeHtml(formatDate(w.endDate))}</span>`
                : "";
            const bullets = w.bullets
              ? `<ul>${w.bullets
                  .split("\n")
                  .filter(Boolean)
                  .map(
                    (b) =>
                      `<li>${escapeHtml(b.replace(/^[\-•]\s*/, ""))}</li>`
                  )
                  .join("")}</ul>`
              : "";
            return `<div class="entry">
              <div class="entry-head"><strong>${escapeHtml(w.title)}${
              w.company ? `, ${escapeHtml(w.company)}` : ""
            }</strong>${dateRange}</div>
              ${bullets}
            </div>`;
          })
          .join("")}
      </section>`
    : "";

  const eduSection = data.eduEntries.some((e) => e.degree || e.institution)
    ? `<section>
        <h2>Education</h2>
        ${data.eduEntries
          .filter((e) => e.degree || e.institution)
          .map((e) => {
            const dateRange =
              e.startDate || e.endDate
                ? ` <span class="dates">${escapeHtml(
                    formatDate(e.startDate)
                  )} \u2013 ${escapeHtml(formatDate(e.endDate))}</span>`
                : "";
            return `<div class="entry">
              <div class="entry-head"><strong>${escapeHtml(e.degree)}${
              e.institution ? `, ${escapeHtml(e.institution)}` : ""
            }</strong>${dateRange}</div>
            </div>`;
          })
          .join("")}
      </section>`
    : "";

  const skillsSection = data.skills
    ? `<section><h2>Skills</h2><p>${escapeHtml(data.skills)}</p></section>`
    : "";

  const certSection = data.certEntries.some((c) => c.name)
    ? `<section>
        <h2>Certifications</h2>
        ${data.certEntries
          .filter((c) => c.name)
          .map((c) => {
            return `<div class="entry"><strong>${escapeHtml(c.name)}</strong>${
              c.issuer ? ` <span>\u2014 ${escapeHtml(c.issuer)}</span>` : ""
            }${c.date ? ` <span class="dates">(${escapeHtml(c.date)})</span>` : ""}</div>`;
          })
          .join("")}
      </section>`
    : "";

  const summarySection = data.summary
    ? `<section><h2>Summary</h2><p>${escapeHtml(data.summary)}</p></section>`
    : "";

  const printableCss = `
    @page { size: A4 portrait; margin: 14mm; }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff !important;
      color: #111827;
      font-family: 'Times New Roman', Georgia, serif;
      font-size: 11pt;
      line-height: 1.45;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .doc {
      max-width: 182mm;
      margin: 0 auto;
      padding: 0;
    }
    .name {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 22pt;
      font-weight: 800;
      color: #111827;
      margin: 0 0 4px 0;
      letter-spacing: -0.01em;
    }
    .contact {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 10pt;
      color: #374151;
      margin: 0 0 4px 0;
    }
    .contact span:not(:last-child)::after {
      content: " \\2022 ";
      color: #9ca3af;
      margin: 0 2px;
    }
    .target {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 11pt;
      font-style: italic;
      color: #374151;
      margin: 4px 0 14px 0;
    }
    section { margin: 14px 0 0 0; }
    section h2 {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 10.5pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.10em;
      color: #1f2937;
      border-bottom: 1.25pt solid #1f2937;
      padding-bottom: 2px;
      margin: 0 0 6px 0;
    }
    section p { margin: 4px 0; }
    .entry { margin: 8px 0 0 0; page-break-inside: avoid; break-inside: avoid; }
    .entry-head {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 8px;
      flex-wrap: wrap;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 11pt;
      color: #111827;
    }
    .entry-head strong { font-weight: 700; }
    .dates {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 10pt;
      color: #4b5563;
      font-weight: 500;
      white-space: nowrap;
    }
    ul {
      margin: 4px 0 0 18px;
      padding: 0;
    }
    ul li { margin: 0 0 2px 0; }
    @media print {
      html, body { background: #fff !important; }
      .no-print { display: none !important; }
    }
  `;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${
    data.fullName ? escapeHtml(data.fullName) + " - CV" : "CV"
  }</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <style>${printableCss}</style>
</head>
<body>
  <div class="no-print" style="position:fixed;top:12px;right:12px;z-index:9999;background:#111827;color:#fff;padding:8px 14px;border-radius:8px;font:600 12px Inter,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,0.25);">
    Use your browser's "Save as PDF" to download.
  </div>
  <main class="doc">
    ${data.fullName ? `<h1 class="name">${escapeHtml(data.fullName)}</h1>` : ""}
    ${contactItems ? `<p class="contact">${contactItems}</p>` : ""}
    ${
      data.targetTitle
        ? `<p class="target">${escapeHtml(data.targetTitle)}</p>`
        : ""
    }
    ${summarySection}
    ${workSection}
    ${eduSection}
    ${skillsSection}
    ${certSection}
  </main>
  <script>
    window.addEventListener('load', function () {
      // Strip hint right before print dialog appears
      setTimeout(function () {
        var h = document.querySelector('.no-print');
        if (h) h.style.display = 'none';
      }, 50);
    });
  </script>
</body>
</html>`;
}

/* ─── Helpers ─── */
function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    "a","an","the","and","or","but","in","on","at","to","for","of","with",
    "by","from","is","are","was","were","be","been","being","have","has",
    "had","do","does","did","will","would","shall","should","may","might",
    "can","could","this","that","these","those","i","you","he","she","it",
    "we","they","me","him","her","us","them","my","your","his","its","our",
    "their","not","no","all","each","every","both","few","more","most",
    "other","some","such","than","too","very","just","about","above",
    "after","again","also","any","as","before","between","during","into",
    "over","same","so","then","there","through","under","up","what","when",
    "where","which","while","who","whom","why","how","if","because",
    "until","against","own","able","across","looking","experience",
    "requirements","years","including","work","working","role","team",
    "strong","must","ability","well","new","key","within","ensure",
    "using","etc","e.g","required","preferred","plus","including",
  ]);
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s\-+#]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));
  // also extract multi-word phrases (2-word bigrams)
  const bigrams: string[] = [];
  const cleanWords = text
    .toLowerCase()
    .replace(/[^a-z0-9\s\-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1);
  for (let i = 0; i < cleanWords.length - 1; i++) {
    const bi = `${cleanWords[i]} ${cleanWords[i + 1]}`;
    if (!stopWords.has(cleanWords[i]) && !stopWords.has(cleanWords[i + 1])) {
      bigrams.push(bi);
    }
  }
  return [...new Set([...words, ...bigrams])];
}

function formatDate(d: string): string {
  if (!d || d.toLowerCase() === "present") return "Present";
  const parts = d.split("-");
  if (parts.length === 2) {
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    const monthIndex = parseInt(parts[1], 10) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${months[monthIndex]} ${parts[0]}`;
    }
  }
  return d;
}

/* ─── Component ─── */
export default function AtsCvMakerClient() {
  const [form, setForm] = useState<FormData>({ ...emptyForm });
  const [copyMsg, setCopyMsg] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const cvPreviewRef = useRef<HTMLDivElement>(null);
  // cvPreviewRef is reserved for direct DOM access to the paper element
  void cvPreviewRef;

  /* ─── Form updaters ─── */
  const setField = useCallback(
    <K extends keyof FormData>(key: K, val: FormData[K]) =>
      setForm((prev) => ({ ...prev, [key]: val })),
    []
  );

  const updateWork = useCallback(
    (id: string, field: keyof WorkEntry, val: string) =>
      setForm((prev) => ({
        ...prev,
        workEntries: prev.workEntries.map((w) =>
          w.id === id ? { ...w, [field]: val } : w
        ),
      })),
    []
  );

  const updateEdu = useCallback(
    (id: string, field: keyof EduEntry, val: string) =>
      setForm((prev) => ({
        ...prev,
        eduEntries: prev.eduEntries.map((e) =>
          e.id === id ? { ...e, [field]: val } : e
        ),
      })),
    []
  );

  const updateCert = useCallback(
    (id: string, field: keyof CertEntry, val: string) =>
      setForm((prev) => ({
        ...prev,
        certEntries: prev.certEntries.map((c) =>
          c.id === id ? { ...c, [field]: val } : c
        ),
      })),
    []
  );

  /* ─── Plain text builder ─── */
  const buildPlainText = useCallback(() => {
    const lines: string[] = [];
    if (form.fullName) lines.push(form.fullName.toUpperCase());
    const contact = [form.email, form.phone, form.location, form.linkedin, form.portfolio]
      .filter(Boolean)
      .join(" | ");
    if (contact) lines.push(contact);
    if (form.targetTitle) lines.push(form.targetTitle);
    lines.push("");

    if (form.summary) {
      lines.push("SUMMARY");
      lines.push(form.summary);
      lines.push("");
    }

    if (form.workEntries.some((w) => w.title || w.company)) {
      lines.push("WORK EXPERIENCE");
      form.workEntries.forEach((w) => {
        if (!w.title && !w.company) return;
        const dateRange =
          w.startDate || w.endDate
            ? ` | ${formatDate(w.startDate)} – ${formatDate(w.endDate)}`
            : "";
        lines.push(`${w.title}${w.company ? `, ${w.company}` : ""}${dateRange}`);
        if (w.bullets) {
          w.bullets
            .split("\n")
            .filter(Boolean)
            .forEach((b) => lines.push(`• ${b.replace(/^[\-•]\s*/, "")}`));
        }
        lines.push("");
      });
    }

    if (form.eduEntries.some((e) => e.degree || e.institution)) {
      lines.push("EDUCATION");
      form.eduEntries.forEach((e) => {
        if (!e.degree && !e.institution) return;
        const dateRange =
          e.startDate || e.endDate
            ? ` | ${formatDate(e.startDate)} – ${formatDate(e.endDate)}`
            : "";
        lines.push(
          `${e.degree}${e.institution ? `, ${e.institution}` : ""}${dateRange}`
        );
      });
      lines.push("");
    }

    if (form.skills) {
      lines.push("SKILLS");
      lines.push(form.skills);
      lines.push("");
    }

    if (form.certEntries.some((c) => c.name)) {
      lines.push("CERTIFICATIONS");
      form.certEntries.forEach((c) => {
        if (!c.name) return;
        lines.push(
          `${c.name}${c.issuer ? ` — ${c.issuer}` : ""}${c.date ? ` (${c.date})` : ""}`
        );
      });
      lines.push("");
    }

    return lines.join("\n");
  }, [form]);

  /* ─── ATS Analysis ─── */
  const atsAnalysis = useMemo(() => {
    const issues: string[] = [];
    const warnings: string[] = [];
    let riskLevel: "Low" | "Medium" | "High" = "Low";

    // Missing contact info
    if (!form.fullName) warnings.push("Missing full name");
    if (!form.email) warnings.push("Missing email address");
    if (!form.phone) warnings.push("Missing phone number");
    if (!form.location) warnings.push("Missing location");

    // Missing standard sections
    if (!form.summary) issues.push("Missing Professional Summary section");
    if (!form.workEntries.some((w) => w.title || w.company))
      issues.push("Missing Work Experience section");
    if (!form.eduEntries.some((e) => e.degree || e.institution))
      issues.push("Missing Education section");
    if (!form.skills) issues.push("Missing Skills section");

    // Risk calculation
    if (issues.length >= 3 || warnings.length >= 3) riskLevel = "High";
    else if (issues.length >= 1 || warnings.length >= 2) riskLevel = "Medium";

    // Action verb analysis
    const allBullets = form.workEntries
      .map((w) => w.bullets)
      .join("\n")
      .toLowerCase();
    const weakVerbsFound: { verb: string; suggestions: string[] }[] = [];
    Object.entries(WEAK_VERBS).forEach(([weak, suggestions]) => {
      const regex = new RegExp(`\\b${weak}\\b`, "i");
      if (regex.test(allBullets)) {
        weakVerbsFound.push({ verb: weak, suggestions });
      }
    });

    const strongVerbsUsed = STRONG_VERBS.filter((v) =>
      allBullets.includes(v)
    );

    // Keyword matching
    let keywordMatch = null;
    if (form.jobDescription.trim().length > 20) {
      const jdKeywords = extractKeywords(form.jobDescription);
      const cvText = buildPlainText().toLowerCase();
      const matched = jdKeywords.filter((kw) => cvText.includes(kw));
      const missing = jdKeywords
        .filter((kw) => !cvText.includes(kw))
        // filter out very short or generic
        .filter((kw) => kw.length > 3)
        // unique
        .slice(0, 20);
      const score = jdKeywords.length > 0
        ? Math.round((matched.length / jdKeywords.length) * 100)
        : 0;
      keywordMatch = { score, matched: matched.length, total: jdKeywords.length, missing };
    }

    return {
      riskLevel,
      issues,
      warnings,
      weakVerbsFound,
      strongVerbsUsed: strongVerbsUsed.slice(0, 8),
      keywordMatch,
    };
  }, [form, buildPlainText]);

  /* ─── Actions ─── */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildPlainText());
      setCopyMsg("Copied!");
      setTimeout(() => setCopyMsg(""), 2000);
    } catch {
      setCopyMsg("Copy failed");
      setTimeout(() => setCopyMsg(""), 2000);
    }
  };

  const handleDownloadPdf = () => {
    const html = buildPrintableHtml(form);
    const printWindow = window.open("", "_blank", "width=900,height=1100");
    if (!printWindow) {
      alert("Please allow pop-ups to download your CV as PDF.");
      return;
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    // Wait for content to render before invoking print
    printWindow.addEventListener("load", () => {
      try {
        printWindow.focus();
        printWindow.print();
      } catch {
        /* user can use browser print manually */
      }
    });
  };

  const handleClear = () => {
    setForm({ ...emptyForm, workEntries: [blankWork()], eduEntries: [blankEdu()] });
    setShowPreview(false);
  };

  const handleLoadExample = () => {
    setForm({ ...EXAMPLE_CV });
    setShowPreview(true);
    setTimeout(() => {
      previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleBuildCv = () => {
    setShowPreview(true);
    setTimeout(() => {
      previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const hasContent =
    form.fullName || form.summary || form.workEntries.some((w) => w.title);

  /* ─── Render ─── */
  return (
    <div className={`${styles.cvMakerPage} ats-cv-maker`}>
      {/* ─── Nav ─── */}
      <div className={styles.cvMakerContent}>
        <header className="tools-nav">
          <Link href="/" className="tools-brand">
            <span className="tools-brandmark">100</span>
            <span>100 Tools</span>
          </Link>
          <nav className="tools-nav-links" aria-label="Primary">
            <Link href="/" className="tools-nav-link">Home</Link>
            <Link href="/bedownloader" className="tools-nav-link">BeDownloader</Link>
            <Link href="/brutal-reminder" className="tools-nav-link">Brutal Reminder</Link>
            <Link href="/ats-cv-maker" className="tools-nav-link active">ATS CV Maker</Link>
            <Link href="/blog" className="tools-nav-link">Blog</Link>
          </nav>
        </header>

        {/* ─── Hero ─── */}
        <section className={styles.hero}>
          <span className="tools-kicker">TOOL 03</span>
          <h1 className={styles.title}>
            Free <span className={styles.textGradientGreen}>ATS-Friendly</span> CV Maker
          </h1>
          <p className={styles.subtitle}>
            Build a clean, recruiter-readable CV that ATS systems can parse.
            No hidden fees. No fancy templates. Just a simple CV that works.
          </p>
          <div className={styles.heroActions}>
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={handleBuildCv}
              id="build-ats-cv-btn"
            >
              Build ATS CV
            </button>
            <button
              className={`${styles.btn} ${styles.btnSecondary}`}
              onClick={handleLoadExample}
              id="load-example-btn"
            >
              Load Example CV
            </button>
          </div>
          <div className={styles.trust}>
            <span>ATS-friendly format</span>
            <span>Keyword match checker</span>
            <span>100% free</span>
          </div>
        </section>

        {/* ─── Main layout: form + preview ─── */}
        <div className={styles.layout}>
          {/* ─── FORM PANEL ─── */}
          <div className={styles.formPanel}>
            <h2 className={styles.sectionTitle}>Your Information</h2>

            {/* Contact Info */}
            <fieldset className={styles.fieldGroup}>
              <legend className={styles.fieldLegend}>Contact Information</legend>
              <div className={styles.fieldGrid}>
                <div className={styles.field}>
                  <label htmlFor="cv-fullname">Full Name *</label>
                  <input
                    id="cv-fullname"
                    type="text"
                    value={form.fullName}
                    onChange={(e) => setField("fullName", e.target.value)}
                    placeholder="Sarah Chen"
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="cv-email">Email *</label>
                  <input
                    id="cv-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    placeholder="sarah@email.com"
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="cv-phone">Phone</label>
                  <input
                    id="cv-phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    placeholder="+1 (555) 234-5678"
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="cv-location">Location</label>
                  <input
                    id="cv-location"
                    type="text"
                    value={form.location}
                    onChange={(e) => setField("location", e.target.value)}
                    placeholder="San Francisco, CA"
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="cv-linkedin">LinkedIn</label>
                  <input
                    id="cv-linkedin"
                    type="text"
                    value={form.linkedin}
                    onChange={(e) => setField("linkedin", e.target.value)}
                    placeholder="linkedin.com/in/yourname"
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="cv-portfolio">Portfolio</label>
                  <input
                    id="cv-portfolio"
                    type="text"
                    value={form.portfolio}
                    onChange={(e) => setField("portfolio", e.target.value)}
                    placeholder="yoursite.com"
                  />
                </div>
              </div>
            </fieldset>

            {/* Target Title */}
            <fieldset className={styles.fieldGroup}>
              <legend className={styles.fieldLegend}>Target Role</legend>
              <div className={styles.field}>
                <label htmlFor="cv-target-title">Target Job Title</label>
                <input
                  id="cv-target-title"
                  type="text"
                  value={form.targetTitle}
                  onChange={(e) => setField("targetTitle", e.target.value)}
                  placeholder="Product Marketing Manager"
                />
              </div>
            </fieldset>

            {/* Professional Summary */}
            <fieldset className={styles.fieldGroup}>
              <legend className={styles.fieldLegend}>Professional Summary</legend>
              <div className={styles.field}>
                <label htmlFor="cv-summary">
                  Summary
                  <span className={styles.fieldHint}>2–4 sentences highlighting your value</span>
                </label>
                <textarea
                  id="cv-summary"
                  rows={4}
                  value={form.summary}
                  onChange={(e) => setField("summary", e.target.value)}
                  placeholder="Results-driven professional with X+ years of experience in..."
                />
              </div>
            </fieldset>

            {/* Work Experience */}
            <fieldset className={styles.fieldGroup}>
              <legend className={styles.fieldLegend}>Work Experience</legend>
              {form.workEntries.map((work, idx) => (
                <div key={work.id} className={styles.entryCard}>
                  <div className={styles.entryHeader}>
                    <span className={styles.entryBadge}>Position {idx + 1}</span>
                    {form.workEntries.length > 1 && (
                      <button
                        type="button"
                        className={styles.entryRemove}
                        onClick={() =>
                          setField(
                            "workEntries",
                            form.workEntries.filter((w) => w.id !== work.id)
                          )
                        }
                        aria-label={`Remove position ${idx + 1}`}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className={styles.fieldGrid}>
                    <div className={styles.field}>
                      <label htmlFor={`work-title-${work.id}`}>Job Title</label>
                      <input
                        id={`work-title-${work.id}`}
                        type="text"
                        value={work.title}
                        onChange={(e) =>
                          updateWork(work.id, "title", e.target.value)
                        }
                        placeholder="Senior Product Manager"
                      />
                    </div>
                    <div className={styles.field}>
                      <label htmlFor={`work-company-${work.id}`}>Company</label>
                      <input
                        id={`work-company-${work.id}`}
                        type="text"
                        value={work.company}
                        onChange={(e) =>
                          updateWork(work.id, "company", e.target.value)
                        }
                        placeholder="CloudScale Inc."
                      />
                    </div>
                    <div className={styles.field}>
                      <label htmlFor={`work-start-${work.id}`}>Start Date</label>
                      <input
                        id={`work-start-${work.id}`}
                        type="text"
                        value={work.startDate}
                        onChange={(e) =>
                          updateWork(work.id, "startDate", e.target.value)
                        }
                        placeholder="2022-01"
                      />
                    </div>
                    <div className={styles.field}>
                      <label htmlFor={`work-end-${work.id}`}>End Date</label>
                      <input
                        id={`work-end-${work.id}`}
                        type="text"
                        value={work.endDate}
                        onChange={(e) =>
                          updateWork(work.id, "endDate", e.target.value)
                        }
                        placeholder="Present"
                      />
                    </div>
                  </div>
                  <div className={styles.field}>
                    <label htmlFor={`work-bullets-${work.id}`}>
                      Key Achievements
                      <span className={styles.fieldHint}>One per line. Start with strong action verbs.</span>
                    </label>
                    <textarea
                      id={`work-bullets-${work.id}`}
                      rows={4}
                      value={work.bullets}
                      onChange={(e) =>
                        updateWork(work.id, "bullets", e.target.value)
                      }
                      placeholder={"Led go-to-market strategy for 3 product launches\nIncreased pipeline by 40% through data-driven campaigns"}
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                className={styles.addBtn}
                onClick={() =>
                  setField("workEntries", [...form.workEntries, blankWork()])
                }
              >
                + Add Work Experience
              </button>
            </fieldset>

            {/* Education */}
            <fieldset className={styles.fieldGroup}>
              <legend className={styles.fieldLegend}>Education</legend>
              {form.eduEntries.map((edu, idx) => (
                <div key={edu.id} className={styles.entryCard}>
                  <div className={styles.entryHeader}>
                    <span className={styles.entryBadge}>Education {idx + 1}</span>
                    {form.eduEntries.length > 1 && (
                      <button
                        type="button"
                        className={styles.entryRemove}
                        onClick={() =>
                          setField(
                            "eduEntries",
                            form.eduEntries.filter((e) => e.id !== edu.id)
                          )
                        }
                        aria-label={`Remove education ${idx + 1}`}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className={styles.fieldGrid}>
                    <div className={styles.field}>
                      <label htmlFor={`edu-degree-${edu.id}`}>Degree</label>
                      <input
                        id={`edu-degree-${edu.id}`}
                        type="text"
                        value={edu.degree}
                        onChange={(e) =>
                          updateEdu(edu.id, "degree", e.target.value)
                        }
                        placeholder="B.S. Computer Science"
                      />
                    </div>
                    <div className={styles.field}>
                      <label htmlFor={`edu-inst-${edu.id}`}>Institution</label>
                      <input
                        id={`edu-inst-${edu.id}`}
                        type="text"
                        value={edu.institution}
                        onChange={(e) =>
                          updateEdu(edu.id, "institution", e.target.value)
                        }
                        placeholder="University of Washington"
                      />
                    </div>
                    <div className={styles.field}>
                      <label htmlFor={`edu-start-${edu.id}`}>Start Year</label>
                      <input
                        id={`edu-start-${edu.id}`}
                        type="text"
                        value={edu.startDate}
                        onChange={(e) =>
                          updateEdu(edu.id, "startDate", e.target.value)
                        }
                        placeholder="2017"
                      />
                    </div>
                    <div className={styles.field}>
                      <label htmlFor={`edu-end-${edu.id}`}>End Year</label>
                      <input
                        id={`edu-end-${edu.id}`}
                        type="text"
                        value={edu.endDate}
                        onChange={(e) =>
                          updateEdu(edu.id, "endDate", e.target.value)
                        }
                        placeholder="2021"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className={styles.addBtn}
                onClick={() =>
                  setField("eduEntries", [...form.eduEntries, blankEdu()])
                }
              >
                + Add Education
              </button>
            </fieldset>

            {/* Skills */}
            <fieldset className={styles.fieldGroup}>
              <legend className={styles.fieldLegend}>Skills</legend>
              <div className={styles.field}>
                <label htmlFor="cv-skills">
                  Skills
                  <span className={styles.fieldHint}>Separate with commas</span>
                </label>
                <textarea
                  id="cv-skills"
                  rows={3}
                  value={form.skills}
                  onChange={(e) => setField("skills", e.target.value)}
                  placeholder="Project management, Python, Data analysis, Agile, SQL"
                />
              </div>
              {form.skills && (
                <div className={styles.skillTags}>
                  {form.skills
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .map((skill, i) => (
                      <span key={i} className={styles.skillTag}>
                        {skill}
                      </span>
                    ))}
                </div>
              )}
            </fieldset>

            {/* Certifications */}
            <fieldset className={styles.fieldGroup}>
              <legend className={styles.fieldLegend}>
                Certifications <span className={styles.optional}>(Optional)</span>
              </legend>
              {form.certEntries.map((cert, idx) => (
                <div key={cert.id} className={styles.entryCard}>
                  <div className={styles.entryHeader}>
                    <span className={styles.entryBadge}>Certification {idx + 1}</span>
                    <button
                      type="button"
                      className={styles.entryRemove}
                      onClick={() =>
                        setField(
                          "certEntries",
                          form.certEntries.filter((c) => c.id !== cert.id)
                        )
                      }
                      aria-label={`Remove certification ${idx + 1}`}
                    >
                      Remove
                    </button>
                  </div>
                  <div className={`${styles.fieldGrid} ${styles.fieldGrid3}`}>
                    <div className={styles.field}>
                      <label htmlFor={`cert-name-${cert.id}`}>Name</label>
                      <input
                        id={`cert-name-${cert.id}`}
                        type="text"
                        value={cert.name}
                        onChange={(e) =>
                          updateCert(cert.id, "name", e.target.value)
                        }
                        placeholder="AWS Solutions Architect"
                      />
                    </div>
                    <div className={styles.field}>
                      <label htmlFor={`cert-issuer-${cert.id}`}>Issuer</label>
                      <input
                        id={`cert-issuer-${cert.id}`}
                        type="text"
                        value={cert.issuer}
                        onChange={(e) =>
                          updateCert(cert.id, "issuer", e.target.value)
                        }
                        placeholder="Amazon Web Services"
                      />
                    </div>
                    <div className={styles.field}>
                      <label htmlFor={`cert-date-${cert.id}`}>Year</label>
                      <input
                        id={`cert-date-${cert.id}`}
                        type="text"
                        value={cert.date}
                        onChange={(e) =>
                          updateCert(cert.id, "date", e.target.value)
                        }
                        placeholder="2023"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className={styles.addBtn}
                onClick={() =>
                  setField("certEntries", [...form.certEntries, blankCert()])
                }
              >
                + Add Certification
              </button>
            </fieldset>

            {/* Job Description */}
            <fieldset className={styles.fieldGroup}>
              <legend className={styles.fieldLegend}>
                Job Description <span className={styles.optional}>(Optional)</span>
              </legend>
              <div className={styles.field}>
                <label htmlFor="cv-jd">
                  Paste a job description to check keyword match
                </label>
                <textarea
                  id="cv-jd"
                  rows={5}
                  value={form.jobDescription}
                  onChange={(e) => setField("jobDescription", e.target.value)}
                  placeholder="Paste the full job description here to see how well your CV matches the required keywords..."
                />
              </div>
            </fieldset>

            {/* CTA */}
            <div className={styles.formActions}>
              <button
                className={`${styles.btn} ${styles.btnPrimary} ${styles.btnLg}`}
                onClick={handleBuildCv}
                id="build-cv-bottom-btn"
              >
                Build ATS CV
              </button>
              <button
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={handleClear}
                id="clear-form-btn"
              >
                Clear Form
              </button>
            </div>
          </div>

          {/* ─── PREVIEW + ANALYSIS ─── */}
          <div className={styles.previewPanel} ref={previewRef}>
            {/* Actions Bar */}
            {hasContent && (
              <div className={styles.actionsBar}>
                <button
                  className={styles.actionBtn}
                  onClick={handleCopy}
                  id="copy-plain-text-btn"
                >
                  <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M8 2a2 2 0 00-2 2v1H5a2 2 0 00-2 2v9a2 2 0 002 2h6a2 2 0 002-2v-1h1a2 2 0 002-2V4a2 2 0 00-2-2H8zm4 4V4H8v2h4zm-7 1h9v9H5V7z" fill="currentColor"/></svg>
                  {copyMsg || "Copy Plain Text"}
                </button>
                <button
                  className={styles.actionBtn}
                  onClick={handleDownloadPdf}
                  id="download-pdf-btn"
                >
                  <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3v8m0 0l-3-3m3 3l3-3M4 14v1a2 2 0 002 2h8a2 2 0 002-2v-1" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Download PDF
                </button>
              </div>
            )}

            {/* CV Preview */}
            <div className={styles.paper} id="cv-preview" ref={cvPreviewRef}>
              {!hasContent && !showPreview ? (
                <div className={styles.paperEmpty}>
                  <div className={styles.paperEmptyIcon}>
                    <svg viewBox="0 0 48 48" aria-hidden="true">
                      <rect x="8" y="4" width="32" height="40" rx="3" fill="none" stroke="currentColor" strokeWidth="2"/>
                      <path d="M14 14h20M14 20h20M14 26h14M14 32h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <p className={styles.paperEmptyTitle}>Your CV preview will appear here</p>
                  <p className={styles.paperEmptySub}>Fill in the form on the left or load an example to get started.</p>
                </div>
              ) : (
                <div>
                  {/* Name & Contact */}
                  {form.fullName && (
                    <h2 className={styles.paperName}>{form.fullName}</h2>
                  )}
                  <div className={styles.paperContact}>
                    {[form.email, form.phone, form.location, form.linkedin, form.portfolio]
                      .filter(Boolean)
                      .map((item, i) => (
                        <span key={i}>{item}</span>
                      ))}
                  </div>
                  {form.targetTitle && (
                    <p className={styles.paperTarget}>{form.targetTitle}</p>
                  )}

                  {/* Summary */}
                  {form.summary && (
                    <div className={styles.paperSection}>
                      <h3 className={styles.paperHeading}>Summary</h3>
                      <p>{form.summary}</p>
                    </div>
                  )}

                  {/* Work Experience */}
                  {form.workEntries.some((w) => w.title || w.company) && (
                    <div className={styles.paperSection}>
                      <h3 className={styles.paperHeading}>Work Experience</h3>
                      {form.workEntries.map(
                        (w) =>
                          (w.title || w.company) && (
                            <div key={w.id} className={styles.paperEntry}>
                              <div className={styles.paperEntryHeader}>
                                <strong>
                                  {w.title}
                                  {w.company ? `, ${w.company}` : ""}
                                </strong>
                                {(w.startDate || w.endDate) && (
                                  <span className={styles.paperDates}>
                                    {formatDate(w.startDate)} – {formatDate(w.endDate)}
                                  </span>
                                )}
                              </div>
                              {w.bullets && (
                                <ul className={styles.paperBullets}>
                                  {w.bullets
                                    .split("\n")
                                    .filter(Boolean)
                                    .map((b, i) => (
                                      <li key={i}>
                                        {b.replace(/^[\-•]\s*/, "")}
                                      </li>
                                    ))}
                                </ul>
                              )}
                            </div>
                          )
                      )}
                    </div>
                  )}

                  {/* Education */}
                  {form.eduEntries.some(
                    (e) => e.degree || e.institution
                  ) && (
                    <div className={styles.paperSection}>
                      <h3 className={styles.paperHeading}>Education</h3>
                      {form.eduEntries.map(
                        (e) =>
                          (e.degree || e.institution) && (
                            <div key={e.id} className={styles.paperEntry}>
                              <div className={styles.paperEntryHeader}>
                                <strong>
                                  {e.degree}
                                  {e.institution
                                    ? `, ${e.institution}`
                                    : ""}
                                </strong>
                                {(e.startDate || e.endDate) && (
                                  <span className={styles.paperDates}>
                                    {formatDate(e.startDate)} – {formatDate(e.endDate)}
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                      )}
                    </div>
                  )}

                  {/* Skills */}
                  {form.skills && (
                    <div className={styles.paperSection}>
                      <h3 className={styles.paperHeading}>Skills</h3>
                      <p>{form.skills}</p>
                    </div>
                  )}

                  {/* Certifications */}
                  {form.certEntries.some((c) => c.name) && (
                    <div className={styles.paperSection}>
                      <h3 className={styles.paperHeading}>Certifications</h3>
                      {form.certEntries.map(
                        (c) =>
                          c.name && (
                            <div key={c.id} className={styles.paperEntry}>
                              <strong>{c.name}</strong>
                              {c.issuer && <span> — {c.issuer}</span>}
                              {c.date && (
                                <span className={styles.paperDates}> ({c.date})</span>
                              )}
                            </div>
                          )
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ─── ATS Analysis ─── */}
            {hasContent && (
              <div className={styles.atsPanel}>
                <h2 className={styles.sectionTitle}>ATS Analysis</h2>

                {/* Risk Level */}
                <div className={styles.atsCard}>
                  <div className={styles.atsCardHeader}>
                    <span className={styles.atsLabel}>Formatting Risk</span>
                    <span
                      className={`${styles.atsBadge} ${styles[`atsBadge${atsAnalysis.riskLevel}`]}`}
                    >
                      {atsAnalysis.riskLevel}
                    </span>
                  </div>
                  <p className={styles.atsNote}>
                    {atsAnalysis.riskLevel === "Low"
                      ? "Your CV uses a clean, ATS-friendly format with standard sections."
                      : atsAnalysis.riskLevel === "Medium"
                      ? "Some standard sections are missing. Consider adding them for better ATS compatibility."
                      : "Several critical sections or contact details are missing. Fill them in for best results."}
                  </p>
                </div>

                {/* Warnings */}
                {(atsAnalysis.warnings.length > 0 ||
                  atsAnalysis.issues.length > 0) && (
                  <div className={styles.atsCard}>
                    <span className={styles.atsLabel}>Checks</span>
                    <ul className={styles.atsList}>
                      {atsAnalysis.warnings.map((w, i) => (
                        <li key={`w-${i}`} className={`${styles.atsItem} ${styles.atsWarn}`}>
                          <span className={`${styles.atsDot} ${styles.atsDotWarn}`} />
                          {w}
                        </li>
                      ))}
                      {atsAnalysis.issues.map((iss, i) => (
                        <li key={`i-${i}`} className={`${styles.atsItem} ${styles.atsIssue}`}>
                          <span className={`${styles.atsDot} ${styles.atsDotIssue}`} />
                          {iss}
                        </li>
                      ))}
                      {atsAnalysis.warnings.length === 0 &&
                        atsAnalysis.issues.length === 0 && (
                          <li className={`${styles.atsItem} ${styles.atsPass}`}>
                            <span className={`${styles.atsDot} ${styles.atsDotPass}`} />
                            All checks passed
                          </li>
                        )}
                    </ul>
                  </div>
                )}

                {/* Keyword Match */}
                {atsAnalysis.keywordMatch && (
                  <div className={styles.atsCard}>
                    <div className={styles.atsCardHeader}>
                      <span className={styles.atsLabel}>Keyword Match</span>
                      <span
                        className={`${styles.atsBadge} ${
                          atsAnalysis.keywordMatch.score >= 60
                            ? styles.atsBadgeLow
                            : atsAnalysis.keywordMatch.score >= 35
                            ? styles.atsBadgeMedium
                            : styles.atsBadgeHigh
                        }`}
                      >
                        {atsAnalysis.keywordMatch.score}%
                      </span>
                    </div>
                    <p className={styles.atsNote}>
                      {atsAnalysis.keywordMatch.matched} of{" "}
                      {atsAnalysis.keywordMatch.total} keywords from the job
                      description found in your CV.
                    </p>
                    {atsAnalysis.keywordMatch.missing.length > 0 && (
                      <>
                        <span className={styles.atsSublabel}>
                          Missing keywords to consider adding:
                        </span>
                        <div className={styles.keywordTags}>
                          {atsAnalysis.keywordMatch.missing.map((kw, i) => (
                            <span key={i} className={`${styles.keywordTag} ${styles.keywordMissing}`}>
                              {kw}
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Action Verbs */}
                <div className={styles.atsCard}>
                  <span className={styles.atsLabel}>Action Verb Check</span>
                  {atsAnalysis.weakVerbsFound.length > 0 && (
                    <div className={styles.verbSuggestions}>
                      {atsAnalysis.weakVerbsFound.map((wv, i) => (
                        <div key={i} className={styles.verbRow}>
                          <span className={styles.verbWeak}>
                            &ldquo;{wv.verb}&rdquo;
                          </span>
                          <span className={styles.verbArrow}>→</span>
                          <span className={styles.verbStrong}>
                            Try: {wv.suggestions.join(", ")}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {atsAnalysis.strongVerbsUsed.length > 0 && (
                    <div className={styles.verbGood}>
                      <span className={styles.atsSublabel}>
                        Strong verbs found:
                      </span>
                      <div className={styles.keywordTags}>
                        {atsAnalysis.strongVerbsUsed.map((v, i) => (
                          <span key={i} className={`${styles.keywordTag} ${styles.keywordMatch}`}>
                            {v}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {atsAnalysis.weakVerbsFound.length === 0 &&
                    atsAnalysis.strongVerbsUsed.length === 0 && (
                      <p className={styles.atsNote}>
                        Add work experience bullet points to get action verb
                        suggestions.
                      </p>
                    )}
                </div>

                <p className={styles.disclaimer}>
                  This tool provides ATS-friendly formatting and keyword match
                  checks. It does not guarantee passing any specific ATS system.
                  Results vary by employer and software.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ─── Footer ─── */}
        <footer className="footer mt-16 pb-10">
          <div className="footer-top" />
          <div className="site-footer-grid">
            <p className="text-slate-400 text-sm">
              100 Tools builds small, useful products for creators and operators.
            </p>
            <div className="site-footer-links">
              <Link href="/privacy-policy" className="footer-link">Privacy Policy</Link>
              <Link href="/terms" className="footer-link">Terms</Link>
              <Link href="/cookie-policy" className="footer-link">Cookie Policy</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
