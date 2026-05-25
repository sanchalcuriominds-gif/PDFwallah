'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { BookOpen, FileText, ChevronRight, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PdfGrid } from '@/components/pdf/pdf-grid'
import { PdfCardSkeleton } from '@/components/pdf/pdf-card-skeleton'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'

interface SubjectData {
  id: string
  name: string
  slug: string
  class: { id: string; name: string; slug: string }
}

interface ChapterData {
  id: string
  name: string
  slug: string
  subject: { name: string; slug: string; class: { name: string; slug: string } }
  _count: { topics: number; pdfs: number }
}

interface PdfData {
  id: string
  title: string
  description: string
  price: number
  pageCount: number
  salesCount: number
  downloadCount: number
  featured: boolean
  thumbnailPath: string | null
  class: { name: string; slug: string }
  subject: { name: string; slug: string }
  chapter: { name: string; slug: string }
  topic: { name: string; slug: string }
}

export default function SubjectPage() {
  const params = useParams()
  const classSlug = params.slug as string
  const subjectSlug = params.subjectSlug as string
  const [subject, setSubject] = useState<SubjectData | null>(null)
  const [chapters, setChapters] = useState<ChapterData[]>([])
  const [pdfs, setPdfs] = useState<PdfData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [subjectsRes, chaptersRes, pdfsRes] = await Promise.all([
          fetch('/api/classes'),
          fetch(`/api/chapters?_=${Date.now()}`),
          fetch(`/api/pdfs?limit=8&_=${Date.now()}`),
        ])

        const classesData = await subjectsRes.json()
        const allChapters: ChapterData[] = await chaptersRes.json()
        const pdfsData = await pdfsRes.json()

        // Find the current class
        const currentClass = classesData.find((c: { slug: string }) => c.slug === classSlug)
        if (!currentClass) { setIsLoading(false); return }

        // Get subjects for this class
        const subjectsRes2 = await fetch(`/api/subjects?classId=${currentClass.id}`)
        const allSubjects: SubjectData[] = await subjectsRes2.json()
        const currentSubject = allSubjects.find((s: SubjectData) => s.slug === subjectSlug)
        setSubject(currentSubject || null)

        if (currentSubject) {
          setChapters(allChapters.filter((ch) => ch.subject.slug === subjectSlug && ch.subject.class.slug === classSlug))
          setPdfs(
            (pdfsData.pdfs || []).filter(
              (p: PdfData) => p.class.slug === classSlug && p.subject.slug === subjectSlug
            )
          )
        }
      } catch (error) {
        console.error('Error fetching subject data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [classSlug, subjectSlug])

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex items-center gap-2">
          <div className="h-4 w-10 bg-muted rounded animate-pulse" />
          <div className="h-4 w-4 bg-muted rounded-full animate-pulse" />
          <div className="h-4 w-16 bg-muted rounded animate-pulse" />
          <div className="h-4 w-4 bg-muted rounded-full animate-pulse" />
          <div className="h-4 w-14 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-8 w-40 bg-muted rounded animate-pulse" />
        <div className="h-4 w-56 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-2">
                <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-8">
          {[0, 1, 2, 3].map((i) => (
            <PdfCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (!subject) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-2xl font-bold">Subject not found</h1>
        <Link href="/">
          <Button variant="outline" className="mt-4 gap-2">
            <ArrowLeft className="w-4 h-4" /> Go Home
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Breadcrumbs
        items={[
          { label: subject.class.name, href: `/class/${classSlug}` },
          { label: subject.name },
        ]}
      />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl font-bold">{subject.name}</h1>
        <p className="text-muted-foreground mt-1">
          {subject.class.name} &middot; {subject.name}
        </p>
      </motion.div>

      {/* Chapters */}
      {chapters.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            Chapters
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {chapters.map((chapter, index) => (
              <motion.div
                key={chapter.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Link href={`/class/${classSlug}/subject/${subjectSlug}/chapter/${chapter.slug}`}>
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
              </motion.div>
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
