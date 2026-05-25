'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { BookOpen, FileText, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PdfGrid } from '@/components/pdf/pdf-grid'
import { PdfCardSkeleton } from '@/components/pdf/pdf-card-skeleton'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'

interface SubjectData {
  id: string
  name: string
  slug: string
  class: { name: string; slug: string }
  _count: { chapters: number; pdfs: number }
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

interface ClassData {
  id: string
  name: string
  slug: string
}

const subjectGradients = [
  'from-emerald-400 to-teal-500',
  'from-teal-400 to-cyan-500',
  'from-green-400 to-emerald-500',
  'from-cyan-400 to-green-500',
  'from-emerald-500 to-green-600',
]

export default function ClassPage() {
  const params = useParams()
  const slug = params.slug as string
  const [classData, setClassData] = useState<ClassData | null>(null)
  const [subjects, setSubjects] = useState<SubjectData[]>([])
  const [pdfs, setPdfs] = useState<PdfData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [classesRes, subjectsRes, pdfsRes] = await Promise.all([
          fetch('/api/classes'),
          fetch(`/api/subjects?classId=&_=${Date.now()}`),
          fetch(`/api/pdfs?limit=8&_=${Date.now()}`),
        ])

        const classesData: ClassData[] = await classesRes.json()
        const allSubjects: SubjectData[] = await subjectsRes.json()
        const pdfsData = await pdfsRes.json()

        const currentClass = classesData.find((c) => c.slug === slug)
        setClassData(currentClass || null)

        if (currentClass) {
          setSubjects(allSubjects.filter((s) => s.class.slug === slug))
          setPdfs((pdfsData.pdfs || []).filter(
            (p: PdfData) => p.class.slug === slug
          ))
        }
      } catch (error) {
        console.error('Error fetching class data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [slug])

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex items-center gap-2">
          <div className="h-4 w-10 bg-muted rounded animate-pulse" />
          <div className="h-4 w-4 bg-muted rounded-full animate-pulse" />
          <div className="h-4 w-16 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-8 w-32 bg-muted rounded animate-pulse" />
        <div className="h-4 w-48 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="overflow-hidden">
              <div className="h-24 bg-muted animate-pulse" />
              <CardContent className="p-4 space-y-2">
                <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                <div className="h-3 w-28 bg-muted rounded animate-pulse" />
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

  if (!classData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-2xl font-bold">Class not found</h1>
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
          { label: 'School Notes', href: '/school' },
          { label: classData.name },
        ]}
      />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl font-bold">{classData.name}</h1>
        <p className="text-muted-foreground mt-1">
          Browse subjects and notes for {classData.name}
        </p>
      </motion.div>

      {/* Subjects Grid */}
      {subjects.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            Subjects
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((subject, index) => (
              <motion.div
                key={subject.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
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
              </motion.div>
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
