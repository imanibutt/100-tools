import type { Metadata } from "next";
import InvoiceMakerClient from "./InvoiceMakerClient";

export const metadata: Metadata = {
  title: "AI Invoice Maker — Free Freelancer Invoice Generator | 100 Tools",
  description:
    "Create professional client invoices from plain English. Generate line items, totals, payment terms, reminders, and print-ready invoices for free.",
  alternates: {
    canonical: "/invoice-maker",
  },
  openGraph: {
    title: "AI Invoice Maker | 100 Tools",
    description:
      "Turn messy project details into a clean, client-ready invoice with PDF export and payment copy.",
    url: "/invoice-maker",
    type: "website",
  },
};

export default function InvoiceMakerPage() {
  return <InvoiceMakerClient />;
}
