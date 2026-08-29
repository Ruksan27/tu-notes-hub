import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import type { Metadata } from 'next'
import ProjectDetailClient from './ProjectDetailClient'

// We revalidate this page every 1 hour (ISR)
export const revalidate = 3600

// Dynamically generate static paths for the projects to make them load instantly
export async function generateStaticParams() {
  const activeProjects = await prisma.projectItem.findMany({
    where: { status: 'APPROVED' },
    select: { id: true },
    take: 20 // Pre-render top 20 projects to save build time, rest will be lazy-rendered on-demand
  })
  return activeProjects.map((project) => ({
    id: project.id,
  }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const project = await prisma.projectItem.findUnique({ where: { id }, select: { title: true, shortDescription: true } })
  return {
    title: project ? `${project.title} — TU Notes Hub Projects` : 'Project',
    description: project?.shortDescription || 'Buy verified student projects on TU Notes Hub.',
  }
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const project = await prisma.projectItem.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          sellerProfile: { select: { isVerified: true } },
        }
      }
    }
  })

  if (!project || project.status === 'REJECTED') {
    notFound()
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

  return <ProjectDetailClient project={serialized} />
}
