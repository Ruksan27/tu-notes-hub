import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

export const revalidate = 3600 // Caches sitemap dynamically for 1 hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tunoteshub.com'

  // 1. Static Pages
  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 1.0 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${baseUrl}/faculties`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${baseUrl}/pricing`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: `${baseUrl}/projects`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.9 },
  ]

  // 2. Dynamic Faculty Routes
  const faculties = await prisma.faculty.findMany({
    select: { id: true }
  })
  const facultyRoutes = faculties.map((fac) => ({
    url: `${baseUrl}/faculty/${fac.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // 3. Dynamic Semester Routes
  const semesters = await prisma.semester.findMany({
    select: { order: true, facultyId: true }
  })
  const semesterRoutes = semesters.map((sem) => ({
    url: `${baseUrl}/faculty/${sem.facultyId}/${sem.order}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // 4. Dynamic Project Marketplace Items
  const activeProjects = await prisma.projectItem.findMany({
    where: { status: 'APPROVED' },
    select: { id: true, createdAt: true }
  })
  const projectRoutes = activeProjects.map((project) => ({
    url: `${baseUrl}/projects/${project.id}`,
    lastModified: new Date(project.createdAt),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [
    ...staticPages,
    ...facultyRoutes,
    ...semesterRoutes,
    ...projectRoutes
  ]
}
