import type { Metadata } from "next";
import { DM_Sans, Cormorant_Garamond } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Providers from "./providers";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const BASE_URL = "https://www.askaisl.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "askaisl — AI Consumer Research Interviews",
    template: "%s | askaisl",
  },
  description:
    "Conduct AI-powered consumer research interviews in English, Sinhala and Tamil. Instant insights for FMCG brands across Sri Lanka — available 24/7, no recruiter needed.",
  keywords: [
    "AI consumer research Sri Lanka",
    "AI market research interviews",
    "FMCG research Sri Lanka",
    "Sinhala Tamil English AI interview",
    "consumer insights platform",
    "qualitative research automation",
    "AI interviewer",
    "askaisl",
  ],
  authors: [{ name: "askaisl", url: BASE_URL }],
  creator: "askaisl",
  publisher: "askaisl",
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  alternates: { canonical: BASE_URL },
  openGraph: {
    type: "website",
    url: BASE_URL,
    siteName: "askaisl",
    title: "askaisl — AI Consumer Research Interviews",
    description:
      "AI-powered consumer research interviews in English, Sinhala and Tamil for FMCG brands in Sri Lanka.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "askaisl — AI Consumer Research" }],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "askaisl — AI Consumer Research Interviews",
    description:
      "AI-powered consumer research interviews in English, Sinhala and Tamil for FMCG brands in Sri Lanka.",
    images: ["/og-image.png"],
    creator: "@askaisl",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/logo.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`h-full ${dmSans.variable} ${cormorant.variable}`}>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
        {GA_ID && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
            <Script id="ga-init" strategy="afterInteractive">{`
              window.dataLayer=window.dataLayer||[];
              function gtag(){dataLayer.push(arguments);}
              gtag('js',new Date());
              gtag('config','${GA_ID}',{page_path:window.location.pathname});
            `}</Script>
          </>
        )}
      </body>
    </html>
  );
}
