import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "100 Tools",
    template: "%s | 100 Tools"
  },
  description:
    "Building 100 AI tools in public, one tool at a time.",
  metadataBase: new URL("https://bedownloader.vercel.app"),
  openGraph: {
    title: "100 Tools",
    description:
      "Building 100 AI tools in public, one tool at a time.",
    url: "https://bedownloader.vercel.app",
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
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
