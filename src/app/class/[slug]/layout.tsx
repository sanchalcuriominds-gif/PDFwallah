import { Metadata } from 'next'
import { db } from '@/lib/db'

const SITE_URL = 'https://pdfwallah.in'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params

  try {
    const currentClass = await db.class.findUnique({ where: { slug } })

    if (!currentClass) {
      return { title: 'Class Not Found' }
    }

    const className = currentClass.name
    const seoTitle = `${className} Notes PDF Download — All Subjects`
    const seoDescription = `Download ${className} Notes PDF for all subjects. Handwritten notes, PYQs, formula sheets & revision material. Instant download, no login required.`

    return {
      title: seoTitle,
      description: seoDescription,
      keywords: [
        `${className} notes PDF`, `${className} handwritten notes`, `${className} PYQ PDF`,
        `${className} formula sheet`, `${className} revision notes`, `download ${className} notes`,
        `${className} all subjects notes PDF`, `${className} CBSE notes`,
      ],
      openGraph: {
        title: seoTitle,
        description: seoDescription,
        url: `${SITE_URL}/class/${slug}`,
        type: 'website',
        locale: 'en_IN',
        siteName: 'PDFWallah',
      },
      alternates: {
        canonical: `${SITE_URL}/class/${slug}`,
      },
    }
  } catch {
    return { title: 'Class Notes PDF' }
  }
}

export default function ClassLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
