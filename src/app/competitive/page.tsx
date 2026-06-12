import { db } from '@/lib/db'
import { CompetitiveClient } from '@/components/competitive/competitive-client'

export const dynamic = 'force-dynamic'

export default async function CompetitivePage() {
  const [competitiveClasses, featuredPdfs] = await Promise.all([
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
      where: {
        published: true,
        featured: true,
        class: { type: 'competitive' },
      },
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
  ])

  // Convert Prisma Proxy objects to plain objects so _count survives RSC serialization
  const plainCompetitiveClasses = JSON.parse(JSON.stringify(competitiveClasses))
  const plainFeaturedPdfs = JSON.parse(JSON.stringify(featuredPdfs))

  return (
    <CompetitiveClient
      competitiveClasses={plainCompetitiveClasses}
      featuredPdfs={plainFeaturedPdfs}
    />
  )
}
