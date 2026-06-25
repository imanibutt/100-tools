"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { TopNav } from "@/components/top-nav";
import { ProductMark } from "@/components/product-icons";
import { SiteFooter } from "@/components/site-footer";
import styles from "./page.module.css";

type Mode = "standard" | "aggressive" | "academic";

const MODE_META: Record<
  Mode,
  { label: string; icon: string; description: string }
> = {
  standard: {
    label: "Standard",
    icon: "✦",
    description: "Clear, natural polish that preserves your voice and formality.",
  },
  aggressive: {
    label: "Aggressive",
    icon: "◆",
    description: "Heavier rewrite, conversational and direct. Facts stay intact.",
  },
  academic: {
    label: "Academic",
    icon: "◇",
    description: "Formal, concise, citation-safe prose.",
  },
};

const SAMPLE_TEXT =
  "The implementation of artificial intelligence in modern business operations has fundamentally transformed the way companies approach their strategic objectives. Furthermore, it is important to note that organizations which fail to adapt to these technological changes risk becoming obsolete in an increasingly competitive marketplace. In conclusion, companies must invest in AI to remain viable.";

async function readError(res: Response, fallback: string): Promise<string> {
  const body = await res.text();
  if (!body) return `${fallback} (HTTP ${res.status})`;
  return body;
}

export default function HumanPassClient() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [mode, setMode] = useState<Mode>("standard");
  const [wordCount, setWordCount] = useState({ input: 0, output: 0 });
  const [error, setError] = useState<string | null>(null);
  const [detectError, setDetectError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const outputRef = useRef<HTMLTextAreaElement>(null);

  const countWords = (text: string) =>
    text.trim().split(/\s+/).filter(Boolean).length;

  const handleHumanize = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setOutput("");
    setScore(null);
    setError(null);

    try {
      const res = await fetch("/api/humanize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input, mode }),
      });

      if (!res.ok) {
        const message = await readError(res, "Rewrite request failed");
        throw new Error(message);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let result = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          result += chunk;
          setOutput(result);
          setWordCount((prev) => ({ ...prev, output: countWords(result) }));
        }
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Could not humanize text. Please try again.";
      setError(message);
      setOutput("");
      setWordCount((prev) => ({ ...prev, output: 0 }));
    } finally {
      setLoading(false);
    }
  };

  const handleDetect = async () => {
    const textToCheck = output || input;
    if (!textToCheck.trim()) return;
    setDetecting(true);
    setDetectError(null);
    setScore(null);

    try {
      const res = await fetch("/api/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToCheck }),
      });
      if (!res.ok) {
        const message = await readError(res, "Style check failed");
        throw new Error(message);
      }
      const data = await res.json();
      setScore(typeof data.score === "number" ? data.score : null);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Detection check failed. Please try again.";
      setDetectError(message);
      setScore(null);
    } finally {
      setDetecting(false);
    }
  };

  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Couldn't copy to clipboard. Your browser may have blocked it.");
    }
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
    setScore(null);
    setError(null);
    setDetectError(null);
    setWordCount({ input: 0, output: 0 });
  };

  const handleSample = () => {
    setInput(SAMPLE_TEXT);
    setWordCount({ input: countWords(SAMPLE_TEXT), output: 0 });
    setError(null);
    setDetectError(null);
    setScore(null);
  };

  const getScoreColor = (s: number) => {
    if (s < 15) return styles.scoreLow;
    if (s < 40) return styles.scoreMid;
    return styles.scoreHigh;
  };

  const getScoreLabel = (s: number) => {
    if (s < 15) return "Low formulaic pattern";
    if (s < 40) return "Moderate formulaic pattern";
    return "High formulaic pattern";
  };

  return (
    <div className={`${styles.page} humanpass-page`}>
      <TopNav activeHref="/humanpass" variant="centered" />
      <div className={styles.shell}>
        <section className="tool-hero">
          <div className="tool-hero-lockup">
            <ProductMark accent="humanpass" size="md" />
            <span className="tool-status-pill">Live</span>
          </div>
          <h1 className="tool-hero-title">
            Turn rough drafts into{" "}
            <span className={styles.gradient}>natural prose</span>
          </h1>
          <p className="tool-hero-lede">
            Rewrite rough drafts into clear, natural prose. Pick a mode, click
            polish, and the text gets easier to read while your argument stays
            exactly the same.
          </p>
        </section>

        <div className={styles.modeBlock}>
          <div role="radiogroup" aria-label="Rewrite mode" className={styles.modeRow}>
            {(["standard", "aggressive", "academic"] as const).map((m) => {
              const cfg = MODE_META[m];
              const active = mode === m;
              return (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setMode(m)}
                  className={`${styles.modeButton} ${active ? styles.modeButtonActive : ""}`}
                >
                  <span className={styles.modeIcon}>{cfg.icon}</span>
                  {cfg.label}
                </button>
              );
            })}
          </div>
          <p className={styles.modeDescription} aria-live="polite">
            {MODE_META[mode].description}
          </p>
        </div>

        <div className={styles.editors}>
          <div
            className={`${styles.editorCard} ${inputFocused ? styles.editorCardFocus : ""}`}
          >
            <div className={styles.editorHead}>
              <span className={styles.editorTitle}>
                <span className={styles.editorDot} aria-hidden />
                Your draft
              </span>
              <span className={styles.editorMeta}>
                <span>
                  {wordCount.input.toLocaleString("en-US")} word
                  {wordCount.input === 1 ? "" : "s"}
                </span>
                {input ? (
                  <button
                    type="button"
                    onClick={handleClear}
                    className={styles.metaLink}
                    aria-label="Clear input"
                  >
                    Clear
                  </button>
                ) : null}
              </span>
            </div>
            <textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setWordCount((prev) => ({
                  ...prev,
                  input: countWords(e.target.value),
                }));
              }}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder="Paste your rough draft here..."
              className={styles.editorTextarea}
              spellCheck
            />
            <div className={styles.editorFooter}>
              {input ? (
                <span>
                  Tip: switch to Aggressive for a heavier rewrite, or Academic
                  for a formal pass.
                </span>
              ) : (
                <>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={handleSample}
                    className={styles.sampleButton}
                  >
                    Try a sample draft
                  </button>
                </>
              )}
            </div>
          </div>

          <div
            className={`${styles.editorCard} ${loading ? styles.editorCardFocus : ""}`}
          >
            <div className={styles.editorHead}>
              <span className={styles.editorTitle}>
                <span
                  className={`${styles.editorDot} ${loading ? styles.editorDotBusy : ""}`}
                  aria-hidden
                />
                Polished
                {loading ? (
                  <span style={{ color: "#c4b5fd", fontWeight: 500, fontSize: 12 }}>
                    rewriting…
                  </span>
                ) : null}
              </span>
              <span className={styles.editorMeta}>
                <span>
                  {wordCount.output.toLocaleString("en-US")} word
                  {wordCount.output === 1 ? "" : "s"}
                </span>
                {output && !loading ? (
                  <button
                    type="button"
                    onClick={handleCopy}
                    className={styles.copyButton}
                    aria-label="Copy output"
                  >
                    {copied ? "Copied" : "Copy"}
                  </button>
                ) : null}
              </span>
            </div>
            <textarea
              ref={outputRef}
              value={output}
              onChange={(e) => setOutput(e.target.value)}
              readOnly={loading}
              placeholder={
                loading
                  ? "Polishing your draft…"
                  : "Your polished draft will appear here. Nothing is sent until you click Polish Text."
              }
              className={styles.editorTextarea}
            />
          </div>
        </div>

        {error ? (
          <div role="alert" className={styles.errorBanner}>
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={styles.errorIcon}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m0 3.04h.008v.008H12v-.008zM10.34 4.34a1.875 1.875 0 013.32 0l7.81 13.49A1.875 1.875 0 0119.78 21H4.22a1.875 1.875 0 01-1.69-3.17l7.81-13.49z"
              />
            </svg>
            <div style={{ flex: 1, wordBreak: "break-word" }}>{error}</div>
            <button
              type="button"
              onClick={() => setError(null)}
              className={styles.errorClose}
              aria-label="Dismiss error"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : null}

        <div className={styles.actions}>
          <div className={styles.actionGroup}>
            <button
              type="button"
              onClick={handleHumanize}
              disabled={loading || !input.trim()}
              className={styles.primaryButton}
            >
              {loading ? (
                <>
                  <span className={styles.spinner} aria-hidden />
                  Polishing…
                </>
              ) : (
                <>
                  Polish Text
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDetect}
              disabled={detecting || (!input.trim() && !output.trim())}
              className={styles.secondaryButton}
            >
              {detecting ? (
                <>
                  <span className={styles.spinner} aria-hidden />
                  Checking…
                </>
              ) : (
                "Check Formulaic Score"
              )}
            </button>
          </div>

          {score !== null ? (
            <div
              role="region"
              aria-label="Formulaic Style Score"
              className={styles.scorePanel}
            >
              <div className={styles.scoreRow}>
                <span className={styles.scoreLabel}>Formulaic Style Score</span>
                <span
                  className={`${styles.scoreValue} ${getScoreColor(score)}`}
                  aria-label={`Score ${score} out of 100, ${getScoreLabel(score)}`}
                >
                  {score}
                  <span className={styles.scoreMax}>/100</span>
                </span>
                <span className={`${styles.scoreTag} ${getScoreColor(score)}`}>
                  {getScoreLabel(score)}
                </span>
              </div>
              <p className={styles.scoreDescription}>
                Lower scores suggest more natural, varied prose. Higher scores
                suggest more formulaic patterns. This is a transparent
                heuristic, not an AI detector.
              </p>
              <details className={styles.scoreDetails}>
                <summary className={styles.scoreDetailsSummary}>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                  What does this measure?
                </summary>
                <div className={styles.scoreDetailsBody}>
                  The score blends five signals from your text: sentence-length
                  variety, vocabulary richness, frequency of formulaic
                  transitions, contraction usage, and sentence-starter variety.
                  It returns a number from 0 to 100 where lower is more
                  natural-sounding. It does not identify AI authorship and
                  should not be used as proof of it.
                </div>
              </details>
            </div>
          ) : null}
        </div>

        {detectError ? (
          <div role="status" className={styles.detectError}>
            {detectError}
          </div>
        ) : null}

        <div className={styles.features}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon} aria-hidden>
              🛡️
            </div>
            <div className={styles.featureTitle}>Meaning stays intact</div>
            <div className={styles.featureDescription}>
              The prose gets cleaner. Your facts, claims, and arguments come
              through unchanged.
            </div>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon} aria-hidden>
              🎯
            </div>
            <div className={styles.featureTitle}>Three modes, one goal</div>
            <div className={styles.featureDescription}>
              Standard for a light polish, Aggressive for a heavier rewrite,
              Academic for a formal pass.
            </div>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon} aria-hidden>
              ⚡
            </div>
            <div className={styles.featureTitle}>One request, streamed back</div>
            <div className={styles.featureDescription}>
              Your draft goes to the model once and the polished text streams
              back as it is generated.
            </div>
          </div>
        </div>

        <footer className={styles.footer}>
          HumanPass is a writing style assistant. The Formulaic Style Score is
          a transparent heuristic, not an AI detector.
        </footer>
      </div>
      <SiteFooter />
    </div>
  );
}
