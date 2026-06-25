"use client";

import Link from "next/link";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { BrandMark } from "./brand-mark";
import { ProductIcon, type ProductAccent } from "./product-icons";

type ToolAccent = ProductAccent;

type Tool = {
  href: string;
  name: string;
  description: string;
  accent: ToolAccent;
};

const TOOLS: Tool[] = [
  {
    href: "/brutal-reminder",
    name: "Brutal Reminder",
    description: "Daily accountability emails with Done / Not yet controls.",
    accent: "reminder",
  },
  {
    href: "/bedownloader",
    name: "BeDownloader",
    description: "Extract public Behance assets in original quality.",
    accent: "download",
  },
  {
    href: "/ats-cv-maker",
    name: "ATS CV Maker",
    description: "Free ATS-friendly CV builder with keyword match check.",
    accent: "cv",
  },
  {
    href: "/humanpass",
    name: "HumanPass",
    description: "Turn rough drafts into clear, natural prose.",
    accent: "humanpass",
  },
];

const PRIMARY_LINKS: ReadonlyArray<{ href: string; label: string }> = [
  { href: "/", label: "Home" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

type Props = {
  activeHref?: string;
  /**
   * Layout variant:
   *   - "default"   full-width row, used on every page
   *   - "centered"  floating glass pill, centered at the top — used on
   *                 the homepage for a premium cinematic feel
   */
  variant?: "default" | "centered";
};

function ToolIcon({ accent }: { accent: ToolAccent }) {
  return <ProductIcon accent={accent} />;
}

export function TopNav({ activeHref, variant = "default" }: Props) {
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState(-1);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  // Close dropdown on outside click.
  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape and return focus to trigger.
  useEffect(() => {
    if (!open && !mobileOpen) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (open) {
        setOpen(false);
        triggerRef.current?.focus();
      }
      if (mobileOpen) {
        setMobileOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, mobileOpen]);

  // Body scroll lock when mobile drawer is open.
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  const onTriggerKey = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(true);
      setFocusIndex(0);
    }
  };

  const onMenuKey = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setFocusIndex((index) => (index + 1) % TOOLS.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setFocusIndex((index) => (index - 1 + TOOLS.length) % TOOLS.length);
    } else if (event.key === "Home") {
      event.preventDefault();
      setFocusIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setFocusIndex(TOOLS.length - 1);
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <header
      className={
        "topnav" + (variant === "centered" ? " topnav--centered" : "")
      }
    >
      <div
        className={
          variant === "centered" ? "topnav-pill" : "topnav-inner"
        }
      >
        <Link href="/" className="topnav-brand" aria-label="100 Tools home">
          <BrandMark size="sm" className="topnav-brandmark" />
          <span className="topnav-brandname">100 Tools</span>
        </Link>

        <nav className="topnav-nav" aria-label="Primary">
          <ul className="topnav-list">
            {PRIMARY_LINKS.map((link) => {
              const isActive = link.href === activeHref;
              return (
                <li key={link.href} className="topnav-listitem">
                  <Link
                    href={link.href}
                    className={
                      "topnav-link" + (isActive ? " is-active" : "")
                    }
                    aria-current={isActive ? "page" : undefined}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
            <li className="topnav-listitem topnav-tools">
              <button
                ref={triggerRef}
                type="button"
                className="topnav-trigger"
                aria-haspopup="menu"
                aria-expanded={open}
                aria-controls={menuId}
                onClick={() => setOpen((value) => !value)}
                onKeyDown={onTriggerKey}
              >
                <span>Tools</span>
                <svg
                  className={
                    "topnav-chevron" + (open ? " is-open" : "")
                  }
                  viewBox="0 0 12 12"
                  width="12"
                  height="12"
                  aria-hidden
                >
                  <path
                    d="M2 4l4 4 4-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <div
                ref={menuRef}
                id={menuId}
                role="menu"
                aria-label="Tools"
                className="topnav-menu"
                onKeyDown={onMenuKey}
                hidden={!open}
              >
                <ul className="topnav-menu-list">
                  {TOOLS.map((tool, index) => {
                    const isActive = tool.href === activeHref;
                    return (
                      <li key={tool.href} role="none">
                        <Link
                          href={tool.href}
                          role="menuitem"
                          className={
                            "topnav-item topnav-item--" +
                            tool.accent +
                            (focusIndex === index ? " is-focused" : "") +
                            (isActive ? " is-active" : "")
                          }
                          tabIndex={open ? 0 : -1}
                          onMouseEnter={() => setFocusIndex(index)}
                          onFocus={() => setFocusIndex(index)}
                          onClick={() => setOpen(false)}
                          aria-current={isActive ? "page" : undefined}
                        >
                          <span
                            className={
                              "topnav-item-icon topnav-item-icon--" +
                              tool.accent
                            }
                            aria-hidden
                          >
                            <ToolIcon accent={tool.accent} />
                          </span>
                          <span className="topnav-item-text">
                            <strong>{tool.name}</strong>
                            <small>{tool.description}</small>
                          </span>
                          <span className="topnav-item-arrow" aria-hidden>
                            →
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </li>
          </ul>
        </nav>

        <button
          type="button"
          className="topnav-burger"
          aria-label="Open menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(true)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {mobileOpen ? (
        <>
          <div
            className="topnav-drawer-backdrop"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="topnav-drawer" aria-label="Mobile menu">
            <div className="topnav-drawer-head">
              <Link
                href="/"
                className="topnav-brand"
                onClick={() => setMobileOpen(false)}
              >
                <BrandMark size="sm" className="topnav-brandmark" />
                <span className="topnav-brandname">100 Tools</span>
              </Link>
              <button
                type="button"
                className="topnav-drawer-close"
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
                  <path
                    d="M6 6l12 12M6 18L18 6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            <nav aria-label="Mobile primary">
              <ul className="topnav-drawer-list">
                {PRIMARY_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="topnav-drawer-link"
                      onClick={() => setMobileOpen(false)}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
                <li className="topnav-drawer-accordion-wrap">
                  <button
                    type="button"
                    className="topnav-drawer-link topnav-drawer-accordion"
                    aria-expanded={mobileToolsOpen}
                    onClick={() => setMobileToolsOpen((value) => !value)}
                  >
                    <span>Tools</span>
                    <svg
                      className={
                        "topnav-chevron" +
                        (mobileToolsOpen ? " is-open" : "")
                      }
                      viewBox="0 0 12 12"
                      width="12"
                      height="12"
                      aria-hidden
                    >
                      <path
                        d="M2 4l4 4 4-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <div
                    className="topnav-drawer-panel"
                    hidden={!mobileToolsOpen}
                  >
                    <ul className="topnav-drawer-tools">
                      {TOOLS.map((tool) => {
                        const isActive = tool.href === activeHref;
                        return (
                          <li key={tool.href}>
                            <Link
                              href={tool.href}
                              className={
                                "topnav-item topnav-item--" +
                                tool.accent +
                                " topnav-drawer-item" +
                                (isActive ? " is-active" : "")
                              }
                              onClick={() => setMobileOpen(false)}
                              aria-current={isActive ? "page" : undefined}
                            >
                            <span
                              className={
                                "topnav-item-icon topnav-item-icon--" +
                                tool.accent
                              }
                              aria-hidden
                            >
                              <ToolIcon accent={tool.accent} />
                            </span>
                            <span className="topnav-item-text">
                              <strong>{tool.name}</strong>
                              <small>{tool.description}</small>
                            </span>
                          </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </li>
              </ul>
            </nav>
          </aside>
        </>
      ) : null}
    </header>
  );
}
