import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { uploadToCloudinary } from '@/lib/cloudinary'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const fd = await req.formData()
    const projectId = fd.get('projectId') as string
    const orderEmail = fd.get('email') as string
    const amount = Number(fd.get('amount'))
    const screenshotFile = fd.get('screenshot') as File | null

    if (!projectId || !orderEmail || !amount || !screenshotFile) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const project = await prisma.projectItem.findUnique({ where: { id: projectId } })
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    // Upload screenshot to Cloudinary
    const buffer = Buffer.from(await screenshotFile.arrayBuffer())
    const uploadResult = await uploadToCloudinary(buffer, 'tu-notes/project-orders', 'image')

    const order = await prisma.projectOrder.create({
      data: {
        userId: user.userId,
        projectItemId: projectId,
        amount,
        status: 'PENDING',
        orderEmail,
        screenshotUrl: uploadResult.url,
        buyerTermsAccepted: true,
      }
    })

    // Send confirmation email
    try {
      const { sendProjectOrderConfirmEmail } = await import('@/lib/email')
      await sendProjectOrderConfirmEmail(orderEmail, project.title, amount, order.id)
    } catch (e) {
      console.error('Failed to send confirmation email:', e)
    }

    return NextResponse.json({ success: true, orderId: order.id })
  } catch (error) {
    console.error('[PROJECT_ORDER_POST]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
