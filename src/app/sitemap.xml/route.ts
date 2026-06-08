import { NextResponse } from 'next/server'

const SITE_URL = 'https://pdfwallah.in'

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0] // YYYY-MM-DD
}

function buildUrlEntry(url: string, lastmod: string, changefreq: string, priority: number): string {
  return `  <url>
    <loc>${escapeXml(url)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority.toFixed(1)}</priority>
  </url>`
}

export async function GET() {
  const today = formatDate(new Date())
  const urls: string[] = []

  // ─── Static pages ───
  urls.push(buildUrlEntry(SITE_URL, today, 'daily', 1.0))
  urls.push(buildUrlEntry(`${SITE_URL}/school`, today, 'weekly', 0.9))
  urls.push(buildUrlEntry(`${SITE_URL}/competitive`, today, 'weekly', 0.9))
  urls.push(buildUrlEntry(`${SITE_URL}/search`, today, 'daily', 0.8))
  urls.push(buildUrlEntry(`${SITE_URL}/request`, today, 'monthly', 0.6))

  // ─── Dynamic pages from database ───
  try {
    const { db } = await import('@/lib/db')

    // Classes
    try {
      const classes = await db.class.findMany({ orderBy: { name: 'asc' } })
      for (const cls of classes) {
        urls.push(buildUrlEntry(
          `${SITE_URL}/class/${cls.slug}`,
          today, 'weekly', 0.8
        ))
      }
    } catch (e) {
      console.error('Sitemap: Error fetching classes:', e)
    }

    // Subjects
    try {
      const subjects = await db.subject.findMany({
        include: { class: true },
        orderBy: { name: 'asc' },
      })
      for (const subj of subjects) {
        const classSlug = (subj as any).class?.slug
        if (classSlug) {
          urls.push(buildUrlEntry(
            `${SITE_URL}/class/${classSlug}/subject/${subj.slug}`,
            today, 'weekly', 0.7
          ))
        }
      }
    } catch (e) {
      console.error('Sitemap: Error fetching subjects:', e)
    }

    // Chapters
    try {
      const chapters = await db.chapter.findMany({
        include: { subject: { include: { class: true } } },
        orderBy: { name: 'asc' },
      })
      for (const ch of chapters) {
        const classSlug = (ch as any).subject?.class?.slug
        const subjectSlug = (ch as any).subject?.slug
        if (classSlug && subjectSlug) {
          urls.push(buildUrlEntry(
            `${SITE_URL}/class/${classSlug}/subject/${subjectSlug}/chapter/${ch.slug}`,
            today, 'weekly', 0.6
          ))
        }
      }
    } catch (e) {
      console.error('Sitemap: Error fetching chapters:', e)
    }

    // Topics
    try {
      const topics = await db.topic.findMany({
        include: { chapter: { include: { subject: { include: { class: true } } } } },
        orderBy: { name: 'asc' },
      })
      for (const topic of topics) {
        const classSlug = (topic as any).chapter?.subject?.class?.slug
        const subjectSlug = (topic as any).chapter?.subject?.slug
        const chapterSlug = (topic as any).chapter?.slug
        if (classSlug && subjectSlug && chapterSlug) {
          urls.push(buildUrlEntry(
            `${SITE_URL}/class/${classSlug}/subject/${subjectSlug}/chapter/${chapterSlug}/topic/${topic.slug}`,
            today, 'weekly', 0.5
          ))
        }
      }
    } catch (e) {
      console.error('Sitemap: Error fetching topics:', e)
    }

    // Published PDFs
    try {
      const pdfs = await db.pdf.findMany({
        where: { published: true },
        select: { id: true, updatedAt: true, createdAt: true },
        orderBy: { updatedAt: 'desc' },
      })
      for (const pdf of pdfs) {
        const lastmod = formatDate(new Date((pdf as any).updatedAt || (pdf as any).createdAt || new Date()))
        urls.push(buildUrlEntry(
          `${SITE_URL}/pdf/${pdf.id}`,
          lastmod, 'monthly', 0.7
        ))
      }
    } catch (e) {
      console.error('Sitemap: Error fetching PDFs:', e)
    }
  } catch (e) {
    console.error('Sitemap: Could not import db, using static pages only:', e)
  }

  // ─── Build valid XML ───
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}

// Force dynamic rendering — never cache as a static file
export const dynamic = 'force-dynamic'
