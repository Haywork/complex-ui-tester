import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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

const SITE_NAME = "CUIT";
const SITE_DESCRIPTION =
  "Turn recorded Jam / LogRocket / Sentry Replay sessions into deterministic Playwright specs in under 8 minutes. The OSS harness is MIT. The data infrastructure that sharpens it is the product.";

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} — complex-ui-tester · Stop fixing the same UI bug twice`,
    template: `%s · ${SITE_NAME} (complex-ui-tester)`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "CUIT",
    "complex-ui-tester",
    "Playwright",
    "UI testing",
    "session replay",
    "Jam",
    "LogRocket",
    "Sentry Replay",
    "regression testing",
    "Branch B",
    "harness",
    "complex UI",
    "OSS",
  ],
  authors: [{ name: "SpeechLab, Inc.", url: "mailto:ryan@speechlab.ai" }],
  creator: "SpeechLab, Inc.",
  openGraph: {
    title: `${SITE_NAME} — Stop fixing the same UI bug twice`,
    description: SITE_DESCRIPTION,
    siteName: "CUIT (complex-ui-tester)",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Stop fixing the same UI bug twice`,
    description: SITE_DESCRIPTION,
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

const themeInitScript = `try{var s=localStorage.getItem('cuit-theme');if(s==='light')document.documentElement.classList.add('light');else if(s!=='dark'&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches)document.documentElement.classList.add('light');}catch(e){}`;

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
        {children}
      </body>
    </html>
  );
}
