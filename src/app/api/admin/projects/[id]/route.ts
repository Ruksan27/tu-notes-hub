// src/app/api/admin/projects/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contentType = req.headers.get('content-type') || ''
    let updateData: any = {}

    if (contentType.includes('multipart/form-data')) {
      const fd = await req.formData()
      const imageFile = fd.get('thumbnail') as File | null
      let thumbnailUrl: string | undefined = fd.get('thumbnailUrl') as string || undefined

      if (imageFile && imageFile.size > 0) {
        const buf = Buffer.from(await imageFile.arrayBuffer())
        const result = await new Promise<any>((res, rej) => {
          const s = cloudinary.uploader.upload_stream(
            { folder: 'tu-notes/projects', resource_type: 'image' },
            (e, r) => e ? rej(e) : res(r)
          )
          s.end(buf)
        })
        thumbnailUrl = result.secure_url
      }

      updateData = {
        title: fd.get('title') as string,
        description: fd.get('description') as string,
        technologies: fd.get('technologies') as string,
        originalPrice: Number(fd.get('originalPrice')),
        discountPercentage: Number(fd.get('discountPercentage') || 0),
        demoUrl: fd.get('demoUrl') as string || null,
        sourceDriveLink: fd.get('sourceDriveLink') as string || null,
        adminDriveLink: fd.get('adminDriveLink') as string || null,
        features: fd.get('features') as string || null,
        ...(thumbnailUrl !== undefined && { thumbnailUrl }),
      }
    } else {
      const body = await req.json()
      const { title, description, technologies, originalPrice, discountPercentage, thumbnailUrl, demoUrl, sourceDriveLink, adminDriveLink, features, status, adminNote } = body
      updateData = {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(technologies !== undefined && { technologies }),
        ...(originalPrice !== undefined && { originalPrice }),
        ...(discountPercentage !== undefined && { discountPercentage }),
        ...(thumbnailUrl !== undefined && { thumbnailUrl }),
        ...(demoUrl !== undefined && { demoUrl }),
        ...(sourceDriveLink !== undefined && { sourceDriveLink }),
        ...(adminDriveLink !== undefined && { adminDriveLink }),
        ...(features !== undefined && { features }),
        ...(status !== undefined && { status }),
        ...(adminNote !== undefined && { adminNote }),
      }
    }

    const updated = await prisma.projectItem.update({
      where: { id },
      data: updateData,
      include: { user: { select: { email: true, name: true } } }
    })

    if (updateData.status === 'ACTIVE' && updated.user?.email) {
      try {
        const { sendProjectApprovedEmail } = await import('@/lib/email')
        await sendProjectApprovedEmail(updated.user.email, updated.user.name, updated.title)
      } catch (err) {
        console.error('Failed to send project approval email:', err)
      }
    }

    return NextResponse.json({ success: true, project: updated })
  } catch (error) {
    console.error('[ADMIN_PROJECT_PUT]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.projectItem.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[ADMIN_PROJECT_DELETE]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
