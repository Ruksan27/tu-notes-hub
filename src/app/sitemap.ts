import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { getProjectSlug, getNoteSlug, getPaperSlug } from '@/lib/slugs'

// Revalidate sitemap every 1 hour via ISR
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tunoteshub.com'

  // 1. High-priority static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/projects`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/faculties`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/pricing`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    // Trust & Policy Pages
    { url: `${baseUrl}/buyer-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.5 },
    { url: `${baseUrl}/seller-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.5 },
    { url: `${baseUrl}/refund-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.5 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.4 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.4 },
  ]

  // 2. Dynamic Faculty Routes
  const faculties = await prisma.faculty.findMany({
    where: { visible: true },
    select: { id: true },
  })
  const facultyRoutes: MetadataRoute.Sitemap = faculties.map((fac) => ({
    url: `${baseUrl}/faculty/${fac.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  // 3. Dynamic Semester & Year Routes (SEO Friendly URLs)
  const semesters = await prisma.semester.findMany({
    where: { faculty: { visible: true } },
    select: {
      order: true,
      facultyId: true,
      faculty: { select: { systemType: true } }
    },
  })
  const semesterRoutes: MetadataRoute.Sitemap = semesters.map((sem) => {
    const isYearly = sem.faculty?.systemType === 'YEARLY'
    const ord = sem.order === 1 ? '1st' : sem.order === 2 ? '2nd' : sem.order === 3 ? '3rd' : `${sem.order}th`
    const periodSlug = isYearly ? `${ord}-year` : `${ord}-semester`
    return {
      url: `${baseUrl}/faculty/${sem.facultyId}/${periodSlug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    }
  })

  // 4. Dynamic Project Marketplace Items (APPROVED only — no draft/rejected/pending)
  const activeProjects = await prisma.projectItem.findMany({
    where: { status: 'APPROVED' },
    select: { id: true, title: true, createdAt: true },
  })
  const projectRoutes: MetadataRoute.Sitemap = activeProjects.map((project) => ({
    url: `${baseUrl}/projects/${getProjectSlug(project)}`,
    lastModified: project.createdAt,
    changeFrequency: 'weekly',
    priority: 0.85,
  }))

  // 5. Dynamic Notes & Study Guides
  const allNotes = await prisma.note.findMany({
    select: { id: true, title: true, createdAt: true },
  })
  const noteRoutes: MetadataRoute.Sitemap = allNotes.map((note) => ({
    url: `${baseUrl}/download/${getNoteSlug(note)}`,
    lastModified: note.createdAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  // 6. Dynamic Past Question Papers
  const allPapers = await prisma.pastPaper.findMany({
    select: { id: true, year: true, examType: true, subject: { select: { title: true, code: true } } },
  })
  const paperRoutes: MetadataRoute.Sitemap = allPapers.map((paper) => ({
    url: `${baseUrl}/download/${getPaperSlug(paper)}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  return [
    ...staticPages,
    ...facultyRoutes,
    ...semesterRoutes,
    ...projectRoutes,
    ...noteRoutes,
    ...paperRoutes,
  ]
}
