// src/app/api/admin/submissions/route.ts
// Admin API: Get all student & sub-admin submitted notes (PENDING / APPROVED / REJECTED)
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== 'ADMIN' && user.role !== 'CHILD_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const statusFilter = searchParams.get('status') // PENDING | APPROVED | REJECTED | ALL

    const whereClause: any = {
      author: { not: null }, // has an author email
    }

    if (statusFilter && statusFilter !== 'ALL') {
      whereClause.status = statusFilter
    } else if (!statusFilter) {
      // Default: show PENDING
      whereClause.status = 'PENDING'
    }

    const submissions = await prisma.note.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        subject: {
          select: {
            id: true,
            title: true,
            code: true,
            semester: {
              select: {
                name: true,
                faculty: {
                  select: { name: true, icon: true }
                }
              }
            }
          }
        }
      }
    })

    // Fetch author roles (STUDENT vs CHILD_ADMIN vs ADMIN) for proper points rendering
    const authorEmails = Array.from(
      new Set(submissions.map(s => s.author).filter(Boolean) as string[])
    )

    const users = await prisma.user.findMany({
      where: { email: { in: authorEmails } },
      select: { email: true, name: true, role: true }
    })

    const userMap = new Map(users.map(u => [u.email.toLowerCase(), u]))

    const enrichedSubmissions = submissions.map(s => {
      const authorUser = s.author ? userMap.get(s.author.toLowerCase()) : null
      const role = authorUser?.role || 'STUDENT'
      const isSubAdmin = role === 'CHILD_ADMIN' || role === 'ADMIN'

      return {
        ...s,
        authorName: authorUser?.name || s.author,
        authorRole: role,
        isSubAdmin,
        displayPoints: isSubAdmin ? 0 : (s.awardedPoints || 0)
      }
    })

    return NextResponse.json({ submissions: enrichedSubmissions, total: enrichedSubmissions.length })
  } catch (error: any) {
    console.error('[ADMIN SUBMISSIONS GET]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
