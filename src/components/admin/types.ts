// Shared types for admin components

export interface AdminStats {
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

export interface ClassData {
  id: string
  name: string
  slug: string
  type?: 'school' | 'competitive'
}

export interface SubjectData {
  id: string
  name: string
  slug: string
  classId: string
}

export interface ChapterData {
  id: string
  name: string
  slug: string
  subjectId: string
}

export interface TopicData {
  id: string
  name: string
  slug: string
  chapterId: string
}

export interface NoteTypeData {
  id: string
  name: string
  slug: string
}

export interface AdminPdf {
  id: string
  title: string
  price: number
  mrp: number | null
  pageCount: number
  salesCount: number
  featured: boolean
  published: boolean
  createdAt: string
  class: { name: string; id: string }
  subject: { name: string; id: string }
}

export interface OrderData {
  id: string
  amount: number
  currency: string
  status: string
  buyerEmail: string | null
  buyerPhone: string | null
  createdAt: string
  pdf: { title: string; price: number }
}
