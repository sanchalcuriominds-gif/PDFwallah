'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  FileText,
  SlidersHorizontal,
  X,
  Search as SearchIcon,
  Trophy,
  GraduationCap,
  TrendingUp,
  Sparkles,
  BookOpen,
  Atom,
  Stethoscope,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { PdfGrid } from '@/components/pdf/pdf-grid'
import { PdfCardSkeleton } from '@/components/pdf/pdf-card-skeleton'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'

interface ClassData {
  id: string
  name: string
  slug: string
}

interface SubjectData {
  id: string
  name: string
  slug: string
  classId: string
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

const competitiveExamOptions = [
  { value: 'jee', label: 'JEE', icon: Atom, color: 'text-orange-600' },
  { value: 'neet', label: 'NEET', icon: Stethoscope, color: 'text-red-600' },
  { value: 'cuet', label: 'CUET', icon: GraduationCap, color: 'text-blue-600' },
  { value: 'reet', label: 'REET', icon: BookOpen, color: 'text-purple-600' },
  { value: 'ssc', label: 'SSC', icon: TrendingUp, color: 'text-amber-600' },
  { value: 'railway', label: 'Railway', icon: TrendingUp, color: 'text-teal-600' },
]

const popularSearches = [
  'Physics Notes', 'Chemistry PYQs', 'Maths Formula', 'Biology Notes',
  'English Grammar', 'Class 10 Notes', 'Class 12 Notes', 'NCERT Solutions',
]

function SearchContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const initialSort = searchParams.get('sort') || 'newest'
  const initialFeatured = searchParams.get('featured') || ''

  const [query, setQuery] = useState(initialQuery)
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('')
  const [selectedExamType, setSelectedExamType] = useState<string>('')
  const [sort, setSort] = useState(initialSort)
  const [featured, setFeatured] = useState(initialFeatured === 'true')
  const [classes, setClasses] = useState<ClassData[]>([])
  const [subjects, setSubjects] = useState<SubjectData[]>([])
  const [pdfs, setPdfs] = useState<PdfData[]>([])
  const [totalResults, setTotalResults] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(1)

  // Fetch classes on mount
  useEffect(() => {
    fetch('/api/classes')
      .then((res) => res.json())
      .then(setClasses)
      .catch(console.error)
  }, [])

  // Fetch subjects when class changes
  useEffect(() => {
    if (selectedClassId) {
      fetch(`/api/subjects?classId=${selectedClassId}`)
        .then((res) => res.json())
        .then(setSubjects)
        .catch(console.error)
    } else {
      setSubjects([])
      setSelectedSubjectId('')
    }
  }, [selectedClassId])

  const fetchPdfs = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (query) params.set('search', query)
      if (selectedClassId) params.set('classId', selectedClassId)
      if (selectedSubjectId) params.set('subjectId', selectedSubjectId)
      if (sort) params.set('sort', sort)
      if (featured) params.set('featured', 'true')
      params.set('page', page.toString())
      params.set('limit', '20')

      const res = await fetch(`/api/pdfs?${params.toString()}`)
      const data = await res.json()
      setPdfs(data.pdfs || [])
      setTotalResults(data.pagination?.total || 0)
    } catch (error) {
      console.error('Error fetching PDFs:', error)
    } finally {
      setIsLoading(false)
    }
  }, [query, selectedClassId, selectedSubjectId, sort, featured, page])

  useEffect(() => {
    fetchPdfs()
  }, [fetchPdfs])

  const handleSearch = () => {
    setPage(1)
    fetchPdfs()
  }

  const clearFilters = () => {
    setSelectedClassId('')
    setSelectedSubjectId('')
    setSelectedExamType('')
    setSort('newest')
    setFeatured(false)
    setQuery('')
    setPage(1)
  }

  const hasActiveFilters = selectedClassId || selectedSubjectId || selectedExamType || featured || query

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Class Filter */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-emerald-600" />
          Class
        </h3>
        <Select value={selectedClassId} onValueChange={setSelectedClassId}>
          <SelectTrigger>
            <SelectValue placeholder="All Classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classes.map((cls) => (
              <SelectItem key={cls.id} value={cls.id}>
                {cls.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Subject Filter */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-emerald-600" />
          Subject
        </h3>
        <Select
          value={selectedSubjectId}
          onValueChange={setSelectedSubjectId}
          disabled={!selectedClassId}
        >
          <SelectTrigger>
            <SelectValue placeholder={selectedClassId ? 'All Subjects' : 'Select class first'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {subjects.map((sub) => (
              <SelectItem key={sub.id} value={sub.id}>
                {sub.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Competitive Exam Filter */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Trophy className="w-4 h-4 text-indigo-600" />
          Competitive Exam
        </h3>
        <Select value={selectedExamType} onValueChange={setSelectedExamType}>
          <SelectTrigger>
            <SelectValue placeholder="All Exams" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Exams</SelectItem>
            {competitiveExamOptions.map((exam) => (
              <SelectItem key={exam.value} value={exam.value}>
                <span className="flex items-center gap-2">
                  {exam.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Featured Filter */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-600" />
          Featured Only
        </h3>
        <Button
          variant={featured ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFeatured(!featured)}
          className={featured ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
        >
          {featured ? 'Featured Only' : 'Show All'}
        </Button>
      </div>

      {/* Sort */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Sort By</h3>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="popular">Most Popular</SelectItem>
            <SelectItem value="downloads">Most Downloads</SelectItem>
            <SelectItem value="price-low">Price: Low to High</SelectItem>
            <SelectItem value="price-high">Price: High to Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full gap-2">
          <X className="w-4 h-4" />
          Clear Filters
        </Button>
      )}
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Search' }]} />

      {/* Search Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-4"
      >
        <div>
          <h1 className="text-3xl font-bold">Search Notes</h1>
          <p className="text-muted-foreground text-sm mt-1">Find the perfect study material for your preparation</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search notes, subjects, chapters, exams..."
              className="pl-10 h-11 bg-background border-border/50 focus:border-emerald-400 focus:ring-emerald-400/20"
            />
          </div>
          <Button
            onClick={handleSearch}
            className="h-11 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <SearchIcon className="w-4 h-4 mr-2" />
            Search
          </Button>

          {/* Mobile Filter Button */}
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-11 w-11">
                  <SlidersHorizontal className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FilterContent />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Popular Search Suggestions */}
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground py-1">Popular:</span>
          {popularSearches.map((term) => (
            <button
              key={term}
              onClick={() => {
                setQuery(term)
                setPage(1)
              }}
              className="px-2.5 py-1 text-xs rounded-full bg-muted/50 border border-border/50 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950 dark:hover:text-emerald-300 transition-colors cursor-pointer"
            >
              {term}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Filters:</span>
          {query && (
            <Badge variant="secondary" className="gap-1">
              &ldquo;{query}&rdquo;
              <X className="w-3 h-3 cursor-pointer" onClick={() => setQuery('')} />
            </Badge>
          )}
          {selectedClassId && (
            <Badge variant="secondary" className="gap-1">
              {classes.find((c) => c.id === selectedClassId)?.name}
              <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedClassId('')} />
            </Badge>
          )}
          {selectedSubjectId && (
            <Badge variant="secondary" className="gap-1">
              {subjects.find((s) => s.id === selectedSubjectId)?.name}
              <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedSubjectId('')} />
            </Badge>
          )}
          {selectedExamType && (
            <Badge variant="secondary" className="gap-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              <Trophy className="w-3 h-3" />
              {competitiveExamOptions.find((e) => e.value === selectedExamType)?.label}
              <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedExamType('')} />
            </Badge>
          )}
          {featured && (
            <Badge variant="secondary" className="gap-1">
              Featured
              <X className="w-3 h-3 cursor-pointer" onClick={() => setFeatured(false)} />
            </Badge>
          )}
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {isLoading ? 'Searching...' : `${totalResults} note${totalResults !== 1 ? 's' : ''} found`}
        </p>
      </div>

      <div className="flex gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <Card>
            <CardContent className="p-4">
              <h2 className="font-semibold mb-4">Filters</h2>
              <FilterContent />
            </CardContent>
          </Card>
        </aside>

        {/* Results */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[0, 1, 2, 3].map((i) => (
                <PdfCardSkeleton key={i} />
              ))}
            </div>
          ) : pdfs.length > 0 ? (
            <PdfGrid pdfs={pdfs} />
          ) : (
            <div className="text-center py-16">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No notes found</h2>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search or filters to find what you&apos;re looking for.
              </p>
              <Button
                variant="outline"
                onClick={clearFilters}
                className="gap-2"
              >
                <X className="w-4 h-4" />
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <Breadcrumbs items={[{ label: 'Search' }]} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[0, 1, 2, 3].map((i) => (
              <PdfCardSkeleton key={i} />
            ))}
          </div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  )
}
