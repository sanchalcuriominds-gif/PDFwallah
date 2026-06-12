'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Upload,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ClassData, SubjectData, ChapterData, TopicData, NoteTypeData } from './types'

interface UploadTabProps {
  onUploaded: () => void
}

export function UploadTab({ onUploaded }: UploadTabProps) {
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
        // If thumbnail page is specified, render that page server-side as custom thumbnail
        const thumbPage = parseInt(thumbnailPage) || 1
        const sourceUrl = fullFileUrl || previewFileUrl
        if (thumbPage > 1 && sourceUrl) {
          try {
            setIsRenderingThumb(true)
            setUploadResult({ success: true, message: 'PDF created! Rendering custom thumbnail (page ' + thumbPage + ')...' })

            // Client-side rendering using PDF.js from CDN + our server-side proxy
            const { renderPdfPageToBlob } = await import('@/lib/pdf-renderer')
            const proxyUrl = `/api/admin/proxy-pdf?url=${encodeURIComponent(sourceUrl)}`
            const blob = await renderPdfPageToBlob(proxyUrl, thumbPage, 2)

            // Upload the rendered thumbnail
            const thumbFormData = new FormData()
            thumbFormData.append('thumbnail', blob, 'thumbnail.png')
            thumbFormData.append('pdfId', data.id)

            const thumbRes = await fetch('/api/admin/upload-thumbnail', {
              method: 'POST',
              body: thumbFormData,
            })

            const thumbData = await thumbRes.json()
            if (thumbRes.ok && thumbData.success) {
              setUploadResult({ success: true, message: 'PDF uploaded with custom thumbnail (page ' + thumbPage + ')!' })
            } else {
              setUploadResult({ success: true, message: 'PDF uploaded! (Thumbnail upload failed: ' + (thumbData.error || 'Unknown error') + '. Default page 1 used.)' })
            }
          } catch (thumbError) {
            console.error('Thumbnail rendering failed:', thumbError)
            const errMsg = thumbError instanceof Error ? thumbError.message : 'Unknown error'
            setUploadResult({ success: true, message: `PDF uploaded! (Thumbnail rendering failed: ${errMsg}. Default page 1 used.)` })
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
