import { Metadata } from 'next'
import { db } from '@/lib/db'

const SITE_URL = 'https://pdfwallah.in'

type Props = {
  params: Promise<{ slug: string; subjectSlug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, subjectSlug } = await params

  try {
    const currentClass = await db.class.findUnique({ where: { slug } })
    if (!currentClass) return { title: 'Subject Notes PDF' }

    const currentSubject = await db.subject.findFirst({
      where: { slug: subjectSlug, classId: currentClass.id },
    })
    if (!currentSubject) return { title: 'Subject Notes PDF' }

    const className = currentClass.name
    const subjectName = currentSubject.name
    const seoTitle = `${className} ${subjectName} Notes PDF — Chapterwise Download`
    const seoDescription = `Download ${className} ${subjectName} Notes PDF. Chapterwise handwritten notes, PYQs, formula sheets & revision material. Instant download, no login.`

    return {
      title: seoTitle,
      description: seoDescription,
      keywords: [
        `${className} ${subjectName} notes PDF`, `${subjectName} handwritten notes PDF`,
        `${className} ${subjectName} PYQ`, `${subjectName} chapterwise notes`,
        `download ${subjectName} notes PDF`, `${className} ${subjectName} formula sheet`,
      ],
      openGraph: {
        title: seoTitle,
        description: seoDescription,
        url: `${SITE_URL}/class/${slug}/subject/${subjectSlug}`,
        type: 'website',
        locale: 'en_IN',
        siteName: 'PDFWallah',
      },
      alternates: {
        canonical: `${SITE_URL}/class/${slug}/subject/${subjectSlug}`,
      },
    }
  } catch {
    return { title: 'Subject Notes PDF' }
  }
}

export default function SubjectLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
