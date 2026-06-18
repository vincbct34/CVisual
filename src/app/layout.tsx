import type { Metadata, Viewport } from "next";
import {
  Newsreader,
  Schibsted_Grotesk,
  JetBrains_Mono,
  Inter,
  Roboto,
  Open_Sans,
  Lato,
  Montserrat,
  Merriweather,
  Playfair_Display,
} from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { SiteFooter } from "@/components/site-footer";
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

// Document fonts offered in the CV / cover-letter style panels. next/font
// self-hosts each face under a HASHED family name, exposed only via these CSS
// variables (set on <html> below). fontStack() in template-utils leads each
// stack with the matching var(--cv-*) so the editor preview, the /render
// Puppeteer target (PDF/HTML export) and the share/public pages all resolve
// them self-hosted (no flaky external Google Fonts fetch in headless Chromium).
// `preload: false`: faces are declared but only fetched when a document
// actually uses one. Fallback stacks live in FONT_STACKS / FONT_CSS_VARS
// (components/templates/template-utils.ts).
const docInter = Inter({
  variable: "--cv-inter",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
  preload: false,
});
const docRoboto = Roboto({
  variable: "--cv-roboto",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "700"],
  preload: false,
});
const docOpenSans = Open_Sans({
  variable: "--cv-open-sans",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
  preload: false,
});
const docLato = Lato({
  variable: "--cv-lato",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "700"],
  preload: false,
});
const docMontserrat = Montserrat({
  variable: "--cv-montserrat",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
  preload: false,
});
const docMerriweather = Merriweather({
  variable: "--cv-merriweather",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "700"],
  preload: false,
});
const docPlayfair = Playfair_Display({
  variable: "--cv-playfair",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
  preload: false,
});
const documentFontVariables = [
  docInter,
  docRoboto,
  docOpenSans,
  docLato,
  docMontserrat,
  docMerriweather,
  docPlayfair,
]
  .map((f) => f.variable)
  .join(" ");

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
  // og:image / twitter:image come from the opengraph-image.tsx + twitter-image.tsx
  // convention files (no manual `images` needed).
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
      className={`${newsreader.variable} ${schibsted.variable} ${jetbrainsMono.variable} ${documentFontVariables} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          // Structured data: surfaces CVisual as a (free) web application + its
          // publisher to search engines for rich-result eligibility.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                name: "CVisual",
                description: APP_DESCRIPTION,
                url: APP_URL,
                applicationCategory: "BusinessApplication",
                operatingSystem: "Web",
                inLanguage: "fr",
                offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
              },
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "CVisual",
                url: APP_URL,
                logo: `${APP_URL}/icons/icon-512.svg`,
              },
            ]),
          }}
        />
        <Providers>
          {children}
          <SiteFooter />
          <Toaster />
          <InstallPrompt />
        </Providers>
      </body>
    </html>
  );
}
