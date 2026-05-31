import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'School Notes PDF Download — Class 9, 10, 11, 12 CBSE Notes PDF',
  description: 'Download Class 9-12 CBSE Notes PDF, NCERT Solutions, Handwritten Notes, PYQs & Formula Sheets. Instant PDF download, no login required. Starting ₹10.',
  keywords: [
    'Class 9 notes PDF', 'Class 10 notes PDF', 'Class 11 notes PDF', 'Class 12 notes PDF',
    'CBSE notes PDF download', 'NCERT solutions PDF', 'handwritten notes Class 10',
    'formula sheet Class 12', 'PYQ Class 10', 'revision notes PDF',
  ],
  openGraph: {
    title: 'School Notes PDF Download — Class 9-12 CBSE Notes',
    description: 'Download Class 9-12 CBSE Notes PDF. Handwritten notes, PYQs, formula sheets. Instant download, no login.',
    url: 'https://pdfwallah.in/school',
    type: 'website',
    locale: 'en_IN',
  },
  alternates: {
    canonical: 'https://pdfwallah.in/school',
  },
}

export default function SchoolLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
