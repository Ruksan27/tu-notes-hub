// src/app/api/cart/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET: fetch cart for logged-in user
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ items: [] })

  const cart = await prisma.cart.findUnique({
    where: { userId: user.userId },
    include: {
      items: {
        include: {
          projectItem: {
            select: {
              id: true,
              title: true,
              thumbnailUrl: true,
              originalPrice: true,
              discountPercentage: true,
              category: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  return NextResponse.json({ items: cart?.items ?? [] })
}

// POST: add item to cart
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 })

  const { projectItemId } = await req.json()
  if (!projectItemId) return NextResponse.json({ error: 'projectItemId required' }, { status: 400 })

  // Ensure cart exists
  const cart = await prisma.cart.upsert({
    where: { userId: user.userId },
    update: {},
    create: { userId: user.userId },
  })

  // Add item (ignore if already exists)
  try {
    await prisma.cartItem.create({
      data: { cartId: cart.id, projectItemId }
    })
    return NextResponse.json({ success: true })
  } catch {
    // Unique constraint: already in cart
    return NextResponse.json({ success: true, alreadyInCart: true })
  }
}

// DELETE: remove item from cart
export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const projectItemId = searchParams.get('projectItemId')
  if (!projectItemId) return NextResponse.json({ error: 'projectItemId required' }, { status: 400 })

  const cart = await prisma.cart.findUnique({ where: { userId: user.userId } })
  if (!cart) return NextResponse.json({ success: true })

  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id, projectItemId }
  })

  return NextResponse.json({ success: true })
}
