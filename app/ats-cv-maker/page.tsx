import type { Metadata } from "next";
import AtsCvMakerClient from "./AtsCvMakerClient";

export const metadata: Metadata = {
  title: "Free ATS CV Maker",
  description:
    "Build a clean ATS-friendly CV or resume for free. Create a simple recruiter-readable CV, check keyword match, and download your CV as PDF.",
  alternates: {
    canonical: "/ats-cv-maker",
  },
  openGraph: {
    title: "Free ATS CV Maker | 100 Tools",
    description:
      "Build a clean ATS-friendly CV or resume for free. Create a simple recruiter-readable CV, check keyword match, and download your CV as PDF.",
    url: "/ats-cv-maker",
    type: "website",
  },
};

export default function AtsCvMakerPage() {
  return <AtsCvMakerClient />;
}
