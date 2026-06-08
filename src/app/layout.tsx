import type { Metadata, Viewport } from "next";
import { Newsreader, Schibsted_Grotesk, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import "./globals.css";

// Editorial type system. CSS var names are kept legacy (--font-outfit = heading
// slot, --font-inter = body slot, --font-geist-mono = mono) so the whole app
// inherits the new fonts without per-file churn.
const newsreader = Newsreader({
  variable: "--font-outfit",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700", "800"],
});

const schibsted = Schibsted_Grotesk({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const viewport: Viewport = {
  themeColor: "#f7f4ee",
  width: "device-width",
  initialScale: 1,
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const APP_DESCRIPTION =
  "Créez des CV professionnels, ATS-friendly et personnalisables, avec assistance IA et export PDF / DOCX.";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "CVisual — Créateur de CV professionnels",
    template: "%s | CVisual",
  },
  description: APP_DESCRIPTION,
  applicationName: "CVisual",
  keywords: ["CV", "curriculum vitae", "resume", "lettre de motivation", "ATS"],
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CVisual",
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/icons/icon-192.svg",
  },
  // Indexable by default; private/token routes opt out via robots.ts + per-page
  // metadata (see render/share/public pages).
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "CVisual",
    title: "CVisual — Créateur de CV professionnels",
    description: APP_DESCRIPTION,
    url: APP_URL,
    locale: "fr_FR",
  },
  twitter: {
    card: "summary_large_image",
    title: "CVisual — Créateur de CV professionnels",
    description: APP_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${newsreader.variable} ${schibsted.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          {children}
          <Toaster />
          <InstallPrompt />
        </Providers>
      </body>
    </html>
  );
}
