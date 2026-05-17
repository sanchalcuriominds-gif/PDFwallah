'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { FileText, ChevronRight, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PdfGrid } from '@/components/pdf/pdf-grid'

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

interface TopicInfo {
  name: string
  chapter: { name: string; slug: string; subject: { name: string; slug: string; class: { name: string; slug: string } } }
}

export default function TopicPage() {
  const params = useParams()
  const classSlug = params.slug as string
  const subjectSlug = params.subjectSlug as string
  const chapterSlug = params.chapterSlug as string
  const topicSlug = params.topicSlug as string
  const [topicInfo, setTopicInfo] = useState<TopicInfo | null>(null)
  const [pdfs, setPdfs] = useState<PdfData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [topicsRes, pdfsRes] = await Promise.all([
          fetch(`/api/topics?_=${Date.now()}`),
          fetch(`/api/pdfs?limit=20&_=${Date.now()}`),
        ])

        const allTopics = await topicsRes.json()
        const pdfsData = await pdfsRes.json()

        const currentTopic = allTopics.find(
          (t: TopicInfo & { slug: string }) =>
            t.slug === topicSlug &&
            t.chapter.slug === chapterSlug &&
            t.chapter.subject.slug === subjectSlug &&
            t.chapter.subject.class.slug === classSlug
        )
        setTopicInfo(currentTopic || null)

        setPdfs(
          (pdfsData.pdfs || []).filter(
            (p: PdfData) =>
              p.class.slug === classSlug &&
              p.subject.slug === subjectSlug &&
              p.chapter.slug === chapterSlug &&
              p.topic.slug === topicSlug
          )
        )
      } catch (error) {
        console.error('Error fetching topic data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [classSlug, subjectSlug, chapterSlug, topicSlug])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    )
  }

  if (!topicInfo) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-2xl font-bold">Topic not found</h1>
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
          {topicInfo.chapter.subject.class.name}
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link href={`/class/${classSlug}/subject/${subjectSlug}`} className="hover:text-emerald-600 transition-colors">
          {topicInfo.chapter.subject.name}
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link href={`/class/${classSlug}/subject/${subjectSlug}/chapter/${chapterSlug}`} className="hover:text-emerald-600 transition-colors">
          {topicInfo.chapter.name}
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground font-medium">{topicInfo.name}</span>
      </nav>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl font-bold">{topicInfo.name}</h1>
        <p className="text-muted-foreground mt-1">
          {topicInfo.chapter.subject.class.name} &middot; {topicInfo.chapter.subject.name} &middot; {topicInfo.chapter.name}
        </p>
      </motion.div>

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
