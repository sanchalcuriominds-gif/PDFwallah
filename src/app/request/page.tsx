'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Send, CheckCircle, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function RequestPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    notes: '',
    examClass: '',
  })
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitted(true)
  }

  if (isSubmitted) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs items={[{ label: 'Request Notes' }]} />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md mx-auto mt-16 text-center space-y-4"
        >
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold">Request Submitted!</h2>
          <p className="text-muted-foreground">
            We&apos;ll notify you when these notes are available!
          </p>
          <Button
            onClick={() => {
              setIsSubmitted(false)
              setFormData({ name: '', email: '', notes: '', examClass: '' })
            }}
            variant="outline"
            className="mt-4"
          >
            Submit Another Request
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs items={[{ label: 'Request Notes' }]} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg mx-auto mt-8"
      >
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mb-2">
              <BookOpen className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <CardTitle className="text-2xl">Request Notes</CardTitle>
            <CardDescription>
              Can&apos;t find what you need? Let us know and we&apos;ll try to add it!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="examClass">Class / Exam</Label>
                <Select
                  value={formData.examClass}
                  onValueChange={(value) => setFormData({ ...formData, examClass: value })}
                  required
                >
                  <SelectTrigger id="examClass">
                    <SelectValue placeholder="Select class or exam" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="class-9">Class 9</SelectItem>
                    <SelectItem value="class-10">Class 10</SelectItem>
                    <SelectItem value="class-11">Class 11</SelectItem>
                    <SelectItem value="class-12">Class 12</SelectItem>
                    <SelectItem value="jee">JEE</SelectItem>
                    <SelectItem value="neet">NEET</SelectItem>
                    <SelectItem value="cuet">CUET</SelectItem>
                    <SelectItem value="reet">REET</SelectItem>
                    <SelectItem value="ssc">SSC</SelectItem>
                    <SelectItem value="railway">Railway</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">What notes do you need?</Label>
                <Textarea
                  id="notes"
                  placeholder="E.g., Class 10 Maths Chapter 3 notes, NEET Biology PYQs..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2"
              >
                <Send className="w-4 h-4" />
                Submit Request
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
