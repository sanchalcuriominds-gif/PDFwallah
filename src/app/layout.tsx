import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AnnouncementBanner } from "@/components/layout/announcement-banner";
import { BackToTop } from "@/components/layout/back-to-top";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdfwallah.in'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "PDFWallah - Free Study Material for School & Competitive Exams",
    template: "%s | PDFWallah",
  },
  description: "Notes, PYQs, PDFs & Study Material for Class 9-12, JEE, NEET, CUET, REET, SSC & more. Download instantly.",
  keywords: [
    "PDFWallah", "CBSE notes", "PDF notes", "study material", "digital notes",
    "Class 9", "Class 10", "Class 11", "Class 12", "board exams",
    "JEE", "NEET", "CUET", "REET", "SSC", "Railway", "Rajasthan Exams",
    "previous year questions", "PYQs", "formula sheets", "handwritten notes",
    "NCERT solutions", "competitive exam preparation", "entrance exam notes",
    "RBSE notes", "ICSE notes", "UP Board notes",
  ],
  authors: [{ name: "PDFWallah", url: SITE_URL }],
  creator: "PDFWallah",
  publisher: "PDFWallah",
  icons: {
    icon: "/logo.svg",
  },
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: "PDFWallah - Free Study Material for School & Competitive Exams",
    description: "Notes, PYQs, PDFs & Study Material for Class 9-12, JEE, NEET, CUET, REET, SSC & more. Download instantly.",
    type: "website",
    url: SITE_URL,
    locale: "en_IN",
    siteName: "PDFWallah",
  },
  twitter: {
    card: "summary_large_image",
    title: "PDFWallah - Free Study Material for School & Competitive Exams",
    description: "Notes, PYQs, PDFs & Study Material for Class 9-12, JEE, NEET, CUET, REET, SSC & more. Download instantly.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add your Google Search Console verification code here after setting up Search Console
    // google: "YOUR_VERIFICATION_CODE",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen flex flex-col">
            <AnnouncementBanner />
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <BackToTop />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
