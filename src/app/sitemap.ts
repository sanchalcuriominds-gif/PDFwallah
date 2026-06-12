import { MetadataRoute } from 'next'
import { db } from '@/lib/db'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdfwallah.in'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE_URL}/school`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/competitive`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/search`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/request`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/recover`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
  ]

  try {
    // Fetch all data directly from the database (more reliable than API routes at build time)
    const classes = await db.class.findMany({ orderBy: { name: 'asc' } })
    const subjects = await db.subject.findMany({
      include: { class: true },
      orderBy: { name: 'asc' },
    })
    const chapters = await db.chapter.findMany({
      include: { subject: { include: { class: true } } },
      orderBy: { name: 'asc' },
    })
    const topics = await db.topic.findMany({
      include: { chapter: { include: { subject: { include: { class: true } } } } },
      orderBy: { name: 'asc' },
    })
    const pdfs = await db.pdf.findMany({
      where: { published: true },
      select: {
        id: true,
        updatedAt: true,
        createdAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    })

    // Class pages: /class/{slug}
    const classPages: MetadataRoute.Sitemap = classes.map((cls: any) => ({
      url: `${SITE_URL}/class/${cls.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

    // Subject pages: /class/{classSlug}/subject/{subjectSlug}
    const subjectPages: MetadataRoute.Sitemap = subjects.map((subj: any) => ({
      url: `${SITE_URL}/class/${subj.class?.slug}/subject/${subj.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    // Chapter pages: /class/{classSlug}/subject/{subjectSlug}/chapter/{chapterSlug}
    const chapterPages: MetadataRoute.Sitemap = chapters.map((ch: any) => ({
      url: `${SITE_URL}/class/${ch.subject?.class?.slug}/subject/${ch.subject?.slug}/chapter/${ch.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))

    // Topic pages: /class/{classSlug}/subject/{subjectSlug}/chapter/{chapterSlug}/topic/{topicSlug}
    const topicPages: MetadataRoute.Sitemap = topics.map((topic: any) => ({
      url: `${SITE_URL}/class/${topic.chapter?.subject?.class?.slug}/subject/${topic.chapter?.subject?.slug}/chapter/${topic.chapter?.slug}/topic/${topic.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    }))

    // PDF pages: /pdf/{id}
    const pdfPages: MetadataRoute.Sitemap = pdfs.map((pdf: any) => ({
      url: `${SITE_URL}/pdf/${pdf.id}`,
      lastModified: new Date(pdf.updatedAt || pdf.createdAt || now),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }))

    return [...staticPages, ...classPages, ...subjectPages, ...chapterPages, ...topicPages, ...pdfPages]
  } catch (error) {
    console.error('Error generating dynamic sitemap:', error)
    // Return at least the static pages if DB fails
    return staticPages
  }
}
