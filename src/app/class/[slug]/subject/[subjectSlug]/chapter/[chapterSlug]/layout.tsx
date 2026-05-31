import { Metadata } from 'next'
import { db } from '@/lib/db'

const SITE_URL = 'https://pdfwallah.in'

type Props = {
  params: Promise<{ slug: string; subjectSlug: string; chapterSlug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, subjectSlug, chapterSlug } = await params

  try {
    const classes = await db.class.findMany()
    const currentClass = classes.find((c: any) => c.slug === slug)
    if (!currentClass) return { title: 'Chapter Notes PDF' }

    const subjects = await db.subject.findMany({ where: { classId: (currentClass as any).id } })
    const currentSubject = subjects.find((s: any) => s.slug === subjectSlug)
    if (!currentSubject) return { title: 'Chapter Notes PDF' }

    const chapters = await db.chapter.findMany({ where: { subjectId: (currentSubject as any).id } })
    const currentChapter = chapters.find((ch: any) => ch.slug === chapterSlug)
    if (!currentChapter) return { title: 'Chapter Notes PDF' }

    const className = (currentClass as any).name
    const subjectName = (currentSubject as any).name
    const chapterName = (currentChapter as any).name
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
