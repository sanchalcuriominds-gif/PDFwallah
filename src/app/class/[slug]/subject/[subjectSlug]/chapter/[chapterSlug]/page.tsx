'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { BookOpen, FileText, ChevronRight, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PdfGrid } from '@/components/pdf/pdf-grid'

interface TopicData {
  id: string
  name: string
  slug: string
  chapter: { name: string; slug: string; subject: { name: string; slug: string; class: { name: string; slug: string } } }
  _count: { pdfs: number }
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

export default function ChapterPage() {
  const params = useParams()
  const classSlug = params.slug as string
  const subjectSlug = params.subjectSlug as string
  const chapterSlug = params.chapterSlug as string
  const [chapterInfo, setChapterInfo] = useState<{ name: string; subject: { name: string; slug: string; class: { name: string; slug: string } } } | null>(null)
  const [topics, setTopics] = useState<TopicData[]>([])
  const [pdfs, setPdfs] = useState<PdfData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [topicsRes, pdfsRes] = await Promise.all([
          fetch(`/api/topics?_=${Date.now()}`),
          fetch(`/api/pdfs?limit=20&_=${Date.now()}`),
        ])

        const allTopics: TopicData[] = await topicsRes.json()
        const pdfsData = await pdfsRes.json()

        const filteredTopics = allTopics.filter(
          (t) =>
            t.chapter.slug === chapterSlug &&
            t.chapter.subject.slug === subjectSlug &&
            t.chapter.subject.class.slug === classSlug
        )
        setTopics(filteredTopics)

        if (filteredTopics.length > 0) {
          setChapterInfo({
            name: filteredTopics[0].chapter.name,
            subject: filteredTopics[0].chapter.subject,
          })
        }

        setPdfs(
          (pdfsData.pdfs || []).filter(
            (p: PdfData) =>
              p.class.slug === classSlug &&
              p.subject.slug === subjectSlug &&
              p.chapter.slug === chapterSlug
          )
        )
      } catch (error) {
        console.error('Error fetching chapter data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [classSlug, subjectSlug, chapterSlug])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    )
  }

  if (!chapterInfo) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-2xl font-bold">Chapter not found</h1>
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
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
        <Link href="/" className="hover:text-emerald-600 transition-colors">Home</Link>
        <ChevronRight className="w-4 h-4" />
        <Link href={`/class/${classSlug}`} className="hover:text-emerald-600 transition-colors">
          {chapterInfo.subject.class.name}
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link href={`/class/${classSlug}/subject/${subjectSlug}`} className="hover:text-emerald-600 transition-colors">
          {chapterInfo.subject.name}
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground font-medium">{chapterInfo.name}</span>
      </nav>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl font-bold">{chapterInfo.name}</h1>
        <p className="text-muted-foreground mt-1">
          {chapterInfo.subject.class.name} &middot; {chapterInfo.subject.name} &middot; {chapterInfo.name}
        </p>
      </motion.div>

      {/* Topics */}
      {topics.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            Topics
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topics.map((topic, index) => (
              <motion.div
                key={topic.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Link href={`/class/${classSlug}/subject/${subjectSlug}/chapter/${chapterSlug}/topic/${topic.slug}`}>
                  <Card className="group cursor-pointer hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {topic.name}
                        </h3>
                        <ChevronRight className="w-4 h-4 text-muted-foreground mt-0.5 group-hover:text-emerald-600 transition-colors" />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {topic._count.pdfs} Notes
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

      {topics.length === 0 && pdfs.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No content available for this chapter yet.</p>
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
