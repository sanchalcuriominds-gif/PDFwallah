import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Search Notes PDF — Find Handwritten Notes, PYQs & Formula Sheets',
  description: 'Search and download Notes PDF for Class 9-12, JEE, NEET & more. Find handwritten notes, PYQs, formula sheets & revision material. Instant download.',
  openGraph: {
    title: 'Search Notes PDF — PDFWallah',
    description: 'Search and download Notes PDF. Handwritten notes, PYQs, formula sheets for all classes and exams.',
    url: 'https://pdfwallah.in/search',
  },
  alternates: {
    canonical: 'https://pdfwallah.in/search',
  },
}

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
