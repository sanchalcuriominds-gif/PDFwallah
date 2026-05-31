import { Metadata } from 'next'
import { db } from '@/lib/db'

const SITE_URL = 'https://pdfwallah.in'

type Props = {
  params: Promise<{ slug: string; subjectSlug: string; chapterSlug: string; topicSlug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, subjectSlug, chapterSlug, topicSlug } = await params

  try {
    const classes = await db.class.findMany()
    const currentClass = classes.find((c: any) => c.slug === slug)
    if (!currentClass) return { title: 'Topic Notes PDF' }

    const subjects = await db.subject.findMany({ where: { classId: (currentClass as any).id } })
    const currentSubject = subjects.find((s: any) => s.slug === subjectSlug)
    if (!currentSubject) return { title: 'Topic Notes PDF' }

    const chapters = await db.chapter.findMany({ where: { subjectId: (currentSubject as any).id } })
    const currentChapter = chapters.find((ch: any) => ch.slug === chapterSlug)
    if (!currentChapter) return { title: 'Topic Notes PDF' }

    const topics = await db.topic.findMany({ where: { chapterId: (currentChapter as any).id } })
    const currentTopic = topics.find((t: any) => t.slug === topicSlug)
    if (!currentTopic) return { title: 'Topic Notes PDF' }

    const className = (currentClass as any).name
    const subjectName = (currentSubject as any).name
    const chapterName = (currentChapter as any).name
    const topicName = (currentTopic as any).name
    const seoTitle = `${topicName} Notes PDF — ${className} ${subjectName} ${chapterName}`
    const seoDescription = `Download ${topicName} Notes PDF for ${className} ${subjectName} ${chapterName}. Handwritten notes, PYQs & revision material. Instant download.`

    return {
      title: seoTitle,
      description: seoDescription,
      keywords: [
        `${topicName} notes PDF`, `${className} ${subjectName} ${topicName}`,
        `${topicName} handwritten notes PDF`, `${topicName} PYQ`,
      ],
      openGraph: {
        title: seoTitle,
        description: seoDescription,
        url: `${SITE_URL}/class/${slug}/subject/${subjectSlug}/chapter/${chapterSlug}/topic/${topicSlug}`,
      },
      alternates: {
        canonical: `${SITE_URL}/class/${slug}/subject/${subjectSlug}/chapter/${chapterSlug}/topic/${topicSlug}`,
      },
    }
  } catch {
    return { title: 'Topic Notes PDF' }
  }
}

export default function TopicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
