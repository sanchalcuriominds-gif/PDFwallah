import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PdfGrid } from '@/components/pdf/pdf-grid'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'

type Props = {
  params: Promise<{ slug: string; subjectSlug: string; chapterSlug: string; topicSlug: string }>
}

export default async function TopicPage({ params }: Props) {
  const { slug, subjectSlug, chapterSlug, topicSlug } = await params

  // Direct DB queries — zero API round-trips!
  const currentClass = await db.class.findUnique({ where: { slug } })
  if (!currentClass) notFound()

  const currentSubject = await db.subject.findFirst({
    where: { slug: subjectSlug, classId: currentClass.id },
  })
  if (!currentSubject) notFound()

  const currentChapter = await db.chapter.findFirst({
    where: { slug: chapterSlug, subjectId: currentSubject.id },
  })
  if (!currentChapter) notFound()

  const currentTopic = await db.topic.findFirst({
    where: { slug: topicSlug, chapterId: currentChapter.id },
  })
  if (!currentTopic) notFound()

  const pdfs = await db.pdf.findMany({
    where: { topicId: currentTopic.id, published: true },
    select: {
      id: true,
      title: true,
      description: true,
      price: true,
      pageCount: true,
      salesCount: true,
      downloadCount: true,
      featured: true,
      thumbnailPath: true,
      class: { select: { name: true, slug: true } },
      subject: { select: { name: true, slug: true } },
      chapter: { select: { name: true, slug: true } },
      topic: { select: { name: true, slug: true } },
      noteType: { select: { name: true, slug: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Breadcrumbs
        items={[
          { label: currentClass.name, href: `/class/${slug}` },
          { label: currentSubject.name, href: `/class/${slug}/subject/${subjectSlug}` },
          { label: currentChapter.name, href: `/class/${slug}/subject/${subjectSlug}/chapter/${chapterSlug}` },
          { label: currentTopic.name },
        ]}
      />

      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-3xl font-bold">{currentTopic.name}</h1>
        <p className="text-muted-foreground mt-1">
          {currentClass.name} &middot; {currentSubject.name} &middot; {currentChapter.name}
        </p>
      </div>

      {/* PDFs */}
      {pdfs.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            Notes ({pdfs.length})
          </h2>
          <PdfGrid pdfs={pdfs} />
        </section>
      ) : (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No notes available for this topic yet.</p>
          <Link href="/search">
            <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white">
              Browse All Notes
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
