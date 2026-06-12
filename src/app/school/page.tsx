import { db } from '@/lib/db'
import { SchoolClient } from '@/components/school/school-client'

export const dynamic = 'force-dynamic'

export default async function SchoolPage() {
  const [classes, featuredPdfs, popularPdfs] = await Promise.all([
    db.class.findMany({
      where: { type: 'school' },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        _count: { select: { subjects: true, pdfs: true } },
      },
    }),
    db.pdf.findMany({
      where: { published: true, featured: true, class: { type: 'school' } },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        mrp: true,
        pageCount: true,
        salesCount: true,
        downloadCount: true,
        featured: true,
        thumbnailPath: true,
        noteTypeId: true,
        createdAt: true,
        class: { select: { name: true, slug: true } },
        subject: { select: { name: true, slug: true } },
        chapter: { select: { name: true, slug: true } },
        topic: { select: { name: true, slug: true } },
        noteType: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 4,
    }),
    db.pdf.findMany({
      where: { published: true, class: { type: 'school' } },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        mrp: true,
        pageCount: true,
        salesCount: true,
        downloadCount: true,
        featured: true,
        thumbnailPath: true,
        noteTypeId: true,
        createdAt: true,
        class: { select: { name: true, slug: true } },
        subject: { select: { name: true, slug: true } },
        chapter: { select: { name: true, slug: true } },
        topic: { select: { name: true, slug: true } },
        noteType: { select: { name: true, slug: true } },
      },
      orderBy: { salesCount: 'desc' },
      take: 4,
    }),
  ])

  // Convert Prisma Proxy objects to plain objects so _count survives RSC serialization
  const plainClasses = JSON.parse(JSON.stringify(classes))
  const plainFeaturedPdfs = JSON.parse(JSON.stringify(featuredPdfs))
  const plainPopularPdfs = JSON.parse(JSON.stringify(popularPdfs))

  return (
    <SchoolClient
      classes={plainClasses}
      featuredPdfs={plainFeaturedPdfs}
      popularPdfs={plainPopularPdfs}
    />
  )
}
