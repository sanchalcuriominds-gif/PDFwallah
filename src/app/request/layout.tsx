import { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdfwallah.in'

export const metadata: Metadata = {
  title: 'Request Notes - Ask for Any PDF, Notes, PYQs & Study Material',
  description: "Can't find the notes you need? Request any PDF, handwritten notes, PYQs, formula sheets, NCERT solutions or study material for Class 9-12, JEE, NEET, CUET and more. We'll try our best to provide it.",
  keywords: [
    'request notes', 'request PDF', 'ask for notes', 'demand notes',
    'custom notes request', 'need study material', 'notes on demand',
    'PDFWallah request', 'request handwritten notes', 'request PYQs',
  ],
  openGraph: {
    title: 'Request Notes - PDFWallah',
    description: "Can't find the notes you need? Request any PDF, notes or study material and we'll try our best to provide it.",
    url: `${SITE_URL}/request`,
    type: 'website',
    locale: 'en_IN',
    siteName: 'PDFWallah',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Request Notes - PDFWallah',
    description: "Can't find the notes you need? Request any PDF, notes or study material and we'll try our best to provide it.",
  },
  alternates: {
    canonical: `${SITE_URL}/request`,
  },
}

export default function RequestLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
