import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import type { Metadata } from 'next'
import Script from 'next/script'
import ProjectDetailClient from './ProjectDetailClient'
import { extractProjectId, getProjectSlug, slugify } from '@/lib/slugs'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://tunoteshub.com'

// ISR: revalidate every 1 hour
export const revalidate = 3600

async function fetchProjectBySlugOrId(rawId: string) {
  const targetId = extractProjectId(rawId)
  let project = await prisma.projectItem.findUnique({
    where: { id: targetId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          sellerProfile: { select: { isVerified: true } },
        },
      },
    },
  })

  if (!project) {
    const all = await prisma.projectItem.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            sellerProfile: { select: { isVerified: true } },
          },
        },
      },
    })
    project = all.find(p => getProjectSlug(p) === rawId || slugify(p.title) === rawId) || null
  }

  return project
}

// Pre-render top 20 projects at build time; rest rendered on demand
export async function generateStaticParams() {
  const activeProjects = await prisma.projectItem.findMany({
    where: { status: 'APPROVED' },
    select: { id: true, title: true },
    take: 20,
  })
  const params: { id: string }[] = []
  for (const p of activeProjects) {
    params.push({ id: getProjectSlug(p) })
    params.push({ id: p.id })
  }
  return params
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id: rawId } = await params
  const project = await fetchProjectBySlugOrId(rawId)

  if (!project) {
    return { title: 'Project Not Found | TU Notes Hub' }
  }

  const finalPrice = Math.floor(project.originalPrice * (1 - project.discountPercentage / 100))
  const description = project.shortDescription || project.description?.slice(0, 160) || 'Buy verified student projects on TU Notes Hub.'
  const ogImage = project.thumbnailUrl || `${BASE_URL}/og-image.png`
  const canonicalSlug = getProjectSlug(project)
  const url = `${BASE_URL}/projects/${canonicalSlug}`

  return {
    title: `${project.title} | Buy Project — TU Notes Hub`,
    description,
    keywords: [
      project.title,
      project.category || '',
      ...project.technologies.split(',').map((t) => t.trim()),
      'student project Nepal',
      'TU project',
      'source code Nepal',
      'buy project Nepal',
    ].filter(Boolean),
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      title: `${project.title} — Buy Project with Source Code`,
      description,
      siteName: 'TU Notes Hub',
      images: [{ url: ogImage, width: 1200, height: 630, alt: project.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${project.title} — Rs. ${finalPrice} | TU Notes Hub`,
      description,
      images: [ogImage],
      site: '@tunoteshub',
    },
  }
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params
  const project = await fetchProjectBySlugOrId(rawId)

  if (!project || project.status === 'REJECTED') {
    notFound()
  }

  const finalPrice = Math.floor(project.originalPrice * (1 - project.discountPercentage / 100))
  const canonicalSlug = getProjectSlug(project)

  // JSON-LD Structured Data (Product schema for Google rich results)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: project.title,
    description: project.shortDescription || project.description,
    image: project.thumbnailUrl || `${BASE_URL}/og-image.png`,
    url: `${BASE_URL}/projects/${canonicalSlug}`,
    brand: {
      '@type': 'Organization',
      name: 'TU Notes Hub',
    },
    offers: {
      '@type': 'Offer',
      price: finalPrice,
      priceCurrency: 'NPR',
      availability: 'https://schema.org/InStock',
      url: `${BASE_URL}/projects/${canonicalSlug}`,
      seller: {
        '@type': 'Organization',
        name: 'TU Notes Hub',
      },
    },
    aggregateRating: project.reviewCount > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: project.rating.toFixed(1),
      reviewCount: project.reviewCount,
      bestRating: '5',
      worstRating: '1',
    } : undefined,
  }

  // Serialize for client component
  const serialized = {
    id: project.id,
    title: project.title,
    shortDescription: project.shortDescription,
    description: project.description,
    category: project.category,
    subcategory: project.subcategory ?? null,
    projectType: project.projectType,
    features: project.features,
    modules: project.modules,
    technologies: project.technologies,
    frontend: project.frontend ?? null,
    backend: project.backend ?? null,
    dbType: project.dbType ?? null,
    framework: project.framework ?? null,
    libraries: project.libraries ?? null,
    originalPrice: project.originalPrice,
    discountPercentage: project.discountPercentage,
    license: project.license,
    salesType: project.salesType,
    thumbnailUrl: project.thumbnailUrl ?? null,
    screenshot1: project.screenshot1 ?? null,
    screenshot2: project.screenshot2 ?? null,
    screenshot3: project.screenshot3 ?? null,
    screenshot4: project.screenshot4 ?? null,
    demoUrl: project.demoUrl ?? null,
    youtubeUrl: project.youtubeUrl ?? null,
    tiktokUrl: project.tiktokUrl ?? null,
    githubUrl: project.githubUrl ?? null,
    status: project.status,
    rating: project.rating,
    reviewCount: project.reviewCount,
    sellerId: project.sellerId,
    user: project.user ? {
      id: project.user.id,
      name: project.user.name,
      sellerProfile: project.user.sellerProfile ? { isVerified: project.user.sellerProfile.isVerified } : null,
    } : null,
  }

  return (
    <>
      {/* JSON-LD Structured Data for Google */}
      <Script
        id="project-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProjectDetailClient project={serialized} />
    </>
  )
}

