import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { HOME_DESCRIPTION, HOME_TITLE, SITE_KEYWORDS } from "@/app/lib/site-metadata";
import { getSiteOrigin } from "@/app/lib/site-url";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = getSiteOrigin();

const googleSiteVerification = process.env.GOOGLE_SITE_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  keywords: [...SITE_KEYWORDS],
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  ...(googleSiteVerification
    ? { verification: { google: googleSiteVerification } }
    : {}),
  icons: {
    icon: "/colorstack_run_logo_red_4.png",
    shortcut: "/colorstack_run_logo_red_4.png",
    apple: "/colorstack_run_logo_red_4.png",
  },
  openGraph: {
    type: "website",
    url: `${siteUrl}/`,
    siteName: "ColorStackRUN",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: [
      {
        url: "/colorstack_run_logo_red_4.png",
        width: 1024,
        height: 1024,
        alt: "ColorStack Rutgers Newark logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: ["/colorstack_run_logo_red_4.png"],
  },
};

const structuredDataJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "ColorStackRUN",
      description: HOME_DESCRIPTION,
      url: siteUrl,
      logo: `${siteUrl}/colorstack_run_logo_red_4.png`,
      parentOrganization: {
        "@type": "Organization",
        name: "ColorStack",
        url: "https://www.colorstack.org",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "ColorStackRUN",
      description: HOME_DESCRIPTION,
      inLanguage: "en-US",
      publisher: { "@id": `${siteUrl}/#organization` },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredDataJsonLd),
          }}
        />
        {children}
      </body>
    </html>
  );
}
