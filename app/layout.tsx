import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "ColorStackRUN | Rutgers University-Newark",
  description: "ColorStackRUN is the Rutgers University-Newark chapter of ColorStack.",
  icons: {
    icon: "/colorstack_run_logo_red_4.png",
    shortcut: "/colorstack_run_logo_red_4.png",
    apple: "/colorstack_run_logo_red_4.png",
  },
  openGraph: {
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
