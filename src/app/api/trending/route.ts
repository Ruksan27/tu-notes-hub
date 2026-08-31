import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // 1. Most Viewed Notes (Ranked by downloadCount, only those with downloads)
    const mostViewedNotes = await prisma.note.findMany({
      where: { downloadCount: { gt: 0 } },
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

    // 2. Trending Subjects (Ranked by total notes & download count, only those with downloads)
    const trendingSubjects = await prisma.subject.findMany({
      take: 15, // Take a larger subset to filter
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

    const finalSubjects = trendingSubjects.map(s => {
      const totalDownloads = s.notes.reduce((sum, n) => sum + n.downloadCount, 0)
      return {
        id: s.id,
        title: s.title,
        code: s.code,
        notesCount: s._count.notes,
        pastPapersCount: s._count.pastPapers,
        totalDownloads: totalDownloads || 0
      }
    })
    .filter(s => s.totalDownloads > 0)
    .sort((a, b) => b.totalDownloads - a.totalDownloads)
    .slice(0, 5)

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
