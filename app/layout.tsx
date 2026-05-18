import type { Metadata } from "next";
import { getMetadataBase } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "100 Tools",
    template: "%s | 100 Tools"
  },
  description:
    "100 Tools builds focused tools for creators, operators, and developers. Explore BeDownloader, Brutal Reminder, and the roadmap being built in public.",
  metadataBase: getMetadataBase(),
  applicationName: "100 Tools",
  keywords: [
    "100 Tools",
    "AI tools",
    "creator tools",
    "Brutal Reminder",
    "BeDownloader",
    "Behance downloader",
    "build in public",
  ],
  openGraph: {
    title: "100 Tools",
    description:
      "100 Tools builds focused tools for creators, operators, and developers. Explore BeDownloader, Brutal Reminder, and the roadmap being built in public.",
    url: "/",
    type: "website",
    siteName: "100 Tools",
    images: [
      {
        url: "/hero.png",
        width: 1200,
        height: 630,
        alt: "100 Tools hero image",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "100 Tools",
    description:
      "Focused tools for creators, operators, and developers. Built in public by 100 Tools.",
    images: ["/hero.png"],
  },
  alternates: {
    canonical: "/"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Space+Grotesk:wght@600;700&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning>
        <div className="bg-mesh" />
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}
