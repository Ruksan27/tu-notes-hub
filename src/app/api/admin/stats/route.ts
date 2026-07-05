// src/app/api/admin/stats/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const faculties = await prisma.faculty.findMany({
      orderBy: { name: 'asc' },
      include: {
        semesters: {
          orderBy: { order: 'asc' },
          include: {
            subjects: {
              include: {
                notes: {
                  select: { noteType: true }
                },
                pastPapers: {
                  select: { id: true }
                },
                cheatsheets: {
                  select: { id: true }
                }
              }
            }
          }
        }
      }
    })

    const stats = faculties.map(fac => {
      return {
        id: fac.id,
        name: fac.name,
        icon: fac.icon,
        systemType: fac.systemType,
        semesters: fac.semesters.map(sem => {
          let notesCount = 0
          let projectWorkCount = 0
          let projectCount = 0
          let guideCount = 0
          let labWorkCount = 0
          let pastPapersCount = 0
          let cheatsheetsCount = 0

          sem.subjects.forEach(sub => {
            pastPapersCount += sub.pastPapers.length
            cheatsheetsCount += sub.cheatsheets.length
            sub.notes.forEach(note => {
              if (note.noteType === 'PROJECT_WORK') {
                projectWorkCount++
              } else if (note.noteType === 'PROJECT') {
                projectCount++
              } else if (note.noteType === 'GUIDE') {
                guideCount++
              } else if (note.noteType === 'LAB_WORK') {
                labWorkCount++
              } else {
                notesCount++
              }
            })
          })

          return {
            id: sem.id,
            name: sem.name,
            order: sem.order,
            notesCount,
            projectWorkCount,
            projectCount,
            guideCount,
            labWorkCount,
            pastPapersCount,
            cheatsheetsCount,
            total: notesCount + projectWorkCount + projectCount + guideCount + labWorkCount + pastPapersCount + cheatsheetsCount
          }
        })
      }
    })

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('[ADMIN_STATS_API]', error)
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 })
  }
}
