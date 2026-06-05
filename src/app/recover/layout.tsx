import { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdfwallah.in'

export const metadata: Metadata = {
  title: 'Recover Download Links - Get Your Purchased PDFs',
  description: 'Lost your download link? Recover your purchased PDF notes instantly. Enter your email or phone number and we will resend your download links.',
  keywords: [
    'recover download', 'lost download link', 'resend PDF link',
    'get purchased notes', 'PDFWallah recover', 'download recovery',
  ],
  openGraph: {
    title: 'Recover Download Links - PDFWallah',
    description: 'Lost your download link? Recover your purchased PDF notes instantly.',
    url: `${SITE_URL}/recover`,
    type: 'website',
    locale: 'en_IN',
    siteName: 'PDFWallah',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Recover Download Links - PDFWallah',
    description: 'Lost your download link? Recover your purchased PDF notes instantly.',
  },
  alternates: {
    canonical: `${SITE_URL}/recover`,
  },
  robots: {
    index: false, // Don't index the recover page in search results
    follow: true,
  },
}

export default function RecoverLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
