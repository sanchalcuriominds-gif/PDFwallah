'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Tag,
  Loader2,
  AlertCircle,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { NoteTypeData } from './types'

export function NoteTypesTab() {
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
    if (!confirm('Are you sure you want to delete this note type?')) return
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
