"use client";

import Link from "next/link";
import { useState, useRef, useCallback, useMemo } from "react";
import { TopNav } from "@/components/top-nav";
import { ProductMark } from "@/components/product-icons";
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

/* ─── AI review types ─── */
type SuggestionKey =
  | "summary"
  | "experience-0"
  | "experience-1"
  | "experience-2"
  | "experience-3"
  | "experience-4"
  | "skills"
  | "education";

interface AiExperienceSuggestion {
  index: number;
  currentBullets: string;
  suggestedBullets: string;
  rationale: string;
}

interface AiSectionSuggestion {
  current: string;
  suggested: string;
  rationale: string;
}

interface AiReview {
  score: number;
  reasons: string[];
  roleFit?: {
    score: number;
    missingKeywords: string[];
    notes: string[];
  };
  sections?: {
    summary?: AiSectionSuggestion;
    experience?: AiExperienceSuggestion[];
    skills?: AiSectionSuggestion;
    education?: AiSectionSuggestion;
    formatting?: string[];
  };
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

const SAMPLE_OLD_CV = `Sarah Chen
sarah.chen@email.com | +1 (555) 234-5678 | San Francisco, CA
linkedin.com/in/sarahchen

Objective
Looking for a challenging product marketing role at a fast-growing SaaS company where I can use my skills and experience.

Experience

Product Marketing Manager | CloudScale Inc. | 2022 - Present
- Helped the team launch some new products
- Made battle cards for the sales team
- Was responsible for competitive analysis
- Worked on cross-functional campaigns

Marketing Coordinator | DataFlow Systems | 2019 - 2021
- Did content marketing
- Used HubSpot
- Ran some webinars

Education
MBA, Marketing, UC Berkeley
B.S. Communications, University of Washington

Skills
HubSpot, Salesforce, Google Analytics, social media, writing, presentations`;

/* ─── Helpers ─── */

/**
 * Common CV section/heading labels used at line starts. The "name" heuristic
 * only accepts the first non-empty line if it does NOT match one of these.
 */
const CV_HEADING_PATTERN =
  /^(objective|summary|professional summary|experience|work experience|employment|work history|education|skills|core skills|technical skills|certifications|certificates|projects|achievements|awards|interests|hobbies|references|contact|profile|about|contact information|contact details|languages|publications|volunteer|volunteering)\b/i;

/**
 * Conservative contact-info extraction from a pasted plain-text CV. Each field
 * is only populated when the source text contains an unambiguous signal. If a
 * field cannot be detected, it is left as an empty string and the caller
 * decides what to do (we never overwrite existing form values).
 */
function extractContactInfo(text: string): {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  portfolio: string;
} {
  const result = {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    portfolio: "",
  };
  if (!text || text.length < 20) return result;

  // Email — high confidence regex
  const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  if (emailMatch) result.email = emailMatch[0].trim();

  // Phone — accept common formats but require at least 7 digits
  const phoneMatch = text.match(
    /(?:\+?\d{1,3}[\s.-]?)?(?:\(\d{2,4}\)[\s.-]?)?\d{3}[\s.-]?\d{3,4}[\s.-]?\d{0,4}/
  );
  if (phoneMatch) {
    const digits = phoneMatch[0].replace(/\D/g, "");
    if (digits.length >= 7 && digits.length <= 15) {
      result.phone = phoneMatch[0].trim();
    }
  }

  // LinkedIn — only accept a clean /in/<handle> URL
  const linkedinMatch = text.match(
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?/i
  );
  if (linkedinMatch) result.linkedin = linkedinMatch[0].trim();

  // Portfolio — look for a personal domain on a line of its own, or a
  // "website:" / "portfolio:" label. Skip anything that looks like email or
  // social (linkedin/github/twitter). Skip anything containing spaces.
  const portfolioMatch = text.match(
    /(?:^|\n)\s*(?:website|portfolio|personal site|homepage)?\s*:?\s*((?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z]{2,})+(?:\/[^\s]*)?)\s*(?:\n|$)/i
  );
  if (portfolioMatch && portfolioMatch[1]) {
    const url = portfolioMatch[1].trim();
    if (
      !/[@\s]/.test(url) &&
      !/linkedin|github|twitter|facebook|instagram/i.test(url)
    ) {
      result.portfolio = url;
    }
  }

  // Location — conservative. Accept lines that look like "City, ST" or
  // "City, State" near the top of the CV, but only if the line is short,
  // does not contain "@" (would suggest contact line), and does not look
  // like a job line (no "|", no year digits).
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 8);
  for (const line of lines) {
    if (line.length > 60) continue;
    if (line.includes("@")) continue;
    if (line.includes("|")) continue;
    if (/\b(19|20)\d{2}\b/.test(line)) continue;
    if (/^[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s*[A-Z]{2}(?:\s|$)/.test(line)) {
      result.location = line;
      break;
    }
    if (
      /^[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*\s*$/.test(
        line
      )
    ) {
      result.location = line;
      break;
    }
  }

  // Name — only the first non-empty line, and only if it does not look like
  // a heading. Heuristic: line should be short, contain at least one space,
  // start with a letter, and not contain digits or symbols other than
  // letters, spaces, periods, commas, apostrophes, hyphens.
  if (lines.length > 0) {
    const first = lines[0];
    if (
      first.length <= 60 &&
      first.length >= 4 &&
      /^[A-Za-z]/.test(first) &&
      /\s/.test(first) &&
      !/\d/.test(first) &&
      !/[<>:;{}[\]\\|=+_()@/]/.test(first) &&
      !CV_HEADING_PATTERN.test(first)
    ) {
      result.fullName = first;
    }
  }

  return result;
}

/**
 * Normalize a free-form skills string into a clean comma-separated list.
 * Splits on common separators, trims, dedupes case-insensitively (preserves
 * the casing of the first occurrence), and rejoins.
 */
function normalizeSkills(s: string): string {
  if (!s) return "";
  const tokens = s
    .split(/[,\n;]+|\s+\band\b\s+|\s*&\s*|\s*\/\s*/i)
    .map((t) => t.trim())
    .filter(Boolean);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const tok of tokens) {
    const key = tok.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(tok);
  }
  return out.join(", ");
}

/**
 * Split an AI-returned education block into structured EduEntry rows. Tries
 * several common formats before falling back to a single "degree only" row.
 */
function parseEducationBlock(suggested: string): EduEntry[] {
  if (!suggested || !suggested.trim()) return [];
  const lines = suggested
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const yearRange = "\\d{4}\\s*[–\\-]\\s*(\\d{4}|Present)";

  const tryParse = (line: string): EduEntry | null => {
    // Format 1: "Degree, Institution | YYYY – YYYY"
    let m = line.match(
      new RegExp(`^(.+?),\\s*(.+?)\\s*\\|\\s*(${yearRange})$`)
    );
    if (m) {
      const years = m[3].split(/\s*[–\-]\s*/);
      return {
        id: uid(),
        degree: m[1].trim(),
        institution: m[2].trim(),
        startDate: years[0]?.trim() || "",
        endDate: years[1]?.trim() || "",
      };
    }
    // Format 2: "Degree | Institution | YYYY – YYYY"
    m = line.match(
      new RegExp(`^(.+?)\\s*\\|\\s*(.+?)\\s*\\|\\s*(${yearRange})$`)
    );
    if (m) {
      const years = m[3].split(/\s*[–\-]\s*/);
      return {
        id: uid(),
        degree: m[1].trim(),
        institution: m[2].trim(),
        startDate: years[0]?.trim() || "",
        endDate: years[1]?.trim() || "",
      };
    }
    // Format 3: "Degree, Institution (YYYY – YYYY)"
    m = line.match(
      new RegExp(`^(.+?),\\s*(.+?)\\s*\\(\\s*(${yearRange})\\s*\\)$`)
    );
    if (m) {
      const years = m[3].split(/\s*[–\-]\s*/);
      return {
        id: uid(),
        degree: m[1].trim(),
        institution: m[2].trim(),
        startDate: years[0]?.trim() || "",
        endDate: years[1]?.trim() || "",
      };
    }
    // Format 4: "Degree – Institution, YYYY – YYYY" (en dash or hyphen)
    m = line.match(
      new RegExp(`^(.+?)\\s*[–\\-]\\s*(.+?),\\s*(${yearRange})$`)
    );
    if (m) {
      const years = m[3].split(/\s*[–\-]\s*/);
      return {
        id: uid(),
        degree: m[1].trim(),
        institution: m[2].trim(),
        startDate: years[0]?.trim() || "",
        endDate: years[1]?.trim() || "",
      };
    }
    // Format 5: "Institution: Degree, YYYY – YYYY"
    m = line.match(
      new RegExp(
        `^([^:]+):\\s*(.+?),\\s*(${yearRange})$`
      )
    );
    if (m) {
      const years = m[3].split(/\s*[–\-]\s*/);
      return {
        id: uid(),
        degree: m[2].trim(),
        institution: m[1].trim(),
        startDate: years[0]?.trim() || "",
        endDate: years[1]?.trim() || "",
      };
    }
    return null;
  };

  const parsed: EduEntry[] = [];
  for (const line of lines) {
    const entry = tryParse(line);
    if (entry) {
      parsed.push(entry);
    } else if (parsed.length === 0) {
      // Fallback: treat the whole line as a degree (no institution, no dates)
      // so the user at least sees something rather than nothing.
      parsed.push({
        id: uid(),
        degree: line,
        institution: "",
        startDate: "",
        endDate: "",
      });
    } else {
      // Append to the previous entry's institution (rare case)
      const prev = parsed[parsed.length - 1];
      prev.institution = prev.institution
        ? `${prev.institution} ${line}`.trim()
        : line;
    }
  }
  return parsed;
}

/**
 * Common keywords for a few generic role families, used to label "suggested
 * keywords for this role" when only the target job title is filled in (no JD).
 * Each list is small (5-7 entries) and intentionally generic — we never claim
 * these are exhaustive, only that they are common signals.
 */
const ROLE_KEYWORDS: Record<string, string[]> = {
  "product marketing": [
    "positioning",
    "go-to-market",
    "sales enablement",
    "competitive analysis",
    "B2B",
    "messaging",
  ],
  marketing: [
    "campaigns",
    "demand generation",
    "content",
    "SEO",
    "conversion",
    "brand",
  ],
  "product manager": [
    "roadmap",
    "stakeholders",
    "user research",
    "prioritization",
    "metrics",
    "MVP",
  ],
  engineering: [
    "architecture",
    "scalability",
    "testing",
    "code review",
    "CI/CD",
    "reliability",
  ],
  design: [
    "Figma",
    "user research",
    "wireframes",
    "prototyping",
    "design system",
    "usability",
  ],
  sales: [
    "pipeline",
    "quota",
    "forecasting",
    "negotiation",
    "CRM",
    "enterprise",
  ],
  data: [
    "SQL",
    "dashboards",
    "experimentation",
    "modeling",
    "analytics",
    "Python",
  ],
  operations: [
    "process",
    "stakeholders",
    "budget",
    "vendor",
    "logistics",
    "metrics",
  ],
  finance: [
    "forecasting",
    "budget",
    "modeling",
    "audit",
    "compliance",
    "Excel",
  ],
};

function suggestedRoleKeywords(targetTitle: string): string[] {
  if (!targetTitle) return [];
  const norm = targetTitle.toLowerCase();
  // Longest-key match so "product marketing" wins over "marketing"
  let best: { key: string; kws: string[] } | null = null;
  for (const [key, kws] of Object.entries(ROLE_KEYWORDS)) {
    if (norm.includes(key) && (!best || key.length > best.key.length)) {
      best = { key, kws };
    }
  }
  return best ? best.kws : [];
}

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

  /* ─── AI review state ─── */
  const [cvText, setCvText] = useState("");
  const [aiReview, setAiReview] = useState<AiReview | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [appliedSections, setAppliedSections] = useState<Set<string>>(
    new Set()
  );
  const [openDiff, setOpenDiff] = useState<SuggestionKey | null>(null);
  const [autoFilledNote, setAutoFilledNote] = useState<string | null>(null);
  const [recheckInFlight, setRecheckInFlight] = useState(false);
  const [recheckJustCompleted, setRecheckJustCompleted] = useState(false);

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

  /* ─── AI review handlers ─── */
  const handleAiReview = async () => {
    if (!cvText.trim() || aiLoading) return;
    setAiLoading(true);
    setAiError(null);
    setAiReview(null);
    setAppliedSections(new Set());
    setOpenDiff(null);
    setAutoFilledNote(null);

    try {
      const res = await fetch("/api/ats-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cvText: cvText.trim(),
          jobDescription: form.jobDescription.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(
          data?.error || `AI review failed (HTTP ${res.status})`
        );
      }

      const data = (await res.json()) as AiReview;
      setAiReview(data);

      // Conservative auto-fill: only fill fields the user has not already
      // filled. Each field is only set when extractContactInfo is confident.
      const detected = extractContactInfo(cvText);
      const filled: string[] = [];
      setForm((prev) => {
        const next = { ...prev };
        if (!prev.fullName && detected.fullName) {
          next.fullName = detected.fullName;
          filled.push("name");
        }
        if (!prev.email && detected.email) {
          next.email = detected.email;
          filled.push("email");
        }
        if (!prev.phone && detected.phone) {
          next.phone = detected.phone;
          filled.push("phone");
        }
        if (!prev.location && detected.location) {
          next.location = detected.location;
          filled.push("location");
        }
        if (!prev.linkedin && detected.linkedin) {
          next.linkedin = detected.linkedin;
          filled.push("LinkedIn");
        }
        if (!prev.portfolio && detected.portfolio) {
          next.portfolio = detected.portfolio;
          filled.push("portfolio");
        }
        return next;
      });
      if (filled.length > 0) {
        setAutoFilledNote(
          `Auto-filled from your pasted CV: ${filled.join(", ")}. Edit any field if it looks wrong.`
        );
      }

      setShowPreview(true);
      setTimeout(() => {
        previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not run AI review.";
      setAiError(message);
    } finally {
      setAiLoading(false);
    }
  };

  /**
   * Re-check the improved CV after the user has applied suggestions. Sends the
   * CURRENT form state (not the originally pasted text) so the new score
   * reflects the user's edits.
   */
  const handleRecheck = async () => {
    if (aiLoading) return;
    setAiLoading(true);
    setAiError(null);
    setOpenDiff(null);
    setRecheckInFlight(true);

    try {
      const currentCvText = buildPlainText();
      const res = await fetch("/api/ats-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cvText: currentCvText,
          jobDescription: form.jobDescription.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(
          data?.error || `Re-check failed (HTTP ${res.status})`
        );
      }

      const data = (await res.json()) as AiReview;
      // Overwrite the previous review. Reset appliedSections because the new
      // review's section keys may not match the old ones 1:1, and the user
      // has effectively "reset" their review state.
      setAiReview(data);
      setAppliedSections(new Set());
      setRecheckJustCompleted(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not re-check the CV.";
      setAiError(message);
    } finally {
      setAiLoading(false);
      setRecheckInFlight(false);
    }
  };

  const applySuggestion = (key: SuggestionKey) => {
    if (!aiReview?.sections) return;
    const sections = aiReview.sections;

    if (key === "summary" && sections.summary) {
      setField("summary", sections.summary.suggested);
    } else if (key.startsWith("experience-") && sections.experience) {
      const idx = Number(key.slice("experience-".length));
      const exp = sections.experience.find((e) => e.index === idx);
      if (exp) {
        setForm((prev) => ({
          ...prev,
          workEntries: prev.workEntries.map((w, i) =>
            i === idx ? { ...w, bullets: exp.suggestedBullets } : w
          ),
        }));
      }
    } else if (key === "skills" && sections.skills) {
      setField("skills", normalizeSkills(sections.skills.suggested));
    } else if (key === "education" && sections.education) {
      const edu = sections.education;
      const parsed = parseEducationBlock(edu.suggested);
      setForm((prev) => ({
        ...prev,
        eduEntries: parsed.length > 0 ? parsed : prev.eduEntries,
      }));
    }

    setAppliedSections((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
    setOpenDiff(null);
    // Clear the "just completed re-check" flag if the user is editing again
    setRecheckJustCompleted(false);
  };

  const applyAllSuggestions = () => {
    if (!aiReview?.sections) return;
    const sections = aiReview.sections;
    const keys: SuggestionKey[] = [];
    if (sections.summary) keys.push("summary");
    if (sections.experience) {
      sections.experience.forEach((e) => {
        if (e.index < 5) keys.push(`experience-${e.index}` as SuggestionKey);
      });
    }
    if (sections.skills) keys.push("skills");
    if (sections.education) keys.push("education");
    keys.forEach((k) => applySuggestion(k));
  };

  const scoreColor = (s: number): "low" | "mid" | "high" => {
    if (s < 40) return "low";
    if (s < 70) return "mid";
    return "high";
  };

  const scoreLabel = (s: number): string => {
    if (s < 30) return "Major ATS issues";
    if (s < 60) return "Needs improvement";
    if (s < 80) return "Solid, with room to improve";
    return "ATS-ready";
  };

  const hasContent =
    form.fullName || form.summary || form.workEntries.some((w) => w.title);

  /* ─── Render ─── */
  return (
    <div className={`${styles.cvMakerPage} ats-cv-maker`}>
      {/* ─── Nav ─── */}
      <div className={styles.cvMakerContent}>
        <TopNav activeHref="/ats-cv-maker" variant="centered" />

        {/* ─── Hero ─── */}
        <section className={styles.hero}>
          <ProductMark accent="cv" size="md" className="ats-page-mark" />
          <span className={styles.heroPill}>
            <svg viewBox="0 0 20 20" width="12" height="12" aria-hidden>
              <path
                d="M10 2l2 5h5l-4 3 1.5 5L10 12l-4.5 3L7 10 3 7h5l2-5z"
                fill="currentColor"
              />
            </svg>
            Live · Now with AI ATS review
          </span>
          <h1 className={styles.title}>
            Free <span className={styles.textGradientGreen}>AI-Powered</span>{" "}
            ATS CV Maker
          </h1>
          <p className={styles.subtitle}>
            Build a clean ATS-friendly CV and review it with AI. Paste your old CV, get an instant
            ATS score with section-by-section suggestions, edit them right here in the form, then
            download a clean, recruiter-readable PDF. No hidden fees. No sign-up.
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
            <span>AI ATS score</span>
            <span>Section-by-section suggestions</span>
            <span>Edit in form</span>
            <span>PDF download</span>
            <span>100% free</span>
          </div>
        </section>

        {/* ─── AI Review Hero Card (full-width, premium) ─── */}
        <section
          className={styles.aiHeroCard}
          aria-label="AI ATS review of your old CV"
        >
          <div className={styles.aiHeroHead}>
            <div className={styles.aiHeroCopy}>
              <span className={styles.aiHeroBadge}>
                <svg viewBox="0 0 20 20" width="11" height="11" aria-hidden>
                  <path
                    d="M10 2l2 5h5l-4 3 1.5 5L10 12l-4.5 3L7 10 3 7h5l2-5z"
                    fill="currentColor"
                  />
                </svg>
                NEW · AI-powered
              </span>
              <h2 className={styles.aiHeroTitle}>AI ATS review</h2>
              <p className={styles.aiHeroLede}>
                Paste your old CV and get a 0–100 ATS score, the specific issues
                holding it back, and section-by-section suggestions you can
                review and apply to the form below.
              </p>
            </div>
            <div className={styles.aiHeroSteps} aria-label="How it works">
              <div className={styles.aiStep}>
                <span className={styles.aiStepNum}>1</span>
                <div>
                  <div className={styles.aiStepTitle}>Paste</div>
                  <div className={styles.aiStepDesc}>
                    Drop in your current CV as plain text
                  </div>
                </div>
              </div>
              <div className={styles.aiStep}>
                <span className={styles.aiStepNum}>2</span>
                <div>
                  <div className={styles.aiStepTitle}>Review</div>
                  <div className={styles.aiStepDesc}>
                    Get a score and concrete suggestions
                  </div>
                </div>
              </div>
              <div className={styles.aiStep}>
                <span className={styles.aiStepNum}>3</span>
                <div>
                  <div className={styles.aiStepTitle}>Apply &amp; download</div>
                  <div className={styles.aiStepDesc}>
                    Apply changes to the form, then save as PDF
                  </div>
                </div>
              </div>
            </div>
          </div>

          {!aiReview ? (
            <div className={styles.aiHeroForm}>
              <label htmlFor="cv-old-text" className={styles.aiHeroLabel}>
                Paste your old CV
                <span className={styles.fieldHint}>
                  Plain text only. We do not store or log your CV.
                </span>
              </label>
              <textarea
                id="cv-old-text"
                rows={5}
                value={cvText}
                onChange={(e) => setCvText(e.target.value)}
                className={styles.aiHeroTextarea}
                placeholder="Paste the full text of your current CV here. The AI will score it for ATS-friendliness and suggest section-by-section improvements."
              />
              <div className={styles.aiHeroActions}>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  onClick={handleAiReview}
                  disabled={aiLoading || cvText.trim().length < 100}
                  id="ai-review-btn"
                >
                  {aiLoading ? (
                    <>
                      <svg
                        className={styles.btnSpinner}
                        viewBox="0 0 24 24"
                        width="14"
                        height="14"
                        aria-hidden
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          opacity="0.25"
                        />
                        <path
                          d="M22 12a10 10 0 00-10-10"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                      </svg>
                      Reviewing with AI...
                    </>
                  ) : (
                    <>
                      <svg
                        viewBox="0 0 20 20"
                        width="14"
                        height="14"
                        aria-hidden
                      >
                        <path
                          d="M10 2l2 5h5l-4 3 1.5 5L10 12l-4.5 3L7 10 3 7h5l2-5z"
                          fill="currentColor"
                        />
                      </svg>
                      Review my CV with AI
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => {
                    setCvText(SAMPLE_OLD_CV);
                    setAiError(null);
                  }}
                  id="ai-load-sample-btn"
                >
                  Load sample CV
                </button>
                <span className={styles.aiHeroMeta}>
                  {cvText.trim().length === 0
                    ? "Tip: paste any 100+ characters of CV text to start"
                    : cvText.trim().length < 100
                      ? `${cvText.trim().length} / 100 characters minimum`
                      : `${cvText.trim().length.toLocaleString()} characters ready`}
                </span>
              </div>
              <p className={styles.aiHeroHelper}>
                The sample is intentionally imperfect. It uses weak verbs and
                missing metrics on purpose, so you can see how the AI review
                flags real issues.
              </p>
              {aiError ? (
                <div className={styles.aiError} role="alert">
                  {aiError}
                </div>
              ) : null}
            </div>
          ) : (
            <div className={styles.aiPanel} aria-label="AI ATS review">
              <div className={styles.aiPanelHeader}>
                <h2 className={styles.aiPanelTitle}>Your AI ATS review</h2>
                <button
                  type="button"
                  className={styles.aiDismiss}
                  onClick={() => {
                    setAiReview(null);
                    setOpenDiff(null);
                    setAutoFilledNote(null);
                    setRecheckJustCompleted(false);
                  }}
                  aria-label="Dismiss AI review"
                >
                  ×
                </button>
              </div>

              {autoFilledNote ? (
                <div className={styles.aiAutoFilled} role="status">
                  <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden>
                    <path
                      d="M10 2a8 8 0 100 16 8 8 0 000-16zm.7 12.3l-4-4 1.4-1.4L10 11.2l4.9-4.9 1.4 1.4-6.3 6.3z"
                      fill="currentColor"
                    />
                  </svg>
                  {autoFilledNote}
                </div>
              ) : null}

              <div className={styles.aiScoreRow}>
                <div
                  className={`${styles.aiScore} ${styles.aiScoreCompact} ${styles[`aiScore${scoreColor(aiReview.score)}`]}`}
                >
                  <span className={styles.aiScoreValue}>{aiReview.score}</span>
                  <span className={styles.aiScoreMax}>/100</span>
                </div>
                <div className={styles.aiScoreCopy}>
                  <div className={styles.aiScoreLabel}>
                    {scoreLabel(aiReview.score)}
                  </div>
                  <p className={styles.aiScoreDesc}>
                    {recheckJustCompleted
                      ? "Updated score from re-checking your improved CV."
                      : "Score reflects ATS-friendliness and clarity. It is not a job-match score."}
                  </p>
                </div>
              </div>

              {aiReview.reasons.length > 0 ? (
                <div className={styles.aiReasons}>
                  <h3 className={styles.aiSubheading}>Why this score</h3>
                  <ul className={styles.aiReasonChips}>
                    {aiReview.reasons.slice(0, 6).map((r, i) => (
                      <li key={i} className={styles.aiReasonChip}>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {(() => {
                const hasJd = form.jobDescription.trim().length > 0;
                const hasTargetTitle =
                  form.targetTitle.trim().length > 0 && !hasJd;
                const roleFit = aiReview.roleFit;
                const roleKeywords = roleFit?.missingKeywords ?? [];
                const suggestedKws = !roleFit
                  ? suggestedRoleKeywords(form.targetTitle)
                  : [];
                if (!roleFit && suggestedKws.length === 0) return null;
                return (
                  <div className={styles.aiRoleFit}>
                    <div className={styles.aiSubheadingRow}>
                      <h3 className={styles.aiSubheading}>
                        {hasJd
                          ? "Role fit (vs. job description)"
                          : hasTargetTitle
                            ? `Role fit (vs. ${form.targetTitle.trim()})`
                            : "Role fit"}
                      </h3>
                      {roleFit ? (
                        <span
                          className={`${styles.aiPill} ${styles[`aiPill${scoreColor(roleFit.score)}`]}`}
                        >
                          {roleFit.score}/100
                        </span>
                      ) : (
                        <span className={styles.aiPill}>heuristic</span>
                      )}
                    </div>
                    {roleFit?.notes && roleFit.notes.length > 0 ? (
                      <ul className={styles.aiNoteList}>
                        {roleFit.notes.map((n, i) => (
                          <li key={i}>{n}</li>
                        ))}
                      </ul>
                    ) : null}
                    {roleKeywords.length > 0 ? (
                      <div className={styles.aiKeywords}>
                        <span className={styles.aiKeywordsLabel}>
                          Missing keywords from job description
                        </span>
                        <div className={styles.aiKeywordTags}>
                          {roleKeywords.map((kw, i) => (
                            <span key={i} className={styles.aiKeywordTag}>
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : suggestedKws.length > 0 ? (
                      <div className={styles.aiKeywords}>
                        <span className={styles.aiKeywordsLabel}>
                          Suggested keywords for this role
                        </span>
                        <div className={styles.aiKeywordTags}>
                          {suggestedKws.map((kw, i) => (
                            <span key={i} className={styles.aiKeywordTag}>
                              {kw}
                            </span>
                          ))}
                        </div>
                        <p className={styles.aiKeywordsNote}>
                          Paste a full job description for a real keyword
                          match score.
                        </p>
                      </div>
                    ) : null}
                  </div>
                );
              })()}

              {aiReview.sections &&
              (aiReview.sections.summary ||
                (aiReview.sections.experience &&
                  aiReview.sections.experience.length > 0) ||
                aiReview.sections.skills ||
                aiReview.sections.education ||
                (aiReview.sections.formatting &&
                  aiReview.sections.formatting.length > 0)) ? (
                <div className={styles.aiSuggestions}>
                  <div className={styles.aiSuggestionsHead}>
                    <h3 className={styles.aiSubheading}>
                      Suggested improvements
                    </h3>
                    <button
                      type="button"
                      className={styles.aiApplyAll}
                      onClick={applyAllSuggestions}
                      disabled={appliedSections.size > 0}
                      id="ai-apply-all-btn"
                    >
                      {appliedSections.size > 0
                        ? "All suggestions applied"
                        : "Apply all suggestions"}
                    </button>
                  </div>

                  {aiReview.sections.summary ? (
                    <SuggestionCard
                      keyId="summary"
                      title="Professional Summary"
                      current={aiReview.sections.summary.current}
                      suggested={aiReview.sections.summary.suggested}
                      rationale={aiReview.sections.summary.rationale}
                      applied={appliedSections.has("summary")}
                      isOpen={openDiff === "summary"}
                      onOpen={() => setOpenDiff("summary")}
                      onClose={() => setOpenDiff(null)}
                      onApply={() => applySuggestion("summary")}
                    />
                  ) : null}

                  {aiReview.sections.experience
                    ? aiReview.sections.experience.map((exp) => {
                        const key: SuggestionKey =
                          `experience-${exp.index}` as SuggestionKey;
                        const work = form.workEntries[exp.index];
                        const titleSuffix = work
                          ? ` · Position ${exp.index + 1}${
                              work.title ? ` (${work.title})` : ""
                            }`
                          : ` · Position ${exp.index + 1}`;
                        return (
                          <SuggestionCard
                            key={key}
                            keyId={key}
                            title={`Work Experience${titleSuffix}`}
                            current={exp.currentBullets}
                            suggested={exp.suggestedBullets}
                            rationale={exp.rationale}
                            applied={appliedSections.has(key)}
                            isOpen={openDiff === key}
                            onOpen={() => setOpenDiff(key)}
                            onClose={() => setOpenDiff(null)}
                            onApply={() => applySuggestion(key)}
                          />
                        );
                      })
                    : null}

                  {aiReview.sections.skills ? (
                    <SuggestionCard
                      keyId="skills"
                      title="Skills"
                      current={aiReview.sections.skills.current}
                      suggested={aiReview.sections.skills.suggested}
                      rationale={aiReview.sections.skills.rationale}
                      applied={appliedSections.has("skills")}
                      isOpen={openDiff === "skills"}
                      onOpen={() => setOpenDiff("skills")}
                      onClose={() => setOpenDiff(null)}
                      onApply={() => applySuggestion("skills")}
                    />
                  ) : null}

                  {aiReview.sections.education ? (
                    <SuggestionCard
                      keyId="education"
                      title="Education"
                      current={aiReview.sections.education.current}
                      suggested={aiReview.sections.education.suggested}
                      rationale={aiReview.sections.education.rationale}
                      applied={appliedSections.has("education")}
                      isOpen={openDiff === "education"}
                      onOpen={() => setOpenDiff("education")}
                      onClose={() => setOpenDiff(null)}
                      onApply={() => applySuggestion("education")}
                    />
                  ) : null}

                  {aiReview.sections.formatting &&
                  aiReview.sections.formatting.length > 0 ? (
                    <div className={styles.aiFormatting}>
                      <h4 className={styles.aiFormattingTitle}>
                        Formatting notes
                      </h4>
                      <ul className={styles.aiFormattingList}>
                        {aiReview.sections.formatting.map((n, i) => (
                          <li key={i}>{n}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {appliedSections.size > 0 ? (
                <div className={styles.aiAppliedBanner}>
                  <div className={styles.aiAppliedBannerCopy}>
                    <strong>Applied.</strong> The score above is from the most
                    recent review. Run a re-check to score your improved CV.
                  </div>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    onClick={handleRecheck}
                    disabled={aiLoading || recheckInFlight}
                    id="ai-recheck-btn"
                  >
                    {recheckInFlight ? (
                      <>
                        <svg
                          className={styles.btnSpinner}
                          viewBox="0 0 24 24"
                          width="14"
                          height="14"
                          aria-hidden
                        >
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            opacity="0.25"
                          />
                          <path
                            d="M22 12a10 10 0 00-10-10"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                          />
                        </svg>
                        Re-checking...
                      </>
                    ) : (
                      <>
                        <svg
                          viewBox="0 0 20 20"
                          width="14"
                          height="14"
                          aria-hidden
                        >
                          <path
                            d="M10 2a8 8 0 100 16 8 8 0 000-16zm.7 12.3l-4-4 1.4-1.4L10 11.2l4.9-4.9 1.4 1.4-6.3 6.3z"
                            fill="currentColor"
                          />
                        </svg>
                        Re-check improved CV
                      </>
                    )}
                  </button>
                </div>
              ) : null}

              {aiError ? (
                <div className={styles.aiError} role="alert">
                  {aiError}
                </div>
              ) : null}

              <div className={styles.aiHeroRetry}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => {
                    setAiReview(null);
                    setAppliedSections(new Set());
                    setOpenDiff(null);
                    setAutoFilledNote(null);
                    setRecheckJustCompleted(false);
                  }}
                >
                  Review a different CV
                </button>
              </div>
            </div>
          )}
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
                  <p className={styles.paperEmptySub}>
                    Start filling the form on the left, or load an example to
                    see how the finished CV looks.
                  </p>
                  <ul className={styles.paperTips}>
                    <li>
                      <strong>Paste</strong> your old CV above to get an instant
                      ATS score and section suggestions.
                    </li>
                    <li>
                      <strong>Edit</strong> any field on the left and the
                      preview updates live.
                    </li>
                    <li>
                      <strong>Download</strong> a clean, ATS-friendly PDF when
                      you are happy with the result.
                    </li>
                  </ul>
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
                <h2 className={styles.sectionTitle}>Quick checks</h2>

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

/* ─── SuggestionCard (AI review diff preview) ─── */
interface SuggestionCardProps {
  keyId: SuggestionKey;
  title: string;
  current: string;
  suggested: string;
  rationale: string;
  applied: boolean;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onApply: () => void;
}

function SuggestionCard(props: SuggestionCardProps) {
  const {
    title,
    current,
    suggested,
    rationale,
    applied,
    isOpen,
    onOpen,
    onClose,
    onApply,
  } = props;

  return (
    <div
      className={`${styles.aiCard} ${applied ? styles.aiCardApplied : ""}`}
    >
      <div className={styles.aiCardHead}>
        <div>
          <div className={styles.aiCardTitle}>{title}</div>
          {!isOpen && !applied ? (
            <p className={styles.aiCardRationale}>{rationale}</p>
          ) : null}
          {applied && !isOpen ? (
            <p className={styles.aiCardAppliedNote}>
              Applied. You can edit the form fields to fine-tune the change.
            </p>
          ) : null}
        </div>
        <div className={styles.aiCardActions}>
          {!applied ? (
            <button
              type="button"
              className={styles.aiReviewBtn}
              onClick={isOpen ? onClose : onOpen}
              aria-expanded={isOpen}
            >
              {isOpen ? "Hide diff" : "Review change"}
            </button>
          ) : null}
        </div>
      </div>
      {isOpen ? (
        <div className={styles.aiDiff}>
          <div className={styles.aiDiffGrid}>
            <div className={styles.aiDiffCol}>
              <h5 className={styles.aiDiffLabel}>Current</h5>
              <pre className={styles.aiDiffText}>{current || "(empty)"}</pre>
            </div>
            <div className={styles.aiDiffCol}>
              <h5 className={styles.aiDiffLabel}>Suggested</h5>
              <pre className={styles.aiDiffText}>{suggested}</pre>
            </div>
          </div>
          <p className={styles.aiCardRationale}>{rationale}</p>
          <div className={styles.aiDiffFooter}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={onApply}
            >
              Apply this change
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
