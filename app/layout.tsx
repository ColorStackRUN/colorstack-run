import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "ColorStackRUN | Rutgers University-Newark",
  description: "ColorStackRUN is the Rutgers University-Newark chapter of ColorStack.",
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
    title: "ColorStackRUN | Rutgers University-Newark",
    description: "ColorStackRUN is the Rutgers University-Newark chapter of ColorStack.",
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
    title: "ColorStackRUN | Rutgers University-Newark",
    description: "ColorStackRUN is the Rutgers University-Newark chapter of ColorStack.",
    images: ["/colorstack_run_logo_red_4.png"],
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "ColorStackRUN",
  description:
    "ColorStackRUN is the Rutgers University-Newark chapter of ColorStack.",
  url: siteUrl,
  logo: `${siteUrl}/colorstack_run_logo_red_4.png`,
  parentOrganization: {
    "@type": "Organization",
    name: "ColorStack",
    url: "https://www.colorstack.org",
  },
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
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
        {children}
      </body>
    </html>
  );
}
