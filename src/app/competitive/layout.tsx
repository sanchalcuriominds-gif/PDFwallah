import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Competitive Exam Notes PDF — JEE, NEET, CUET, REET Notes & PYQs',
  description: 'Download JEE, NEET, CUET, REET, SSC & Railway Notes PDF, PYQs, Formula Sheets & Handwritten Notes. Instant PDF download, no login required. Starting ₹10.',
  keywords: [
    'JEE notes PDF', 'NEET notes PDF', 'CUET notes PDF', 'REET notes PDF',
    'JEE PYQ PDF', 'NEET handwritten notes PDF', 'JEE formula sheet PDF',
    'competitive exam notes PDF download', 'SSC notes PDF', 'Railway exam notes',
  ],
  openGraph: {
    title: 'Competitive Exam Notes PDF — JEE, NEET, CUET, REET',
    description: 'Download competitive exam Notes PDF, PYQs & Formula Sheets. Instant download, no login.',
    url: 'https://pdfwallah.in/competitive',
    type: 'website',
    locale: 'en_IN',
  },
  alternates: {
    canonical: 'https://pdfwallah.in/competitive',
  },
}

export default function CompetitiveLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
