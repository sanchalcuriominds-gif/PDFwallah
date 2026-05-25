import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AnnouncementBanner } from "@/components/layout/announcement-banner";
import { BackToTop } from "@/components/layout/back-to-top";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vedant Academy - Free Study Material for School & Competitive Exams",
  description: "Notes, PYQs, PDFs & Study Material for Class 9-12, JEE, NEET, CUET, REET, SSC & more. Download instantly.",
  keywords: [
    "Vedant Academy", "CBSE notes", "PDF notes", "study material", "digital notes",
    "Class 9", "Class 10", "Class 11", "Class 12", "board exams",
    "JEE", "NEET", "CUET", "REET", "SSC", "Railway", "Rajasthan Exams",
    "previous year questions", "PYQs", "formula sheets", "handwritten notes",
    "NCERT solutions", "competitive exam preparation", "entrance exam notes",
  ],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Vedant Academy - Free Study Material for School & Competitive Exams",
    description: "Notes, PYQs, PDFs & Study Material for Class 9-12, JEE, NEET, CUET, REET, SSC & more. Download instantly.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
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
