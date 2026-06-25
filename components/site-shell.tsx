import type { ReactNode } from "react";
import { TopNav } from "./top-nav";
import { SiteFooter } from "./site-footer";

export function SiteShell({
  children,
  compact = false,
  activeHref,
}: {
  children: ReactNode;
  compact?: boolean;
  activeHref?: string;
}) {
  return (
    <main className={compact ? "site-shell site-shell-compact" : "site-shell"}>
      <div className="site-shell-inner">
        <TopNav activeHref={activeHref} variant="centered" />
        {children}
        <SiteFooter />
      </div>
    </main>
  );
}
