import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import QueryProvider from "@/components/providers/QueryProvider";
import { AmbientBlobs } from "@/components/ui/AmbientBlobs";
import { NoiseOverlay } from "@/components/ui/NoiseOverlay";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "VIRA — Intelligent Personal Life-OS",
  description: "Conversational quick-capture, zero-guilt smart rollover, money runway, and daily activity tracking for personal and professional growth.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#070B14",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..700&family=Geist:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#070B14] text-slate-100 antialiased selection:bg-desk-amber/30 selection:text-white">
        <QueryProvider>
          {/* Ambient desaturated mesh blobs & paper grain noise */}
          <AmbientBlobs />
          <NoiseOverlay />

          {/* Conditional App Shell (Dashboard vs Authentication layout) */}
          <AppShell>{children}</AppShell>
        </QueryProvider>
      </body>
    </html>
  );
}
