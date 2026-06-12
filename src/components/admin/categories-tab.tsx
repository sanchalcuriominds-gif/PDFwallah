'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  FolderOpen,
  Plus,
  Trash2,
  Filter,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ClassData, SubjectData, ChapterData, TopicData } from './types'

// Extended types for admin view with counts
interface ClassWithCount extends ClassData {
  _count?: { subjects: number; pdfs: number }
}
interface SubjectWithCount extends SubjectData {
  className?: string
  _count?: { chapters: number; pdfs: number }
}
interface ChapterWithCount extends ChapterData {
  subjectName?: string
  _count?: { topics: number; pdfs: number }
}
interface TopicWithCount extends TopicData {
  chapterName?: string
  _count?: { pdfs: number }
}

export function CategoriesTab() {
  const [activeSection, setActiveSection] = useState<'class' | 'subject' | 'chapter' | 'topic'>('class')

  // Data lists
  const [classes, setClasses] = useState<ClassData[]>([])
  const [subjects, setSubjects] = useState<SubjectData[]>([])
  const [chapters, setChapters] = useState<ChapterData[]>([])
  const [topics, setTopics] = useState<TopicData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Form states
  const [newClassName, setNewClassName] = useState('')
  const [newClassType, setNewClassType] = useState<'school' | 'competitive'>('school')
  const [newSubjectName, setNewSubjectName] = useState('')
  const [newChapterName, setNewChapterName] = useState('')
  const [newTopicName, setNewTopicName] = useState('')
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [selectedChapterId, setSelectedChapterId] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Delete states
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ id: string; type: 'class' | 'subject' | 'chapter' | 'topic'; name: string } | null>(null)

  // List filter states (separate from form selectors)
  const [listClassFilter, setListClassFilter] = useState('')
  const [listSubjectFilter, setListSubjectFilter] = useState('')
  const [listChapterFilter, setListChapterFilter] = useState('')

  const [classesWithCount, setClassesWithCount] = useState<ClassWithCount[]>([])
  const [subjectsWithCount, setSubjectsWithCount] = useState<SubjectWithCount[]>([])
  const [chaptersWithCount, setChaptersWithCount] = useState<ChapterWithCount[]>([])
  const [topicsWithCount, setTopicsWithCount] = useState<TopicWithCount[]>([])

  const fetchAllData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [classesRes, subjectsRes, chaptersRes, topicsRes] = await Promise.all([
        fetch('/api/admin/classes'),
        fetch('/api/admin/subjects'),
        fetch('/api/admin/chapters'),
        fetch('/api/admin/topics'),
      ])
      if (classesRes.ok) {
        const classData = await classesRes.json()
        setClassesWithCount(classData)
        setClasses(classData.map((c: ClassWithCount) => ({ id: c.id, name: c.name, slug: c.slug })))
      }
      if (subjectsRes.ok) {
        const subjectData = await subjectsRes.json()
        setSubjectsWithCount(subjectData)
        setSubjects(subjectData.map((s: SubjectWithCount) => ({ id: s.id, name: s.name, slug: s.slug, classId: s.classId })))
      }
      if (chaptersRes.ok) {
        const chapterData = await chaptersRes.json()
        setChaptersWithCount(chapterData)
        setChapters(chapterData.map((c: ChapterWithCount) => ({ id: c.id, name: c.name, slug: c.slug, subjectId: c.subjectId })))
      }
      if (topicsRes.ok) {
        const topicData = await topicsRes.json()
        setTopicsWithCount(topicData)
        setTopics(topicData.map((t: TopicWithCount) => ({ id: t.id, name: t.name, slug: t.slug, chapterId: t.chapterId })))
      }
    } catch (err) {
      console.error('Error fetching categories:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  // Load public subjects/chapters/topics for the dropdowns in forms
  useEffect(() => {
    if (selectedClassId) {
      fetch(`/api/subjects?classId=${selectedClassId}`).then(r => r.json()).then(setSubjects).catch(console.error)
      setSelectedSubjectId('')
      setSelectedChapterId('')
    } else {
      setSubjects([])
    }
  }, [selectedClassId])

  useEffect(() => {
    if (selectedSubjectId) {
      fetch(`/api/chapters?subjectId=${selectedSubjectId}`).then(r => r.json()).then(setChapters).catch(console.error)
      setSelectedChapterId('')
    } else {
      setChapters([])
    }
  }, [selectedSubjectId])

  useEffect(() => {
    if (selectedChapterId) {
      fetch(`/api/topics?chapterId=${selectedChapterId}`).then(r => r.json()).then(setTopics).catch(console.error)
    } else {
      setTopics([])
    }
  }, [selectedChapterId])

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message })
    setTimeout(() => setFeedback(null), 3000)
  }

  const generateSlug = (name: string) => name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newClassName.trim()) return
    setIsCreating(true)
    try {
      const res = await fetch('/api/admin/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newClassName.trim(), slug: generateSlug(newClassName), sortOrder: 0, type: newClassType }),
      })
      if (res.ok) {
        const savedName = newClassName.trim()
        setNewClassName('')
        setNewClassType('school')
        showFeedback('success', `Class "${savedName}" added!`)
        fetchAllData()
      } else {
        const data = await res.json()
        showFeedback('error', data.error || 'Failed to add class')
      }
    } catch {
      showFeedback('error', 'Failed to add class')
    } finally {
      setIsCreating(false)
    }
  }

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSubjectName.trim() || !selectedClassId) return
    setIsCreating(true)
    try {
      const res = await fetch('/api/admin/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSubjectName.trim(), slug: generateSlug(newSubjectName), classId: selectedClassId }),
      })
      if (res.ok) {
        const savedName = newSubjectName.trim()
        setNewSubjectName('')
        showFeedback('success', `Subject "${savedName}" added!`)
        fetchAllData()
      } else {
        const data = await res.json()
        showFeedback('error', data.error || 'Failed to add subject')
      }
    } catch {
      showFeedback('error', 'Failed to add subject')
    } finally {
      setIsCreating(false)
    }
  }

  const handleAddChapter = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newChapterName.trim() || !selectedSubjectId) return
    setIsCreating(true)
    try {
      const res = await fetch('/api/admin/chapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newChapterName.trim(), slug: generateSlug(newChapterName), subjectId: selectedSubjectId }),
      })
      if (res.ok) {
        const savedName = newChapterName.trim()
        setNewChapterName('')
        showFeedback('success', `Chapter "${savedName}" added!`)
        fetchAllData()
      } else {
        const data = await res.json()
        showFeedback('error', data.error || 'Failed to add chapter')
      }
    } catch {
      showFeedback('error', 'Failed to add chapter')
    } finally {
      setIsCreating(false)
    }
  }

  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTopicName.trim() || !selectedChapterId) return
    setIsCreating(true)
    try {
      const res = await fetch('/api/admin/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTopicName.trim(), slug: generateSlug(newTopicName), chapterId: selectedChapterId }),
      })
      if (res.ok) {
        const savedName = newTopicName.trim()
        setNewTopicName('')
        showFeedback('success', `Topic "${savedName}" added!`)
        fetchAllData()
      } else {
        const data = await res.json()
        showFeedback('error', data.error || 'Failed to add topic')
      }
    } catch {
      showFeedback('error', 'Failed to add topic')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async () => {
    if (!showDeleteConfirm) return
    const { id, type } = showDeleteConfirm
    setDeleteId(id)
    try {
      const endpoint = type === 'class' ? 'classes' : type === 'subject' ? 'subjects' : type === 'chapter' ? 'chapters' : 'topics'
      const res = await fetch(`/api/admin/${endpoint}/${id}`, { method: 'DELETE' })
      if (res.ok) {
        const data = await res.json()
        showFeedback('success', data.message || `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`)
        fetchAllData()
      } else {
        const data = await res.json()
        showFeedback('error', data.error || `Failed to delete ${type}`)
      }
    } catch {
      showFeedback('error', `Failed to delete ${type}`)
    } finally {
      setDeleteId(null)
      setShowDeleteConfirm(null)
    }
  }

  // Computed filtered lists
  const filteredSubjects = listClassFilter
    ? subjectsWithCount.filter(s => s.classId === listClassFilter)
    : subjectsWithCount

  const filteredChapters = (() => {
    if (listSubjectFilter) return chaptersWithCount.filter(ch => ch.subjectId === listSubjectFilter)
    if (listClassFilter) {
      const subjectIds = subjectsWithCount.filter(s => s.classId === listClassFilter).map(s => s.id)
      return chaptersWithCount.filter(ch => subjectIds.includes(ch.subjectId))
    }
    return chaptersWithCount
  })()

  const filteredTopics = (() => {
    if (listChapterFilter) return topicsWithCount.filter(tp => tp.chapterId === listChapterFilter)
    if (listSubjectFilter) {
      const chapterIds = chaptersWithCount.filter(ch => ch.subjectId === listSubjectFilter).map(ch => ch.id)
      return topicsWithCount.filter(tp => chapterIds.includes(tp.chapterId))
    }
    if (listClassFilter) {
      const subjectIds = subjectsWithCount.filter(s => s.classId === listClassFilter).map(s => s.id)
      const chapterIds = chaptersWithCount.filter(ch => subjectIds.includes(ch.subjectId)).map(ch => ch.id)
      return topicsWithCount.filter(tp => chapterIds.includes(tp.chapterId))
    }
    return topicsWithCount
  })()

  const clearListFilters = () => {
    setListClassFilter('')
    setListSubjectFilter('')
    setListChapterFilter('')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    )
  }

  const sections = [
    { key: 'class' as const, label: 'Class', icon: '🏫', count: classesWithCount.length },
    { key: 'subject' as const, label: 'Subject', icon: '📚', count: subjectsWithCount.length },
    { key: 'chapter' as const, label: 'Chapter', icon: '📖', count: chaptersWithCount.length },
    { key: 'topic' as const, label: 'Topic', icon: '📝', count: topicsWithCount.length },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Feedback banner */}
      {feedback && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
              : 'bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-300'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {feedback.message}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl p-6 max-w-md mx-4 shadow-2xl border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold">Delete {showDeleteConfirm.type.charAt(0).toUpperCase() + showDeleteConfirm.type.slice(1)}</h3>
                <p className="text-sm text-muted-foreground">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm mb-4">
              Are you sure you want to delete <strong>&quot;{showDeleteConfirm.name}&quot;</strong>?
              {showDeleteConfirm.type === 'class' && ' This will also delete all its subjects, chapters, topics, and associated PDFs.'}
              {showDeleteConfirm.type === 'subject' && ' This will also delete all its chapters, topics, and associated PDFs.'}
              {showDeleteConfirm.type === 'chapter' && ' This will also delete all its topics and associated PDFs.'}
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(null)} disabled={deleteId !== null}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleteId !== null}>
                {deleteId ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {sections.map((s) => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              activeSection === s.key
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30'
                : 'border-transparent bg-card hover:border-emerald-200 dark:hover:border-emerald-800'
            }`}
          >
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-2xl font-bold">{s.count}</div>
            <div className="text-xs text-muted-foreground">{s.label}{s.count !== 1 ? 's' : ''}</div>
          </button>
        ))}
      </div>

      {/* Add Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-600" />
            Add New {activeSection === 'class' ? 'Class' : activeSection === 'subject' ? 'Subject' : activeSection === 'chapter' ? 'Chapter' : 'Topic'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={
              activeSection === 'class' ? handleAddClass
              : activeSection === 'subject' ? handleAddSubject
              : activeSection === 'chapter' ? handleAddChapter
              : handleAddTopic
            }
            className="space-y-4"
          >
            {activeSection === 'subject' && (
              <div className="space-y-2">
                <Label>Select Class *</Label>
                <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    {classesWithCount.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {activeSection === 'chapter' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Select Class *</Label>
                  <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                    <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>
                      {classesWithCount.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Select Subject *</Label>
                  <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId} disabled={!selectedClassId}>
                    <SelectTrigger><SelectValue placeholder={selectedClassId ? 'Select subject' : 'Class first'} /></SelectTrigger>
                    <SelectContent>
                      {subjects.map((sub) => (
                        <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {activeSection === 'topic' && (
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Select Class *</Label>
                  <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                    <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>
                      {classesWithCount.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Select Subject *</Label>
                  <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId} disabled={!selectedClassId}>
                    <SelectTrigger><SelectValue placeholder={selectedClassId ? 'Select subject' : 'Class first'} /></SelectTrigger>
                    <SelectContent>
                      {subjects.map((sub) => (
                        <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Select Chapter *</Label>
                  <Select value={selectedChapterId} onValueChange={setSelectedChapterId} disabled={!selectedSubjectId}>
                    <SelectTrigger><SelectValue placeholder={selectedSubjectId ? 'Select chapter' : 'Subject first'} /></SelectTrigger>
                    <SelectContent>
                      {chapters.map((ch) => (
                        <SelectItem key={ch.id} value={ch.id}>{ch.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {activeSection === 'class' && (
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select value={newClassType} onValueChange={(v) => setNewClassType(v as 'school' | 'competitive')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="school">🏫 School (Class 9, 10, 11, 12)</SelectItem>
                    <SelectItem value="competitive">🏆 Competitive (JEE, NEET, CUET, etc.)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-2">
                <Label htmlFor="cat-name">
                  {activeSection === 'class' ? 'Class' : activeSection === 'subject' ? 'Subject' : activeSection === 'chapter' ? 'Chapter' : 'Topic'} Name *
                </Label>
                <Input
                  id="cat-name"
                  value={activeSection === 'class' ? newClassName : activeSection === 'subject' ? newSubjectName : activeSection === 'chapter' ? newChapterName : newTopicName}
                  onChange={(e) => {
                    if (activeSection === 'class') setNewClassName(e.target.value)
                    else if (activeSection === 'subject') setNewSubjectName(e.target.value)
                    else if (activeSection === 'chapter') setNewChapterName(e.target.value)
                    else setNewTopicName(e.target.value)
                  }}
                  placeholder={activeSection === 'class' ? 'e.g., Class 10' : activeSection === 'subject' ? 'e.g., Mathematics' : activeSection === 'chapter' ? 'e.g., Light' : 'e.g., Reflection'}
                />
              </div>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={isCreating || (activeSection === 'class' ? !newClassName.trim() : activeSection === 'subject' ? (!newSubjectName.trim() || !selectedClassId) : activeSection === 'chapter' ? (!newChapterName.trim() || !selectedSubjectId) : (!newTopicName.trim() || !selectedChapterId))}
              >
                {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-2" />Add {activeSection === 'class' ? 'Class' : activeSection === 'subject' ? 'Subject' : activeSection === 'chapter' ? 'Chapter' : 'Topic'}</>}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Existing items list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-emerald-600" />
            All {activeSection === 'class' ? 'Classes' : activeSection === 'subject' ? 'Subjects' : activeSection === 'chapter' ? 'Chapters' : 'Topics'}
            {(listClassFilter || listSubjectFilter || listChapterFilter) && activeSection !== 'class' && (
              <Badge variant="secondary" className="text-xs ml-2">
                {activeSection === 'subject' ? filteredSubjects.length : activeSection === 'chapter' ? filteredChapters.length : filteredTopics.length} shown
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* ====== CLASS LIST ====== */}
          {activeSection === 'class' && (
            classesWithCount.length > 0 ? (
              <div className="space-y-2">
                {classesWithCount.map((cls) => (
                  <div key={cls.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="font-medium">{cls.name}</p>
                      <p className="text-xs text-muted-foreground">slug: {cls.slug}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="text-xs">{cls._count?.subjects || 0} subjects</Badge>
                      <Badge variant="secondary" className="text-xs">{cls._count?.pdfs || 0} PDFs</Badge>
                      <Badge variant={cls.type === 'competitive' ? 'default' : 'secondary'} className="text-xs">
                        {cls.type === 'competitive' ? '🏆 Competitive' : '🏫 School'}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
                        onClick={() => setShowDeleteConfirm({ id: cls.id, type: 'class', name: cls.name })} title="Delete class">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No classes yet. Add your first class above!</p>
            )
          )}

          {/* ====== SUBJECT LIST (with Class filter) ====== */}
          {activeSection === 'subject' && (
            <>
              <div className="flex flex-wrap items-end gap-3 mb-4 pb-4 border-b">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Filter className="w-4 h-4" /><span>Filter:</span>
                </div>
                <div className="w-48">
                  <Select value={listClassFilter} onValueChange={(v) => { setListClassFilter(v); setListSubjectFilter(''); setListChapterFilter(''); }}>
                    <SelectTrigger><SelectValue placeholder="All Classes" /></SelectTrigger>
                    <SelectContent>
                      {classesWithCount.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {listClassFilter && (
                  <Button variant="ghost" size="sm" onClick={clearListFilters} className="h-9 gap-1 text-muted-foreground">
                    <X className="w-3.5 h-3.5" />Clear
                  </Button>
                )}
              </div>
              {filteredSubjects.length > 0 ? (
                <div className="space-y-2">
                  {filteredSubjects.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div>
                        <p className="font-medium">{sub.name}</p>
                        <p className="text-xs text-muted-foreground">Class: {sub.className || sub.classId} | slug: {sub.slug}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="text-xs">{sub._count?.chapters || 0} chapters</Badge>
                        <Badge variant="secondary" className="text-xs">{sub._count?.pdfs || 0} PDFs</Badge>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
                          onClick={() => setShowDeleteConfirm({ id: sub.id, type: 'subject', name: sub.name })} title="Delete subject">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">{listClassFilter ? 'No subjects found for this class' : 'No subjects yet. Add your first subject above!'}</p>
              )}
            </>
          )}

          {/* ====== CHAPTER LIST (with Class → Subject filter) ====== */}
          {activeSection === 'chapter' && (
            <>
              <div className="flex flex-wrap items-end gap-3 mb-4 pb-4 border-b">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Filter className="w-4 h-4" /><span>Filter:</span>
                </div>
                <div className="w-48">
                  <Select value={listClassFilter} onValueChange={(v) => { setListClassFilter(v); setListSubjectFilter(''); setListChapterFilter(''); }}>
                    <SelectTrigger><SelectValue placeholder="All Classes" /></SelectTrigger>
                    <SelectContent>
                      {classesWithCount.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-48">
                  <Select value={listSubjectFilter} onValueChange={(v) => { setListSubjectFilter(v); setListChapterFilter(''); }} disabled={!listClassFilter}>
                    <SelectTrigger><SelectValue placeholder={listClassFilter ? 'All Subjects' : 'Class first'} /></SelectTrigger>
                    <SelectContent>
                      {subjectsWithCount.filter(s => s.classId === listClassFilter).map((sub) => (
                        <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {(listClassFilter || listSubjectFilter) && (
                  <Button variant="ghost" size="sm" onClick={clearListFilters} className="h-9 gap-1 text-muted-foreground">
                    <X className="w-3.5 h-3.5" />Clear
                  </Button>
                )}
              </div>
              {filteredChapters.length > 0 ? (
                <div className="space-y-2">
                  {filteredChapters.map((ch) => (
                    <div key={ch.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div>
                        <p className="font-medium">{ch.name}</p>
                        <p className="text-xs text-muted-foreground">Subject: {ch.subjectName || ch.subjectId} | slug: {ch.slug}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="text-xs">{ch._count?.topics || 0} topics</Badge>
                        <Badge variant="secondary" className="text-xs">{ch._count?.pdfs || 0} PDFs</Badge>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
                          onClick={() => setShowDeleteConfirm({ id: ch.id, type: 'chapter', name: ch.name })} title="Delete chapter">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">{(listClassFilter || listSubjectFilter) ? 'No chapters found for the selected filters' : 'No chapters yet. Add your first chapter above!'}</p>
              )}
            </>
          )}

          {/* ====== TOPIC LIST (with Class → Subject → Chapter filter) ====== */}
          {activeSection === 'topic' && (
            <>
              <div className="flex flex-wrap items-end gap-3 mb-4 pb-4 border-b">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Filter className="w-4 h-4" /><span>Filter:</span>
                </div>
                <div className="w-40">
                  <Select value={listClassFilter} onValueChange={(v) => { setListClassFilter(v); setListSubjectFilter(''); setListChapterFilter(''); }}>
                    <SelectTrigger><SelectValue placeholder="All Classes" /></SelectTrigger>
                    <SelectContent>
                      {classesWithCount.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-40">
                  <Select value={listSubjectFilter} onValueChange={(v) => { setListSubjectFilter(v); setListChapterFilter(''); }} disabled={!listClassFilter}>
                    <SelectTrigger><SelectValue placeholder={listClassFilter ? 'All Subjects' : 'Class first'} /></SelectTrigger>
                    <SelectContent>
                      {subjectsWithCount.filter(s => s.classId === listClassFilter).map((sub) => (
                        <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-40">
                  <Select value={listChapterFilter} onValueChange={setListChapterFilter} disabled={!listSubjectFilter}>
                    <SelectTrigger><SelectValue placeholder={listSubjectFilter ? 'All Chapters' : 'Subject first'} /></SelectTrigger>
                    <SelectContent>
                      {chaptersWithCount.filter(ch => ch.subjectId === listSubjectFilter).map((ch) => (
                        <SelectItem key={ch.id} value={ch.id}>{ch.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {(listClassFilter || listSubjectFilter || listChapterFilter) && (
                  <Button variant="ghost" size="sm" onClick={clearListFilters} className="h-9 gap-1 text-muted-foreground">
                    <X className="w-3.5 h-3.5" />Clear
                  </Button>
                )}
              </div>
              {filteredTopics.length > 0 ? (
                <div className="space-y-2">
                  {filteredTopics.map((tp) => (
                    <div key={tp.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div>
                        <p className="font-medium">{tp.name}</p>
                        <p className="text-xs text-muted-foreground">Chapter: {tp.chapterName || tp.chapterId} | slug: {tp.slug}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="text-xs">{tp._count?.pdfs || 0} PDFs</Badge>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
                          onClick={() => setShowDeleteConfirm({ id: tp.id, type: 'topic', name: tp.name })} title="Delete topic">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">{(listClassFilter || listSubjectFilter || listChapterFilter) ? 'No topics found for the selected filters' : 'No topics yet. Add your first topic above!'}</p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
