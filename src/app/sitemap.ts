import { MetadataRoute } from 'next'

const SITE_URL = 'https://pdfwallah.in'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE_URL}/school`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/competitive`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/search`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/request`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ]

  try {
    // Fetch data via internal API routes (more reliable than direct DB)
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_SITE_URL || SITE_URL

    const [classesRes, subjectsRes, chaptersRes, pdfsRes] = await Promise.all([
      fetch(`${baseUrl}/api/classes`, { next: { revalidate: 3600 } }).catch(() => null),
      fetch(`${baseUrl}/api/subjects`, { next: { revalidate: 3600 } }).catch(() => null),
      fetch(`${baseUrl}/api/chapters`, { next: { revalidate: 3600 } }).catch(() => null),
      fetch(`${baseUrl}/api/pdfs?limit=1000`, { next: { revalidate: 3600 } }).catch(() => null),
    ])

    const classesData = classesRes ? await classesRes.json().catch(() => []) : []
    const subjectsData = subjectsRes ? await subjectsRes.json().catch(() => []) : []
    const chaptersData = chaptersRes ? await chaptersRes.json().catch(() => []) : []
    const pdfsData = pdfsRes ? await pdfsRes.json().catch(() => ({ pdfs: [] })) : { pdfs: [] }

    // Class pages
    const classPages: MetadataRoute.Sitemap = (Array.isArray(classesData) ? classesData : []).map((cls: any) => ({
      url: `${SITE_URL}/class/${cls.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

    // Subject pages
    const subjectPages: MetadataRoute.Sitemap = (Array.isArray(subjectsData) ? subjectsData : []).map((subj: any) => ({
      url: `${SITE_URL}/class/${subj.class?.slug}/subject/${subj.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    // Chapter pages
    const chapterPages: MetadataRoute.Sitemap = (Array.isArray(chaptersData) ? chaptersData : []).map((ch: any) => ({
      url: `${SITE_URL}/class/${ch.subject?.class?.slug}/subject/${ch.subject?.slug}/chapter/${ch.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))

    // PDF pages
    const pdfs = pdfsData.pdfs || []
    const pdfPages: MetadataRoute.Sitemap = pdfs.map((pdf: any) => ({
      url: `${SITE_URL}/pdf/${pdf.id}`,
      lastModified: new Date(pdf.updatedAt || pdf.createdAt || now),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }))

    return [...staticPages, ...classPages, ...subjectPages, ...chapterPages, ...pdfPages]
  } catch (error) {
    console.error('Error generating sitemap:', error)
    return staticPages
  }
}
