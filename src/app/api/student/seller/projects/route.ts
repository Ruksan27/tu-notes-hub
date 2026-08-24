import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export const dynamic = 'force-dynamic'

// GET — list this seller's projects
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: user.id },
    })
    if (!sellerProfile || sellerProfile.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Not an approved seller' }, { status: 403 })
    }

    const projects = await prisma.projectItem.findMany({
      where: { sellerId: user.id },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { orders: true } } },
    })

    return NextResponse.json({ projects })
  } catch (error) {
    console.error('[SELLER_PROJECTS_GET]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST — seller uploads a new project (status: PENDING, admin approves)
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: user.id },
    })
    if (!sellerProfile || sellerProfile.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Not an approved seller' }, { status: 403 })
    }

    const formData = await req.formData()
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const technologies = formData.get('technologies') as string
    const originalPrice = Number(formData.get('originalPrice'))
    const features = formData.get('features') as string | null
    const demoUrl = formData.get('demoUrl') as string | null

    if (!title || !description || !technologies || !originalPrice) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Handle thumbnail upload
    let thumbnailUrl: string | null = null
    const imageFile = formData.get('thumbnail') as File | null
    const imageUrl = formData.get('thumbnailUrl') as string | null

    if (imageFile && imageFile.size > 0) {
      const arrayBuffer = await imageFile.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const uploadResult = await new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'tu-notes/seller-projects', resource_type: 'image' },
          (error, result) => {
            if (error) reject(error)
            else resolve(result)
          }
        )
        stream.end(buffer)
      })
      thumbnailUrl = uploadResult.secure_url
    } else if (imageUrl) {
      thumbnailUrl = imageUrl
    }

    const project = await prisma.projectItem.create({
      data: {
        title,
        description,
        technologies,
        originalPrice,
        discountPercentage: 0,
        thumbnailUrl,
        demoUrl: demoUrl || null,
        features: features || null,
        status: 'PENDING', // Admin must approve before going ACTIVE
        sellerId: user.id,
      },
    })

    return NextResponse.json({ success: true, project }, { status: 201 })
  } catch (error) {
    console.error('[SELLER_PROJECTS_POST]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
