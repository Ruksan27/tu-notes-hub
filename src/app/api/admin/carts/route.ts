// src/app/api/admin/carts/route.ts
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const carts = await prisma.cart.findMany({
    include: {
      user: { select: { name: true, email: true } },
      items: {
        include: {
          projectItem: {
            select: {
              id: true,
              title: true,
              originalPrice: true,
              discountPercentage: true,
              thumbnailUrl: true,
            }
          }
        }
      }
    },
    where: {
      items: { some: {} } // only carts with items
    },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  })

  return NextResponse.json({ carts })
}
