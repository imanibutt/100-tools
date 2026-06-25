import type { Metadata } from "next";
import { getMetadataBase } from "@/lib/site";
import Script from "next/script";
import { VantaBackground } from "@/components/vanta-background";
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
        <Script
          id="google-tag-manager"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-W8ZWHD9N');
            `,
          }}
        />
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-W8ZWHD9N"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <VantaBackground />
        <div className="global-vanta-overlay" aria-hidden />
        <div className="page-shell">
          {children}
        </div>
      </body>
    </html>
  );
}
