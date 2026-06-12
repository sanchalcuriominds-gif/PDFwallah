import { Metadata } from 'next'
import { db } from '@/lib/db'

const SITE_URL = 'https://pdfwallah.in'

type Props = {
  params: Promise<{ slug: string; subjectSlug: string; chapterSlug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, subjectSlug, chapterSlug } = await params

  try {
    const currentClass = await db.class.findUnique({ where: { slug } })
    if (!currentClass) return { title: 'Chapter Notes PDF' }

    const currentSubject = await db.subject.findFirst({
      where: { slug: subjectSlug, classId: currentClass.id },
    })
    if (!currentSubject) return { title: 'Chapter Notes PDF' }

    const currentChapter = await db.chapter.findFirst({
      where: { slug: chapterSlug, subjectId: currentSubject.id },
    })
    if (!currentChapter) return { title: 'Chapter Notes PDF' }

    const className = currentClass.name
    const subjectName = currentSubject.name
    const chapterName = currentChapter.name
    const seoTitle = `${chapterName} Notes PDF — ${className} ${subjectName}`
    const seoDescription = `Download ${chapterName} Notes PDF for ${className} ${subjectName}. Handwritten notes, PYQs & formula sheets. Instant download, no login required.`

    return {
      title: seoTitle,
      description: seoDescription,
      keywords: [
        `${chapterName} notes PDF`, `${className} ${subjectName} ${chapterName} notes`,
        `${chapterName} handwritten notes`, `${chapterName} PYQ PDF`,
      ],
      openGraph: {
        title: seoTitle,
        description: seoDescription,
        url: `${SITE_URL}/class/${slug}/subject/${subjectSlug}/chapter/${chapterSlug}`,
      },
      alternates: {
        canonical: `${SITE_URL}/class/${slug}/subject/${subjectSlug}/chapter/${chapterSlug}`,
      },
    }
  } catch {
    return { title: 'Chapter Notes PDF' }
  }
}

export default function ChapterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
