import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, FileText, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PdfGrid } from '@/components/pdf/pdf-grid'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'

type Props = {
  params: Promise<{ slug: string; subjectSlug: string }>
}

export default async function SubjectPage({ params }: Props) {
  const { slug, subjectSlug } = await params

  // Direct DB queries — zero API round-trips!
  const currentClass = await db.class.findUnique({ where: { slug } })
  if (!currentClass) notFound()

  const currentSubject = await db.subject.findFirst({
    where: { slug: subjectSlug, classId: currentClass.id },
  })
  if (!currentSubject) notFound()

  const [chapters, pdfs] = await Promise.all([
    db.chapter.findMany({
      where: { subjectId: currentSubject.id },
      select: {
        id: true,
        name: true,
        slug: true,
        subject: {
          select: {
            name: true,
            slug: true,
            class: { select: { name: true, slug: true } },
          },
        },
        _count: { select: { topics: true, pdfs: true } },
      },
      orderBy: { name: 'asc' },
    }),
    db.pdf.findMany({
      where: { subjectId: currentSubject.id, published: true },
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
      take: 8,
    }),
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Breadcrumbs
        items={[
          { label: currentClass.name, href: `/class/${slug}` },
          { label: currentSubject.name },
        ]}
      />

      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-3xl font-bold">{currentSubject.name}</h1>
        <p className="text-muted-foreground mt-1">
          {currentClass.name} &middot; {currentSubject.name}
        </p>
      </div>

      {/* Chapters */}
      {chapters.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            Chapters
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {chapters.map((chapter, index) => (
              <div
                key={chapter.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
              >
                <Link href={`/class/${slug}/subject/${subjectSlug}/chapter/${chapter.slug}`}>
                  <Card className="group cursor-pointer hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {chapter.name}
                        </h3>
                        <ChevronRight className="w-4 h-4 text-muted-foreground mt-0.5 group-hover:text-emerald-600 transition-colors" />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {chapter._count.topics} Topics
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {chapter._count.pdfs} Notes
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* PDFs */}
      {pdfs.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            All Notes
          </h2>
          <PdfGrid pdfs={pdfs} />
        </section>
      )}

      {chapters.length === 0 && pdfs.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No content available for this subject yet.</p>
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
