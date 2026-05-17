'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  BookOpen,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Clock,
  FileText,
  GraduationCap,
  Star,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SearchBar } from '@/components/pdf/search-bar'
import { PdfGrid } from '@/components/pdf/pdf-grid'
import { ClassCard } from '@/components/pdf/class-card'

interface ClassData {
  id: string
  name: string
  slug: string
  _count: { subjects: number; pdfs: number }
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
  createdAt: string
}

export default function HomePage() {
  const [classes, setClasses] = useState<ClassData[]>([])
  const [featuredPdfs, setFeaturedPdfs] = useState<PdfData[]>([])
  const [popularPdfs, setPopularPdfs] = useState<PdfData[]>([])
  const [recentPdfs, setRecentPdfs] = useState<PdfData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        // Seed database if empty
        await fetch('/api/seed', { method: 'POST' }).catch(() => {})

        const [classesRes, featuredRes, popularRes, recentRes] = await Promise.all([
          fetch('/api/classes'),
          fetch('/api/pdfs?featured=true&limit=4'),
          fetch('/api/pdfs?sort=popular&limit=4'),
          fetch('/api/pdfs?sort=newest&limit=4'),
        ])

        const classesData = await classesRes.json()
        const featuredData = await featuredRes.json()
        const popularData = await popularRes.json()
        const recentData = await recentRes.json()

        setClasses(classesData)
        setFeaturedPdfs(featuredData.pdfs || [])
        setPopularPdfs(popularData.pdfs || [])
        setRecentPdfs(recentData.pdfs || [])
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
  }

  const stagger = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  return (
    <div className="space-y-16 pb-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-green-950/30" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-200/30 dark:bg-emerald-800/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-teal-200/30 dark:bg-teal-800/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <motion.div
            className="text-center space-y-6 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-sm font-medium"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Sparkles className="w-4 h-4" />
              Trusted by 1000+ students
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              Your Digital{' '}
              <span className="text-emerald-600 dark:text-emerald-400">Notes Store</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Premium handwritten notes, PYQs, and study material for CBSE students.
              Download instantly and ace your exams.
            </p>

            <div className="max-w-xl mx-auto">
              <SearchBar placeholder="Search notes, subjects, chapters..." />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link href="/search">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-12 px-6">
                  <BookOpen className="w-5 h-5" />
                  Browse All Notes
                </Button>
              </Link>
              <Link href="/search?sort=popular">
                <Button size="lg" variant="outline" className="gap-2 h-12 px-6">
                  <TrendingUp className="w-5 h-5" />
                  Popular Notes
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-16 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {[
              { label: 'Notes Available', value: '500+', icon: FileText },
              { label: 'Happy Students', value: '1000+', icon: GraduationCap },
              { label: 'Subjects Covered', value: '15+', icon: BookOpen },
              { label: '5-Star Reviews', value: '200+', icon: Star },
            ].map((stat) => (
              <div key={stat.label} className="text-center space-y-1">
                <stat.icon className="w-5 h-5 mx-auto text-emerald-600 dark:text-emerald-400" />
                <p className="text-xl sm:text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Notes */}
      {!isLoading && featuredPdfs.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-emerald-600" />
                  Featured Notes
                </h2>
                <p className="text-muted-foreground text-sm mt-1">Handpicked notes by our educators</p>
              </div>
              <Link href="/search?featured=true">
                <Button variant="ghost" className="gap-1 text-emerald-600 dark:text-emerald-400">
                  View all <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            <PdfGrid pdfs={featuredPdfs} />
          </motion.div>
        </section>
      )}

      {/* Class Cards */}
      {!isLoading && classes.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp}>
            <div className="mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <GraduationCap className="w-6 h-6 text-emerald-600" />
                Browse by Class
              </h2>
              <p className="text-muted-foreground text-sm mt-1">Select your class to find relevant notes</p>
            </div>
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6"
              variants={stagger}
              initial="initial"
              animate="animate"
            >
              {classes.map((cls, index) => (
                <motion.div
                  key={cls.id}
                  variants={fadeInUp}
                >
                  <ClassCard classData={cls} index={index} />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </section>
      )}

      {/* Popular Notes */}
      {!isLoading && popularPdfs.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                  Popular Notes
                </h2>
                <p className="text-muted-foreground text-sm mt-1">Most purchased notes by students</p>
              </div>
              <Link href="/search?sort=popular">
                <Button variant="ghost" className="gap-1 text-emerald-600 dark:text-emerald-400">
                  View all <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            <PdfGrid pdfs={popularPdfs} />
          </motion.div>
        </section>
      )}

      {/* Recently Uploaded */}
      {!isLoading && recentPdfs.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Clock className="w-6 h-6 text-emerald-600" />
                  Recently Uploaded
                </h2>
                <p className="text-muted-foreground text-sm mt-1">Fresh notes just added</p>
              </div>
              <Link href="/search?sort=newest">
                <Button variant="ghost" className="gap-1 text-emerald-600 dark:text-emerald-400">
                  View all <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            <PdfGrid pdfs={recentPdfs} />
          </motion.div>
        </section>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
          </div>
        </div>
      )}

      {/* CTA Section */}
      {!isLoading && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 p-8 sm:p-12 text-white"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="absolute inset-0">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
            </div>
            <div className="relative text-center space-y-4 max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-bold">Ready to Ace Your Exams?</h2>
              <p className="text-emerald-100">
                Get access to premium handwritten notes, previous year questions, and comprehensive study material.
                Start studying smarter today.
              </p>
              <Link href="/search">
                <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50 gap-2 h-12 px-8">
                  <BookOpen className="w-5 h-5" />
                  Explore All Notes
                </Button>
              </Link>
            </div>
          </motion.div>
        </section>
      )}
    </div>
  )
}
