import { Metadata } from 'next'
import { db } from '@/lib/db'

const SITE_URL = 'https://pdfwallah.in'

type Props = {
  params: Promise<{ slug: string; subjectSlug: string; chapterSlug: string; topicSlug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, subjectSlug, chapterSlug, topicSlug } = await params

  try {
    const currentClass = await db.class.findUnique({ where: { slug } })
    if (!currentClass) return { title: 'Topic Notes PDF' }

    const currentSubject = await db.subject.findFirst({
      where: { slug: subjectSlug, classId: currentClass.id },
    })
    if (!currentSubject) return { title: 'Topic Notes PDF' }

    const currentChapter = await db.chapter.findFirst({
      where: { slug: chapterSlug, subjectId: currentSubject.id },
    })
    if (!currentChapter) return { title: 'Topic Notes PDF' }

    const currentTopic = await db.topic.findFirst({
      where: { slug: topicSlug, chapterId: currentChapter.id },
    })
    if (!currentTopic) return { title: 'Topic Notes PDF' }

    const className = currentClass.name
    const subjectName = currentSubject.name
    const chapterName = currentChapter.name
    const topicName = currentTopic.name
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
