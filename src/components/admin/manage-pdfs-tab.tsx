'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  Eye,
  Trash2,
  Loader2,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { AdminPdf, ClassData, SubjectData } from './types'

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

export function ManagePdfsTab() {
  const [pdfs, setPdfs] = useState<AdminPdf[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Pagination state
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })

  // Search state
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // Filter states
  const [classes, setClasses] = useState<ClassData[]>([])
  const [subjects, setSubjects] = useState<SubjectData[]>([])
  const [filterClassId, setFilterClassId] = useState<string>('')
  const [filterSubjectId, setFilterSubjectId] = useState<string>('')

  // Load classes for filter dropdown
  useEffect(() => {
    fetch('/api/admin/classes')
      .then((r) => r.json())
      .then(setClasses)
      .catch(console.error)
  }, [])

  // Load subjects when class filter changes
  useEffect(() => {
    if (filterClassId) {
      fetch(`/api/subjects?classId=${filterClassId}`)
        .then((r) => r.json())
        .then(setSubjects)
        .catch(console.error)
      // Reset subject filter when class changes
      setFilterSubjectId('')
    } else {
      setSubjects([])
      setFilterSubjectId('')
    }
  }, [filterClassId])

  // Reset page when filters or search change
  useEffect(() => {
    setPage(1)
  }, [filterClassId, filterSubjectId, searchTerm])

  const fetchPdfs = useCallback(() => {
    setIsLoading(true)
    const params = new URLSearchParams()
    if (filterClassId) params.set('classId', filterClassId)
    if (filterSubjectId) params.set('subjectId', filterSubjectId)
    if (searchTerm) params.set('search', searchTerm)
    params.set('page', String(page))
    params.set('limit', '20')
    fetch(`/api/admin/pdfs?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        // API returns { pdfs, pagination }
        if (data.pdfs) {
          setPdfs(data.pdfs)
          setPagination(data.pagination)
        } else {
          // Backward compat: if old format (array), use directly
          setPdfs(Array.isArray(data) ? data : [])
          setPagination({ page: 1, limit: 20, total: 0, totalPages: 0 })
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [filterClassId, filterSubjectId, searchTerm, page])

  useEffect(() => {
    fetchPdfs()
  }, [fetchPdfs])

  const handleSearch = () => {
    setSearchTerm(searchInput)
    setPage(1)
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const clearSearch = () => {
    setSearchInput('')
    setSearchTerm('')
    setPage(1)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this PDF? This action cannot be undone.')) return
    setDeleteId(id)
    try {
      const res = await fetch(`/api/admin/pdfs/${id}`, { method: 'DELETE' })
      if (res.ok) {
        // If we deleted the last item on a page > 1, go back one page
        if (pdfs.length === 1 && page > 1) {
          setPage((prev) => prev - 1)
        } else {
          setPdfs((prev) => prev.filter((p) => p.id !== id))
          setPagination((prev) => ({ ...prev, total: prev.total - 1 }))
        }
      }
    } catch (error) {
      console.error('Error deleting PDF:', error)
    } finally {
      setDeleteId(null)
    }
  }

  const handleTogglePublish = async (id: string, published: boolean) => {
    try {
      const res = await fetch(`/api/admin/pdfs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !published }),
      })
      if (res.ok) {
        setPdfs((prev) =>
          prev.map((p) => (p.id === id ? { ...p, published: !published } : p))
        )
      }
    } catch (error) {
      console.error('Error toggling publish:', error)
    }
  }

  const clearFilters = () => {
    setFilterClassId('')
    setFilterSubjectId('')
  }

  const hasActiveFilters = filterClassId || filterSubjectId || searchTerm

  // Calculate showing range
  const startItem = pagination.total === 0 ? 0 : (page - 1) * pagination.limit + 1
  const endItem = Math.min(page * pagination.limit, pagination.total)

  if (isLoading && pdfs.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              All PDFs ({pagination.total})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search & Filter Controls */}
          <div className="space-y-3 mb-4 pb-4 border-b">
            {/* Search Row */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search PDFs by title..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" size="sm" onClick={handleSearch} className="h-9">
                Search
              </Button>
              {searchTerm && (
                <Button variant="ghost" size="sm" onClick={clearSearch} className="h-9 gap-1 text-muted-foreground">
                  <X className="w-3.5 h-3.5" />
                  Clear search
                </Button>
              )}
            </div>

            {/* Filter Row */}
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="w-4 h-4" />
                <span>Filter:</span>
              </div>
              <div className="w-48">
                <Select value={filterClassId} onValueChange={setFilterClassId}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Classes" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-48">
                <Select value={filterSubjectId} onValueChange={setFilterSubjectId} disabled={!filterClassId}>
                  <SelectTrigger>
                    <SelectValue placeholder={filterClassId ? 'All Subjects' : 'Select class first'} />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((sub) => (
                      <SelectItem key={sub.id} value={sub.id}>
                        {sub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {hasActiveFilters && !searchTerm && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 gap-1 text-muted-foreground">
                  <X className="w-3.5 h-3.5" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {pdfs.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>MRP</TableHead>
                      <TableHead>Sales</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pdfs.map((pdf) => (
                      <TableRow key={pdf.id}>
                        <TableCell className="font-medium max-w-[200px] truncate">
                          {pdf.title}
                        </TableCell>
                        <TableCell>{pdf.class.name}</TableCell>
                        <TableCell>{pdf.subject.name}</TableCell>
                        <TableCell>₹{pdf.price}</TableCell>
                        <TableCell>{pdf.mrp ? `₹${pdf.mrp}` : '-'}</TableCell>
                        <TableCell>{pdf.salesCount}</TableCell>
                        <TableCell>
                          <Badge
                            variant={pdf.published ? 'default' : 'secondary'}
                            className={
                              pdf.published
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                                : ''
                            }
                          >
                            {pdf.published ? 'Published' : 'Draft'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleTogglePublish(pdf.id, pdf.published)}
                              title={pdf.published ? 'Unpublish' : 'Publish'}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700"
                              onClick={() => handleDelete(pdf.id)}
                              disabled={deleteId === pdf.id}
                            >
                              {deleteId === pdf.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing {startItem}–{endItem} of {pagination.total} results
                  {searchTerm && <span className="ml-1">for &ldquo;{searchTerm}&rdquo;</span>}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={page <= 1}
                    className="gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground px-2">
                    Page {page} of {pagination.totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
                    disabled={page >= pagination.totalPages}
                    className="gap-1"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              {hasActiveFilters
                ? searchTerm
                  ? `No PDFs found matching "${searchTerm}"`
                  : 'No PDFs match the selected filters'
                : 'No PDFs uploaded yet'}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
