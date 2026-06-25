import type { Metadata } from "next";
import AtsCvMakerClient from "./AtsCvMakerClient";

export const metadata: Metadata = {
  title: "Free ATS CV Maker with AI Review",
  description:
    "Build a clean ATS-friendly CV for free. Get an AI ATS review with section-by-section suggestions you can preview and apply to your form. Download as PDF.",
  alternates: {
    canonical: "/ats-cv-maker",
  },
  openGraph: {
    title: "Free ATS CV Maker with AI Review | 100 Tools",
    description:
      "Build a clean ATS-friendly CV for free. Get an AI ATS review with section-by-section suggestions you can preview and apply to your form. Download as PDF.",
    url: "/ats-cv-maker",
    type: "website",
  },
};

export default function AtsCvMakerPage() {
  return <AtsCvMakerClient />;
}
