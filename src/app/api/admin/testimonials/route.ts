import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

async function checkAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    return false
  }
  return true
}

export async function GET() {
  if (!(await checkAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const testimonials = await prisma.testimonial.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ testimonials })
}

export async function PATCH(req: NextRequest) {
  if (!(await checkAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, status } = await req.json()
  if (!id || !status) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const updated = await prisma.testimonial.update({
    where: { id },
    data: { status },
  })
  return NextResponse.json({ success: true, testimonial: updated })
}

export async function DELETE(req: NextRequest) {
  if (!(await checkAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  await prisma.testimonial.delete({
    where: { id },
  })
  return NextResponse.json({ success: true })
}
