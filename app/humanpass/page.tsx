import type { Metadata } from "next";
import HumanPassClient from "./HumanPassClient";

export const metadata: Metadata = {
  title: "HumanPass — AI Writing Style Assistant",
  description:
    "Turn rough drafts into clear, natural prose. Pick a mode, click polish, and HumanPass rewrites your text while keeping the meaning, facts, and structure intact. Includes a Formulaic Style Score check.",
  alternates: {
    canonical: "/humanpass",
  },
  openGraph: {
    title: "HumanPass | 100 Tools",
    description:
      "Turn rough drafts into clear, natural prose while keeping the meaning intact. Three rewrite modes and a Formulaic Style Score check.",
    url: "/humanpass",
    type: "website",
  },
};

export default function HumanPassPage() {
  return <HumanPassClient />;
}
