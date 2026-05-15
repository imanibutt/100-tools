import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "100 Tools",
    template: "%s | 100 Tools"
  },
  description:
    "Building 100 AI tools in public, one tool at a time.",
  metadataBase: new URL("https://100tools.pk"),
  openGraph: {
    title: "100 Tools",
    description:
      "Building 100 AI tools in public, one tool at a time.",
    url: "https://100tools.pk",
    type: "website"
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
