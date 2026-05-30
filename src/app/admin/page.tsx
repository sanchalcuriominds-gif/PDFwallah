'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Shield,
  LayoutDashboard,
  Upload,
  FileText,
  ShoppingCart,
  LogOut,
  Eye,
  Trash2,
  Package,
  DollarSign,
  Users,
  TrendingUp,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Tag,
  FolderOpen,
  Plus,
  ChevronDown,
  ChevronRight,
  Image as ImageIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { Separator } from '@/components/ui/separator'

// Types
interface AdminStats {
  totalPdfs: number
  publishedPdfs: number
  totalOrders: number
  paidOrders: number
  totalRevenue: number
  recentOrders: Array<{
    id: string
    amount: number
    status: string
    buyerEmail: string | null
    createdAt: string
    pdf: { title: string }
  }>
}

interface ClassData {
  id: string
  name: string
  slug: string
  type?: 'school' | 'competitive'
}

interface SubjectData {
  id: string
  name: string
  slug: string
  classId: string
}

interface ChapterData {
  id: string
  name: string
  slug: string
  subjectId: string
}

interface TopicData {
  id: string
  name: string
  slug: string
  chapterId: string
}

interface NoteTypeData {
  id: string
  name: string
  slug: string
}

interface AdminPdf {
  id: string
  title: string
  price: number
  mrp: number | null
  pageCount: number
  salesCount: number
  featured: boolean
  published: boolean
  createdAt: string
  class: { name: string }
  subject: { name: string }
}

interface OrderData {
  id: string
  amount: number
  currency: string
  status: string
  buyerEmail: string | null
  buyerPhone: string | null
  createdAt: string
  pdf: { title: string; price: number }
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')

  // Check auth on mount
  useEffect(() => {
    fetch('/api/admin/auth')
      .then((res) => res.json())
      .then((data) => {
        setIsAuthenticated(data.authenticated === true)
      })
      .catch(() => setIsAuthenticated(false))
      .finally(() => setIsCheckingAuth(false))
  }, [])

  const handleLogin = async () => {
    setIsLoggingIn(true)
    setLoginError('')
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setIsAuthenticated(true)
      } else {
        setLoginError(data.error || 'Invalid password')
      }
    } catch {
      setLoginError('Login failed')
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' })
    setIsAuthenticated(false)
    setPassword('')
  }

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-emerald-600" />
              </div>
              <CardTitle className="text-xl">Admin Login</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-password">Password</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="Enter admin password"
                />
              </div>
              {loginError && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {loginError}
                </p>
              )}
              <Button
                onClick={handleLogin}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  'Login'
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Default password: admin123
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">Manage your PDF store</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6 mb-6">
          <TabsTrigger value="dashboard" className="gap-2">
            <LayoutDashboard className="w-4 h-4 hidden sm:block" />
            <span className="hidden sm:inline">Dashboard</span>
            <span className="sm:hidden">Home</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <FolderOpen className="w-4 h-4 hidden sm:block" />
            <span className="hidden sm:inline">Categories</span>
            <span className="sm:hidden">Cats</span>
          </TabsTrigger>
          <TabsTrigger value="upload" className="gap-2">
            <Upload className="w-4 h-4 hidden sm:block" />
            <span className="hidden sm:inline">Upload</span>
            <span className="sm:hidden">Add</span>
          </TabsTrigger>
          <TabsTrigger value="manage" className="gap-2">
            <FileText className="w-4 h-4 hidden sm:block" />
            <span className="hidden sm:inline">PDFs</span>
            <span className="sm:hidden">PDFs</span>
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-2">
            <ShoppingCart className="w-4 h-4 hidden sm:block" />
            <span className="hidden sm:inline">Orders</span>
            <span className="sm:hidden">Orders</span>
          </TabsTrigger>
          <TabsTrigger value="note-types" className="gap-2">
            <Tag className="w-4 h-4 hidden sm:block" />
            <span className="hidden sm:inline">Note Types</span>
            <span className="sm:hidden">Types</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <DashboardTab />
        </TabsContent>
        <TabsContent value="categories">
          <CategoriesTab />
        </TabsContent>
        <TabsContent value="upload">
          <UploadTab onUploaded={() => setActiveTab('manage')} />
        </TabsContent>
        <TabsContent value="manage">
          <ManagePdfsTab />
        </TabsContent>
        <TabsContent value="orders">
          <OrdersTab />
        </TabsContent>
        <TabsContent value="note-types">
          <NoteTypesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ========== Categories Tab ==========
function CategoriesTab() {
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

  // Also load public subjects/chapters/topics for the dropdowns in forms
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    )
  }

  const sections = [
    { key: 'class' as const, label: 'Class', icon: '🏫', items: classesWithCount, count: classesWithCount.length },
    { key: 'subject' as const, label: 'Subject', icon: '📚', items: subjectsWithCount, count: subjectsWithCount.length },
    { key: 'chapter' as const, label: 'Chapter', icon: '📖', items: chaptersWithCount, count: chaptersWithCount.length },
    { key: 'topic' as const, label: 'Topic', icon: '📝', items: topicsWithCount, count: topicsWithCount.length },
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
        ))
        }
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
            {/* Parent selectors - shown based on active section */}
            {activeSection === 'subject' && (
              <div className="space-y-2">
                <Label>Select Class *</Label>
                <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classesWithCount.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {activeSection === 'chapter' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Select Class *</Label>
                    <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
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
                      <SelectTrigger>
                        <SelectValue placeholder={selectedClassId ? 'Select subject' : 'Class first'} />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((sub) => (
                          <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {activeSection === 'topic' && (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Select Class *</Label>
                    <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
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
                      <SelectTrigger>
                        <SelectValue placeholder={selectedClassId ? 'Select subject' : 'Class first'} />
                      </SelectTrigger>
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
                      <SelectTrigger>
                        <SelectValue placeholder={selectedSubjectId ? 'Select chapter' : 'Subject first'} />
                      </SelectTrigger>
                      <SelectContent>
                        {chapters.map((ch) => (
                          <SelectItem key={ch.id} value={ch.id}>{ch.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {/* Type selector for class */}
            {activeSection === 'class' && (
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select value={newClassType} onValueChange={(v) => setNewClassType(v as 'school' | 'competitive')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="school">🏫 School (Class 9, 10, 11, 12)</SelectItem>
                    <SelectItem value="competitive">🏆 Competitive (JEE, NEET, CUET, etc.)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Name input */}
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-2">
                <Label htmlFor="cat-name">
                  {activeSection === 'class' ? 'Class' : activeSection === 'subject' ? 'Subject' : activeSection === 'chapter' ? 'Chapter' : 'Topic'} Name *
                </Label>
                <Input
                  id="cat-name"
                  value={
                    activeSection === 'class' ? newClassName
                    : activeSection === 'subject' ? newSubjectName
                    : activeSection === 'chapter' ? newChapterName
                    : newTopicName
                  }
                  onChange={(e) => {
                    if (activeSection === 'class') setNewClassName(e.target.value)
                    else if (activeSection === 'subject') setNewSubjectName(e.target.value)
                    else if (activeSection === 'chapter') setNewChapterName(e.target.value)
                    else setNewTopicName(e.target.value)
                  }}
                  placeholder={
                    activeSection === 'class' ? 'e.g., Class 10'
                    : activeSection === 'subject' ? 'e.g., Mathematics'
                    : activeSection === 'chapter' ? 'e.g., Light'
                    : 'e.g., Reflection'
                  }
                />
              </div>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={
                  isCreating ||
                  (activeSection === 'class' ? !newClassName.trim() :
                   activeSection === 'subject' ? (!newSubjectName.trim() || !selectedClassId) :
                   activeSection === 'chapter' ? (!newChapterName.trim() || !selectedSubjectId) :
                   (!newTopicName.trim() || !selectedChapterId))
                }
              >
                {isCreating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add {activeSection === 'class' ? 'Class' : activeSection === 'subject' ? 'Subject' : activeSection === 'chapter' ? 'Chapter' : 'Topic'}
                  </>
                )}
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
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                      <Badge variant="secondary" className="text-xs">
                        {cls._count?.subjects || 0} subjects
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {cls._count?.pdfs || 0} PDFs
                      </Badge>
                      <Badge variant={cls.type === 'competitive' ? 'default' : 'secondary'} className="text-xs">
                        {cls.type === 'competitive' ? '🏆 Competitive' : '🏫 School'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No classes yet. Add your first class above!</p>
            )
          )}

          {activeSection === 'subject' && (
            subjectsWithCount.length > 0 ? (
              <div className="space-y-2">
                {subjectsWithCount.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="font-medium">{sub.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Class: {sub.className || sub.classId} | slug: {sub.slug}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="text-xs">
                        {sub._count?.chapters || 0} chapters
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {sub._count?.pdfs || 0} PDFs
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No subjects yet. Add your first subject above!</p>
            )
          )}

          {activeSection === 'chapter' && (
            chaptersWithCount.length > 0 ? (
              <div className="space-y-2">
                {chaptersWithCount.map((ch) => (
                  <div key={ch.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="font-medium">{ch.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Subject: {ch.subjectName || ch.subjectId} | slug: {ch.slug}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="text-xs">
                        {ch._count?.topics || 0} topics
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {ch._count?.pdfs || 0} PDFs
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No chapters yet. Add your first chapter above!</p>
            )
          )}

          {activeSection === 'topic' && (
            topicsWithCount.length > 0 ? (
              <div className="space-y-2">
                {topicsWithCount.map((tp) => (
                  <div key={tp.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="font-medium">{tp.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Chapter: {tp.chapterName || tp.chapterId} | slug: {tp.slug}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {tp._count?.pdfs || 0} PDFs
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No topics yet. Add your first topic above!</p>
            )
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ========== Dashboard Tab ==========
function DashboardTab() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((res) => res.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    )
  }

  if (!stats) {
    return <p className="text-center text-muted-foreground py-20">Failed to load stats</p>
  }

  const statCards = [
    {
      label: 'Total PDFs',
      value: stats.totalPdfs,
      icon: Package,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100 dark:bg-emerald-900',
    },
    {
      label: 'Total Sales',
      value: stats.paidOrders,
      icon: TrendingUp,
      color: 'text-blue-600',
      bg: 'bg-blue-100 dark:bg-blue-900',
    },
    {
      label: 'Revenue',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-green-600',
      bg: 'bg-green-100 dark:bg-green-900',
    },
    {
      label: 'Total Orders',
      value: stats.totalOrders,
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-100 dark:bg-purple-900',
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-xl font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PDF</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {order.pdf.title}
                      </TableCell>
                      <TableCell>₹{order.amount}</TableCell>
                      <TableCell>
                        <Badge
                          variant={order.status === 'paid' ? 'default' : 'secondary'}
                          className={
                            order.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                              : ''
                          }
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No orders yet</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ========== Upload Tab ==========
function UploadTab({ onUploaded }: { onUploaded: () => void }) {
  const [classes, setClasses] = useState<ClassData[]>([])
  const [subjects, setSubjects] = useState<SubjectData[]>([])
  const [chapters, setChapters] = useState<ChapterData[]>([])
  const [topics, setTopics] = useState<TopicData[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{ success: boolean; message: string } | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [mrp, setMrp] = useState('')
  const [pageCount, setPageCount] = useState('')
  const [classId, setClassId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [chapterId, setChapterId] = useState('')
  const [topicId, setTopicId] = useState('')
  const [noteTypeId, setNoteTypeId] = useState('')
  const [noteTypes, setNoteTypes] = useState<NoteTypeData[]>([])
  const [previewFileUrl, setPreviewFileUrl] = useState('')
  const [fullFileUrl, setFullFileUrl] = useState('')
  const [thumbnailPage, setThumbnailPage] = useState('1')
  const [isRenderingThumb, setIsRenderingThumb] = useState(false)
  const [featured, setFeatured] = useState(false)
  const [published, setPublished] = useState(true)

  useEffect(() => {
    fetch('/api/classes').then((r) => r.json()).then(setClasses).catch(console.error)
  }, [])

  useEffect(() => {
    fetch('/api/note-types').then((r) => r.json()).then(setNoteTypes).catch(console.error)
  }, [])

  useEffect(() => {
    if (classId) {
      fetch(`/api/subjects?classId=${classId}`).then((r) => r.json()).then(setSubjects).catch(console.error)
      setSubjectId('')
      setChapterId('')
      setTopicId('')
    } else {
      setSubjects([])
    }
  }, [classId])

  useEffect(() => {
    if (subjectId) {
      fetch(`/api/chapters?subjectId=${subjectId}`).then((r) => r.json()).then(setChapters).catch(console.error)
      setChapterId('')
      setTopicId('')
    } else {
      setChapters([])
    }
  }, [subjectId])

  useEffect(() => {
    if (chapterId) {
      fetch(`/api/topics?chapterId=${chapterId}`).then((r) => r.json()).then(setTopics).catch(console.error)
      setTopicId('')
    } else {
      setTopics([])
    }
  }, [chapterId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !price || !classId || !subjectId || !chapterId || !topicId) {
      setUploadResult({ success: false, message: 'Please fill all required fields' })
      return
    }

    setIsUploading(true)
    setUploadResult(null)

    try {
      const res = await fetch('/api/admin/pdfs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          price: parseFloat(price),
          mrp: mrp ? parseFloat(mrp) : null,
          pageCount: parseInt(pageCount) || 0,
          classId,
          subjectId,
          chapterId,
          topicId,
          noteTypeId: noteTypeId || null,
          previewFileUrl: previewFileUrl || null,
          fullFileUrl: fullFileUrl || null,
          featured,
          published,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        // If thumbnail page is > 1, render that page and upload as custom thumbnail
        const thumbPage = parseInt(thumbnailPage) || 1
        if (thumbPage > 1 && (fullFileUrl || previewFileUrl)) {
          try {
            setIsRenderingThumb(true)
            setUploadResult({ success: true, message: 'PDF created! Rendering custom thumbnail...' })

            const { renderPdfPageToBlob, getGoogleDriveDownloadUrl } = await import('@/lib/pdf-renderer')
            const pdfUrl = getGoogleDriveDownloadUrl(fullFileUrl || previewFileUrl)
            const blob = await renderPdfPageToBlob(pdfUrl, thumbPage, 2)

            // Upload the thumbnail
            const thumbFormData = new FormData()
            thumbFormData.append('thumbnail', blob, 'thumbnail.png')
            thumbFormData.append('pdfId', data.id)

            const thumbRes = await fetch('/api/admin/upload-thumbnail', {
              method: 'POST',
              body: thumbFormData,
            })

            if (thumbRes.ok) {
              setUploadResult({ success: true, message: 'PDF uploaded with custom thumbnail!' })
            } else {
              setUploadResult({ success: true, message: 'PDF uploaded! (Thumbnail page rendering failed, using default)' })
            }
          } catch (thumbError) {
            console.error('Thumbnail rendering failed:', thumbError)
            setUploadResult({ success: true, message: 'PDF uploaded! (Thumbnail page rendering failed, using default)' })
          } finally {
            setIsRenderingThumb(false)
          }
        } else {
          setUploadResult({ success: true, message: 'PDF uploaded successfully!' })
        }

        setTitle('')
        setDescription('')
        setPrice('')
        setMrp('')
        setPageCount('')
        setNoteTypeId('')
        setPreviewFileUrl('')
        setFullFileUrl('')
        setThumbnailPage('1')
        setFeatured(false)
        setPublished(true)
        onUploaded()
      } else {
        setUploadResult({ success: false, message: data.error || 'Upload failed' })
      }
    } catch {
      setUploadResult({ success: false, message: 'Upload failed. Please try again.' })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-emerald-600" />
            Upload New PDF
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Light - Handwritten Notes"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the PDF content..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="49"
                  min="0"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mrp">MRP (₹)</Label>
                <Input
                  id="mrp"
                  type="number"
                  value={mrp}
                  onChange={(e) => setMrp(e.target.value)}
                  placeholder="99"
                  min="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pageCount">Page Count</Label>
                <Input
                  id="pageCount"
                  type="number"
                  value={pageCount}
                  onChange={(e) => setPageCount(e.target.value)}
                  placeholder="25"
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="thumbnailPage" className="flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5" />
                  Thumbnail Page
                </Label>
                <Input
                  id="thumbnailPage"
                  type="number"
                  value={thumbnailPage}
                  onChange={(e) => setThumbnailPage(e.target.value)}
                  placeholder="1"
                  min="1"
                />
                <p className="text-xs text-muted-foreground">
                  Which page to show as thumbnail (default: 1)
                </p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Class *</Label>
                <Select value={classId} onValueChange={setClassId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
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

              <div className="space-y-2">
                <Label>Subject *</Label>
                <Select value={subjectId} onValueChange={setSubjectId} disabled={!classId}>
                  <SelectTrigger>
                    <SelectValue placeholder={classId ? 'Select subject' : 'Select class first'} />
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Chapter *</Label>
                <Select value={chapterId} onValueChange={setChapterId} disabled={!subjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder={subjectId ? 'Select chapter' : 'Select subject first'} />
                  </SelectTrigger>
                  <SelectContent>
                    {chapters.map((ch) => (
                      <SelectItem key={ch.id} value={ch.id}>
                        {ch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Topic *</Label>
                <Select value={topicId} onValueChange={setTopicId} disabled={!chapterId}>
                  <SelectTrigger>
                    <SelectValue placeholder={chapterId ? 'Select topic' : 'Select chapter first'} />
                  </SelectTrigger>
                  <SelectContent>
                    {topics.map((tp) => (
                      <SelectItem key={tp.id} value={tp.id}>
                        {tp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Note Type</Label>
              <Select value={noteTypeId} onValueChange={setNoteTypeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select note type" />
                </SelectTrigger>
                <SelectContent>
                  {noteTypes.map((nt) => (
                    <SelectItem key={nt.id} value={nt.id}>
                      {nt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="previewFileUrl">Preview File URL (Google Drive)</Label>
              <Input
                id="previewFileUrl"
                type="url"
                value={previewFileUrl}
                onChange={(e) => setPreviewFileUrl(e.target.value)}
                placeholder="https://drive.google.com/file/d/.../view"
              />
              <p className="text-xs text-muted-foreground">Google Drive share link for the preview PDF (2-page watermarked version)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullFileUrl">Full File URL (Google Drive) *</Label>
              <Input
                id="fullFileUrl"
                type="url"
                value={fullFileUrl}
                onChange={(e) => setFullFileUrl(e.target.value)}
                placeholder="https://drive.google.com/file/d/.../view"
              />
              <p className="text-xs text-muted-foreground">Google Drive share link for the full PDF that buyers will download</p>
            </div>

            <Separator />

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Featured</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Published</span>
              </label>
            </div>

            {uploadResult && (
              <div
                className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                  uploadResult.success
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                    : 'bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-300'
                }`}
              >
                {uploadResult.success ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                {uploadResult.message}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={isUploading || isRenderingThumb}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : isRenderingThumb ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Rendering thumbnail...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Publish PDF
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ========== Manage PDFs Tab ==========
function ManagePdfsTab() {
  const [pdfs, setPdfs] = useState<AdminPdf[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fetchPdfs = useCallback(() => {
    setIsLoading(true)
    fetch('/api/admin/pdfs')
      .then((r) => r.json())
      .then(setPdfs)
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    fetchPdfs()
  }, [fetchPdfs])

  const handleDelete = async (id: string) => {
    setDeleteId(id)
    try {
      const res = await fetch(`/api/admin/pdfs/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setPdfs((prev) => prev.filter((p) => p.id !== id))
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

  if (isLoading) {
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
              All PDFs ({pdfs.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pdfs.length > 0 ? (
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
          ) : (
            <p className="text-center text-muted-foreground py-8">No PDFs uploaded yet</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ========== Note Types Tab ==========
function NoteTypesTab() {
  const [noteTypes, setNoteTypes] = useState<NoteTypeData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const fetchNoteTypes = useCallback(() => {
    setIsLoading(true)
    fetch('/api/admin/note-types')
      .then((r) => r.json())
      .then(setNoteTypes)
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    fetchNoteTypes()
  }, [fetchNoteTypes])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return

    setIsCreating(true)
    setError('')
    try {
      const slug = newName.trim().toLowerCase().replace(/\s+/g, '-')
      const res = await fetch('/api/admin/note-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), slug }),
      })
      const data = await res.json()
      if (res.ok) {
        setNewName('')
        fetchNoteTypes()
      } else {
        setError(data.error || 'Failed to add note type')
      }
    } catch {
      setError('Failed to add note type')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeleteId(id)
    try {
      const res = await fetch(`/api/admin/note-types/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setNoteTypes((prev) => prev.filter((nt) => nt.id !== id))
      }
    } catch (error) {
      console.error('Error deleting note type:', error)
    } finally {
      setDeleteId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-emerald-600" />
            Add Note Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="flex items-end gap-3">
            <div className="flex-1 space-y-2">
              <Label htmlFor="note-type-name">Name</Label>
              <Input
                id="note-type-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., Handwritten, Printed"
              />
            </div>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={isCreating || !newName.trim()}
            >
              {isCreating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Add Note Type'
              )}
            </Button>
          </form>
          {error && (
            <p className="text-sm text-destructive flex items-center gap-1 mt-3">
              <AlertCircle className="w-4 h-4" />
              {error}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-emerald-600" />
            All Note Types ({noteTypes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {noteTypes.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {noteTypes.map((nt) => (
                    <TableRow key={nt.id}>
                      <TableCell className="font-medium">{nt.name}</TableCell>
                      <TableCell className="text-muted-foreground">{nt.slug}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(nt.id)}
                          disabled={deleteId === nt.id}
                        >
                          {deleteId === nt.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No note types yet</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ========== Orders Tab ==========
function OrdersTab() {
  const [orders, setOrders] = useState<OrderData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/orders')
      .then((r) => r.json())
      .then(setOrders)
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
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
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-emerald-600" />
            All Orders ({orders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PDF</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {order.pdf.title}
                      </TableCell>
                      <TableCell>₹{order.amount}</TableCell>
                      <TableCell>
                        <Badge
                          variant={order.status === 'paid' ? 'default' : 'secondary'}
                          className={
                            order.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                              : order.status === 'failed'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                              : ''
                          }
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {order.buyerEmail || '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No orders yet</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
