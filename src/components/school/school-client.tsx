'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  GraduationCap,
  BookOpen,
  ArrowRight,
  Search,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ClassCard } from '@/components/pdf/class-card'
import { PdfGrid } from '@/components/pdf/pdf-grid'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'

interface ClassData {
  id: string
  name: string
  slug: string
  type?: string
  _count?: { subjects: number; pdfs: number }
}

interface PdfData {
  id: string
  title: string
  description: string
  price: number
  mrp?: number | null
  pageCount: number
  salesCount: number
  downloadCount: number
  featured: boolean
  thumbnailPath: string | null
  noteTypeId?: string | null
  createdAt: string
  noteType?: { name: string; slug: string } | null
  class: { name: string; slug: string }
  subject: { name: string; slug: string }
  chapter: { name: string; slug: string }
  topic: { name: string; slug: string }
}

interface SchoolClientProps {
  classes: ClassData[]
  featuredPdfs: PdfData[]
  popularPdfs: PdfData[]
}

const quickSubjects = [
  'Physics', 'Chemistry', 'Mathematics', 'Biology', 'English', 'Hindi',
  'History', 'Geography', 'Political Science', 'Economics',
]

export function SchoolClient({ classes, featuredPdfs, popularPdfs }: SchoolClientProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = () => {
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`
    }
  }

  return (
    <div className="space-y-0 pb-8">
      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Breadcrumbs items={[{ label: 'School Notes' }]} />
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-green-950/30" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-200/30 dark:bg-emerald-800/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-teal-200/30 dark:bg-teal-800/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <motion.div
            className="text-center space-y-5 max-w-3xl mx-auto"
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
              <GraduationCap className="w-4 h-4" />
              CBSE School Notes
            </motion.div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              School Notes —{' '}
              <span className="text-emerald-600 dark:text-emerald-400">Class 9 to 12</span>
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Complete CBSE notes, NCERT solutions, PYQs & formula sheets for all subjects. Download and start studying.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto pt-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search school notes by subject or topic..."
                    className="pl-10 h-11 bg-background border-border/50 focus:border-emerald-400 focus:ring-emerald-400/20"
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  className="h-11 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Class Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-emerald-600" />
              Browse by Class
            </h2>
            <p className="text-muted-foreground text-sm mt-1">Select your class to find subject-wise notes</p>
          </div>

          {classes.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              {classes.map((cls, index) => (
                <motion.div
                  key={cls.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <ClassCard classData={cls} index={index} />
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No classes available yet.</p>
          )}
        </motion.div>
      </section>

      {/* Quick Subject Links */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-emerald-600" />
              Popular Subjects
            </h2>
            <p className="text-muted-foreground text-sm mt-1">Quick access to your favourite subjects</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickSubjects.map((subject) => (
              <Link key={subject} href={`/search?q=${encodeURIComponent(subject)}`}>
                <Badge
                  variant="secondary"
                  className="px-3 py-1.5 text-sm cursor-pointer hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-900 dark:hover:text-emerald-300 transition-colors"
                >
                  {subject}
                </Badge>
              </Link>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Featured Notes */}
      {featuredPdfs.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-emerald-600" />
                  Featured Notes
                </h2>
                <p className="text-muted-foreground text-sm mt-1">Handpicked by our educators</p>
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

      {/* Popular Notes */}
      {popularPdfs.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                  Most Popular
                </h2>
                <p className="text-muted-foreground text-sm mt-1">Top picks by students</p>
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

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
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
            <h2 className="text-2xl sm:text-3xl font-bold">Can&apos;t Find What You Need?</h2>
            <p className="text-emerald-100">
              Search through our entire collection of notes, PYQs, and study material. We&apos;re constantly adding new content.
            </p>
            <Link href="/search">
              <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50 gap-2 h-12 px-8">
                <Search className="w-5 h-5" />
                Search All Notes
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
