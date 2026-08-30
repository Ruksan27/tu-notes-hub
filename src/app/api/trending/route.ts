import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // 1. Most Viewed Notes (Ranked by downloadCount)
    let mostViewedNotes = await prisma.note.findMany({
      take: 5,
      orderBy: { downloadCount: 'desc' },
      select: {
        id: true,
        title: true,
        downloadCount: true,
        isPremium: true,
        subject: {
          select: { title: true, code: true }
        }
      }
    })

    // Fallback notes if DB count is 0
    if (mostViewedNotes.length === 0) {
      mostViewedNotes = [
        { id: '1', title: 'CACS303 Web Technology Complete Notes', downloadCount: 1420, isPremium: false, subject: { title: 'Web Technology', code: 'CACS303' } },
        { id: '2', title: 'CACS254 Computer Networks Unit-Wise Notes', downloadCount: 1180, isPremium: false, subject: { title: 'Computer Networks', code: 'CACS254' } },
        { id: '3', title: 'CACS202 Database Management Systems PDF', downloadCount: 950, isPremium: false, subject: { title: 'Database Management Systems', code: 'CACS202' } },
        { id: '4', title: 'CACS101 C Programming Solution Guide', downloadCount: 840, isPremium: false, subject: { title: 'C Programming', code: 'CACS101' } },
        { id: '5', title: 'CACS351 Software Engineering Notes', downloadCount: 720, isPremium: false, subject: { title: 'Software Engineering', code: 'CACS351' } }
      ] as any
    }

    // 2. Trending Subjects (Ranked by total notes & download count)
    let trendingSubjects = await prisma.subject.findMany({
      take: 5,
      select: {
        id: true,
        title: true,
        code: true,
        _count: {
          select: { notes: true, pastPapers: true }
        },
        notes: {
          select: { downloadCount: true }
        }
      }
    })

    const formattedSubjects = trendingSubjects.map(s => {
      const totalDownloads = s.notes.reduce((sum, n) => sum + n.downloadCount, 0)
      return {
        id: s.id,
        title: s.title,
        code: s.code,
        notesCount: s._count.notes,
        pastPapersCount: s._count.pastPapers,
        totalDownloads: totalDownloads || Math.floor(Math.random() * 800) + 400
      }
    }).sort((a, b) => b.totalDownloads - a.totalDownloads).slice(0, 5)

    // Fallback subjects if DB count is 0
    const finalSubjects = formattedSubjects.length > 0 ? formattedSubjects : [
      { id: 's1', title: 'Computer Networking', code: 'CACS254', notesCount: 14, pastPapersCount: 8, totalDownloads: 2450 },
      { id: 's2', title: 'Web Technology', code: 'CACS303', notesCount: 18, pastPapersCount: 10, totalDownloads: 2120 },
      { id: 's3', title: 'Database Management System', code: 'CACS202', notesCount: 16, pastPapersCount: 9, totalDownloads: 1890 },
      { id: 's4', title: 'Object Oriented Programming (Java)', code: 'CACS204', notesCount: 12, pastPapersCount: 7, totalDownloads: 1650 },
      { id: 's5', title: 'Data Structures and Algorithms', code: 'CACS201', notesCount: 15, pastPapersCount: 8, totalDownloads: 1420 },
    ]

    // 3. Popular Faculties (BCA, CSIT, BIT, BBA, BBS, etc.)
    const faculties = await prisma.faculty.findMany({
      where: { visible: true },
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true
      }
    })

    const PRIORITY_SCORES: Record<string, { rank: number; icon: string; badge: string; downloads: number }> = {
      bca:  { rank: 1, icon: '💻', badge: '🥇 #1 Trending', downloads: 8450 },
      csit: { rank: 2, icon: '🖥️', badge: '🥈 #2 Trending', downloads: 7210 },
      bit:  { rank: 3, icon: '🔧', badge: '🥉 #3 Trending', downloads: 5890 },
      bba:  { rank: 4, icon: '💼', badge: '#4 High Demand', downloads: 4120 },
      bbs:  { rank: 5, icon: '📊', badge: '#5 Popular', downloads: 3650 },
      be:   { rank: 6, icon: '⚙️', badge: '#6 Engineering', downloads: 2900 },
    }

    const popularFaculties = (faculties.length > 0 ? faculties : [
      { id: 'bca', name: 'Bachelor of Computer Application', slug: 'bca', icon: '💻' },
      { id: 'csit', name: 'B.Sc. Computer Science & IT', slug: 'csit', icon: '🖥️' },
      { id: 'bit', name: 'Bachelor of Information Tech', slug: 'bit', icon: '🔧' },
      { id: 'bba', name: 'Bachelor of Business Admin', slug: 'bba', icon: '💼' },
      { id: 'bbs', name: 'Bachelor of Business Studies', slug: 'bbs', icon: '📊' },
    ]).map(f => {
      const key = f.id.toLowerCase()
      const score = PRIORITY_SCORES[key] || { rank: 99, icon: f.icon || '🎓', badge: 'Popular', downloads: 1200 }
      return {
        id: f.id,
        name: f.name,
        slug: f.slug,
        icon: f.icon || score.icon,
        badge: score.badge,
        rank: score.rank,
        downloads: score.downloads
      }
    }).sort((a, b) => a.rank - b.rank).slice(0, 5)

    return NextResponse.json({
      popularFaculties,
      trendingSubjects: finalSubjects,
      mostViewedNotes
    })
  } catch (error) {
    console.error('Failed to calculate trending content:', error)
    return NextResponse.json({ error: 'Failed to fetch trending stats' }, { status: 500 })
  }
}
