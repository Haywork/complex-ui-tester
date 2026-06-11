import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CuitFunnelInstrument } from "@/cuit/CuitFunnelInstrument";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = "https://complex-ui-tester.vercel.app";
const SITE_NAME = "CUIT";
const SITE_DESCRIPTION =
  "The best UI feedback loop for Claude Code and Codex. Capture console logs + interactions, auto-generate Playwright specs, and close the loop with /cuit-loop — all inside an agentic coding conversation.";

/** JSON-LD structured data (SoftwareApplication + Organization). */
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#software`,
      name: "CUIT",
      alternateName: "complex-ui-tester",
      url: SITE_URL,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Any",
      description:
        "The best UI feedback loop for Claude Code and Codex. Instrument your app once, record a session, run /cuit-loop, and get a green Playwright regression gate — without leaving your agentic coding conversation.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        description: "Free tier — OSS harness is MIT-licensed.",
      },
      author: {
        "@id": `${SITE_URL}/#organization`,
      },
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "SpeechLab, Inc.",
      url: "https://speechlab.ai",
      contactPoint: {
        "@type": "ContactPoint",
        email: "ryan@speechlab.ai",
      },
    },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
  },
  title: {
    default: `${SITE_NAME} — The best UI feedback loop for Claude Code & Codex`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "CUIT",
    "complex-ui-tester",
    "Claude Code",
    "Codex",
    "OpenAI Codex",
    "agentic coding",
    "UI feedback loop",
    "Playwright",
    "UI testing",
    "session replay",
    "console log capture",
    "cuit-loop",
    "Jam",
    "LogRocket",
    "Sentry Replay",
    "regression testing",
    "MCP",
    "OSS",
  ],
  authors: [{ name: "SpeechLab, Inc.", url: "mailto:ryan@speechlab.ai" }],
  creator: "SpeechLab, Inc.",
  openGraph: {
    title: `${SITE_NAME} — The best UI feedback loop for Claude Code & Codex`,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
    url: SITE_URL,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — The best UI feedback loop for Claude Code & Codex`,
    description: SITE_DESCRIPTION,
    site: "@speechlab_ai",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0b" },
    { media: "(prefers-color-scheme: light)", color: "#fafaf7" },
  ],
  width: "device-width",
  initialScale: 1,
};

// Dark is the canonical brand default. Only honor an explicit user opt-in to
// light; never auto-light from system preference (the design is built for dark
// and renders washed-out on light).
const themeInitScript = `try{var s=localStorage.getItem('cuit-theme');if(s==='light')document.documentElement.classList.add('light');}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        {/* JSON-LD structured data: SoftwareApplication + Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
        {/* CUIT funnel instrumentation — no-op in production unless ?cuitRecorder=1 */}
        <CuitFunnelInstrument />
      </body>
    </html>
  );
}
