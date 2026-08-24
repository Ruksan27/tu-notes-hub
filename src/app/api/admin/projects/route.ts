// src/app/api/admin/projects/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function GET() {
  try {
    const projects = await prisma.projectItem.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { orders: true } },
        user: { select: { id: true, name: true } },
      },
    })
    return NextResponse.json({ projects })
  } catch (error) {
    console.error('[ADMIN_PROJECTS_GET]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contentType = req.headers.get('content-type') || ''

    let title = '', description = '', technologies = '', features = '', demoUrl = '', sourceDriveLink = '', adminDriveLink = ''
    let originalPrice = 0, discountPercentage = 0
    let thumbnailUrl: string | null = null

    if (contentType.includes('multipart/form-data')) {
      // Handle FormData (with possible image upload)
      const formData = await req.formData()
      title = formData.get('title') as string
      description = formData.get('description') as string
      technologies = formData.get('technologies') as string
      features = formData.get('features') as string || ''
      demoUrl = formData.get('demoUrl') as string || ''
      sourceDriveLink = formData.get('sourceDriveLink') as string || ''
      adminDriveLink = formData.get('adminDriveLink') as string || ''
      originalPrice = Number(formData.get('originalPrice'))
      discountPercentage = Number(formData.get('discountPercentage') || 0)

      const imageFile = formData.get('thumbnail') as File | null
      const imageUrl = formData.get('thumbnailUrl') as string | null

      if (imageFile && imageFile.size > 0) {
        // Upload to Cloudinary
        const arrayBuffer = await imageFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const uploadResult = await new Promise<any>((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: 'tu-notes/projects', resource_type: 'image' },
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
    } else {
      // JSON body
      const body = await req.json()
      title = body.title
      description = body.description
      technologies = body.technologies
      features = body.features || ''
      demoUrl = body.demoUrl || ''
      sourceDriveLink = body.sourceDriveLink || ''
      adminDriveLink = body.adminDriveLink || ''
      originalPrice = body.originalPrice
      discountPercentage = body.discountPercentage || 0
      thumbnailUrl = body.thumbnailUrl || null
    }

    if (!title || !description || !technologies || originalPrice === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const project = await prisma.projectItem.create({
      data: {
        title,
        description,
        technologies,
        originalPrice,
        discountPercentage,
        thumbnailUrl,
        demoUrl: demoUrl || null,
        sourceDriveLink: sourceDriveLink || null,
        adminDriveLink: adminDriveLink || null,
        features: features || null,
        status: 'ACTIVE',
        // No sellerId = admin-uploaded
      }
    })

    return NextResponse.json({ success: true, project }, { status: 201 })
  } catch (error) {
    console.error('[ADMIN_PROJECTS_POST]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
