import { Metadata } from 'next'
import { db } from '@/lib/db'

const SITE_URL = 'https://pdfwallah.in'

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params

  try {
    const pdf = await db.pdf.findUnique({
      where: { id },
      select: {
        title: true,
        pageCount: true,
        class: { select: { name: true } },
        subject: { select: { name: true } },
        chapter: { select: { name: true } },
        topic: { select: { name: true } },
        noteType: { select: { name: true } },
      },
    })

    if (!pdf) {
      return {
        title: 'Note Not Found',
        description: 'The requested PDF note could not be found on PDFWallah.',
      }
    }

    const noteTypeLabel = pdf.noteType?.name || 'Notes'
    const seoTitle = `${pdf.title} ${noteTypeLabel} PDF — ${pdf.class.name} ${pdf.subject.name}`
    const seoDescription = `Download ${pdf.title} ${noteTypeLabel} PDF for ${pdf.class.name} ${pdf.subject.name}. ${pdf.pageCount} pages, instant download, no login required. ${pdf.chapter.name} - ${pdf.topic.name}.`

    return {
      title: seoTitle,
      description: seoDescription,
      keywords: [
        `${pdf.title} PDF`,
        `${pdf.class.name} ${pdf.subject.name} notes PDF`,
        `${noteTypeLabel} PDF`,
        `${pdf.chapter.name} notes PDF`,
        `${pdf.topic.name} PDF`,
        `download ${pdf.title} PDF`,
        `${pdf.class.name} ${pdf.subject.name} ${noteTypeLabel.toLowerCase()}`,
      ],
      openGraph: {
        title: seoTitle,
        description: seoDescription,
        type: 'article',
        url: `${SITE_URL}/pdf/${id}`,
        locale: 'en_IN',
        siteName: 'PDFWallah',
      },
      twitter: {
        card: 'summary_large_image',
        title: seoTitle,
        description: seoDescription,
      },
      alternates: {
        canonical: `${SITE_URL}/pdf/${id}`,
      },
    }
  } catch (error) {
    return {
      title: 'Download Notes PDF',
      description: 'Download quality notes PDF from PDFWallah. Instant download, no login required.',
    }
  }
}

// JSON-LD structured data for PDF detail page
export default function PdfLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
