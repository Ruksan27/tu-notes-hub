import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId, type, transactionId, screenshotUrl, amount, message } = await req.json()

    if (!projectId || !type) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Verify project exists
    const project = await prisma.projectItem.findUnique({ where: { id: projectId } })
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (type === 'BUY') {
      if (!transactionId || !screenshotUrl) {
        return NextResponse.json({ error: 'Transaction details required' }, { status: 400 })
      }

      await prisma.projectOrder.create({
        data: {
          userId: user.id,
          projectItemId: projectId,
          status: 'PENDING',
          transactionId,
          screenshotUrl,
          amount,
        }
      })
    } else if (type === 'INQUIRE') {
      if (!message) {
        return NextResponse.json({ error: 'Message is required' }, { status: 400 })
      }

      await prisma.projectOrder.create({
        data: {
          userId: user.id,
          projectItemId: projectId,
          status: 'INQUIRY',
          amount: 0,
          message,
        }
      })
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    return NextResponse.json({ message: 'Success' })

  } catch (error: any) {
    console.error('[PROJECT_ORDER_POST]', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Transaction ID already used' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
