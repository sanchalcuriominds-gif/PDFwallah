import { db } from '@/lib/db'
import { HomeClient } from '@/components/home/home-client'

// Force dynamic rendering — data is fetched on each request (cached at edge)
// This avoids build-time DB queries which require the production DB schema to be migrated first
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  // Fetch all data in parallel directly from the database
  const [classes, competitiveClasses, featuredPdfs, popularPdfs] = await Promise.all([
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
    db.class.findMany({
      where: { type: 'competitive' },
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
      where: { published: true, featured: true },
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
      where: { published: true },
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
  const plainCompetitiveClasses = JSON.parse(JSON.stringify(competitiveClasses))
  const plainFeaturedPdfs = JSON.parse(JSON.stringify(featuredPdfs))
  const plainPopularPdfs = JSON.parse(JSON.stringify(popularPdfs))

  return (
    <HomeClient
      classes={plainClasses}
      competitiveClasses={plainCompetitiveClasses}
      featuredPdfs={plainFeaturedPdfs}
      popularPdfs={plainPopularPdfs}
    />
  )
}
