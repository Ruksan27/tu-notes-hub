import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { getProjectSlug, getNoteSlug, getPaperSlug, getSemesterPath, slugify } from '@/lib/slugs'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tunoteshub.me'

  // 1. Static Pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/faculties`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/projects`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  // 2. Dynamic Faculty & Semester Pages
  const faculties = await prisma.faculty.findMany({
    include: {
      semesters: {
        select: { order: true },
      },
    },
  })

  const facultyRoutes: MetadataRoute.Sitemap = []

  faculties.forEach((fac) => {
    // Faculty page
    facultyRoutes.push({
      url: `${baseUrl}/faculty/${fac.id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    })

    // Semester pages
    fac.semesters.forEach((sem) => {
      const isYearly = fac.systemType === 'YEARLY'
      const ordStr = sem.order === 1 ? '1st' : sem.order === 2 ? '2nd' : sem.order === 3 ? '3rd' : `${sem.order}th`
      const slug = isYearly ? `${ordStr}-year` : `${ordStr}-semester`
      facultyRoutes.push({
        url: `${baseUrl}/faculty/${fac.id}/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.9,
      })
    })
  })

  // 3. Dynamic Projects
  const projects = await prisma.projectItem.findMany({
    select: { id: true, title: true, createdAt: true },
  })
  const projectRoutes: MetadataRoute.Sitemap = projects.map((p) => ({
    url: `${baseUrl}/projects/${getProjectSlug(p)}`,
    lastModified: p.createdAt,
    changeFrequency: 'weekly',
    priority: 0.85,
  }))

  // 4. Dynamic Notes & Study Guides
  const allNotes = await prisma.note.findMany({
    select: {
      id: true,
      title: true,
      createdAt: true,
      subject: {
        select: {
          title: true,
          code: true,
          semester: {
            select: {
              order: true,
              facultyId: true,
              faculty: { select: { id: true, systemType: true } },
            },
          },
        },
      },
    },
  })

  const noteRoutes: MetadataRoute.Sitemap = allNotes.map((note) => {
    const semPath = getSemesterPath(
      note.subject?.semester?.facultyId || note.subject?.semester?.faculty?.id,
      note.subject?.semester?.order,
      note.subject?.semester?.faculty?.systemType
    )
    const base = semPath ? `${baseUrl}${semPath}` : `${baseUrl}/note`
    return {
      url: `${base}/${getNoteSlug(note)}`,
      lastModified: note.createdAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    }
  })

  // 5. Dynamic Past Question Papers
  const allPapers = await prisma.pastPaper.findMany({
    select: {
      id: true,
      year: true,
      examType: true,
      subject: {
        select: {
          title: true,
          code: true,
          semester: {
            select: {
              order: true,
              facultyId: true,
              faculty: { select: { id: true, systemType: true } },
            },
          },
        },
      },
    },
  })

  const paperRoutes: MetadataRoute.Sitemap = allPapers.map((paper) => {
    const semPath = getSemesterPath(
      paper.subject?.semester?.facultyId || paper.subject?.semester?.faculty?.id,
      paper.subject?.semester?.order,
      paper.subject?.semester?.faculty?.systemType
    )
    const base = semPath ? `${baseUrl}${semPath}` : `${baseUrl}/paper`
    return {
      url: `${base}/${getPaperSlug(paper)}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    }
  })

  // 5.5. Dynamic MCQ Practice Pages
  const subjectsWithMcqs = await prisma.subject.findMany({
    where: { mcqs: { some: {} } },
    select: {
      id: true,
      title: true,
      code: true,
      semester: {
        select: {
          order: true,
          facultyId: true,
          faculty: { select: { id: true, systemType: true } },
        },
      },
    },
  })

  const mcqRoutes: MetadataRoute.Sitemap = subjectsWithMcqs.map((subj) => {
    const semPath = getSemesterPath(
      subj.semester?.facultyId || subj.semester?.faculty?.id,
      subj.semester?.order,
      subj.semester?.faculty?.systemType
    )
    const subSlug = slugify(subj.title) || slugify(subj.code)
    const url = semPath ? `${baseUrl}${semPath}/${subSlug}/mcq` : `${baseUrl}/mcq/${subj.id}`
    return {
      url,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.85,
    }
  })

  // 6. Blogs & Articles
  const staticBlogs: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/blogs`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    }
  ]
  
  const blogs = await prisma.blog.findMany({
    where: { isPublished: true },
    select: { slug: true, updatedAt: true }
  })

  const blogRoutes: MetadataRoute.Sitemap = blogs.map((blog) => ({
    url: `${baseUrl}/blogs/${blog.slug}`,
    lastModified: blog.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [
    ...staticPages,
    ...staticBlogs,
    ...facultyRoutes,
    ...projectRoutes,
    ...noteRoutes,
    ...paperRoutes,
    ...mcqRoutes,
    ...blogRoutes,
  ]
}
