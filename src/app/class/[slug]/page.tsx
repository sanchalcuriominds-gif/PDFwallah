import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PdfGrid } from '@/components/pdf/pdf-grid'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'

type Props = {
  params: Promise<{ slug: string }>
}

const subjectGradients = [
  'from-emerald-400 to-teal-500',
  'from-teal-400 to-cyan-500',
  'from-green-400 to-emerald-500',
  'from-cyan-400 to-green-500',
  'from-emerald-500 to-green-600',
]

export default async function ClassPage({ params }: Props) {
  const { slug } = await params

  // Direct DB queries — zero API round-trips!
  const currentClass = await db.class.findUnique({ where: { slug } })
  if (!currentClass) notFound()

  const [subjects, pdfs] = await Promise.all([
    db.subject.findMany({
      where: { classId: currentClass.id },
      select: {
        id: true,
        name: true,
        slug: true,
        class: { select: { name: true, slug: true } },
        _count: { select: { chapters: true, pdfs: true } },
      },
      orderBy: { name: 'asc' },
    }),
    db.pdf.findMany({
      where: { classId: currentClass.id, published: true },
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
          { label: 'School Notes', href: '/school' },
          { label: currentClass.name },
        ]}
      />

      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-3xl font-bold">{currentClass.name}</h1>
        <p className="text-muted-foreground mt-1">
          Browse subjects and notes for {currentClass.name}
        </p>
      </div>

      {/* Subjects Grid */}
      {subjects.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            Subjects
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((subject, index) => (
              <div
                key={subject.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
              >
                <Link href={`/class/${slug}/subject/${subject.slug}`}>
                  <Card className="overflow-hidden group cursor-pointer hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors">
                    <div className={`h-24 bg-gradient-to-br ${subjectGradients[index % subjectGradients.length]} flex items-center justify-center`}>
                      <BookOpen className="w-10 h-10 text-white/80" />
                    </div>
                    <CardContent className="p-4 space-y-2">
                      <h3 className="font-semibold group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {subject.name}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {subject._count.chapters} Chapters
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {subject._count.pdfs} Notes
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

      {/* Recent PDFs */}
      {pdfs.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            Recent Notes
          </h2>
          <PdfGrid pdfs={pdfs} />
        </section>
      )}

      {subjects.length === 0 && pdfs.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No content available for this class yet.</p>
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
