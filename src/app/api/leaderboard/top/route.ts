import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // 1. Try to fetch top users with rewardPoints > 0
    let topUsers = await prisma.user.findMany({
      where: {
        rewardPoints: { gt: 0 },
      },
      orderBy: {
        rewardPoints: 'desc',
      },
      take: 10,
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        rewardPoints: true,
      },
    })

    // 2. If fewer than 3 users have points, fetch recent registered real users from DB
    if (topUsers.length < 3) {
      const existingIds = topUsers.map((u) => u.id)
      const additionalUsers = await prisma.user.findMany({
        where: {
          id: { notIn: existingIds },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5 - topUsers.length,
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          rewardPoints: true,
        },
      })

      topUsers = [...topUsers, ...additionalUsers]
    }

    return NextResponse.json({ success: true, contributors: topUsers })
  } catch (error) {
    console.error('Failed to fetch top contributors:', error)
    return NextResponse.json({ success: false, contributors: [] }, { status: 500 })
  }
}
