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
    
    // Check required fields
    const title = formData.get('title') as string
    const shortDescription = formData.get('shortDescription') as string
    const category = formData.get('category') as string
    const projectType = formData.get('projectType') as string
    const description = formData.get('description') as string
    const features = formData.get('features') as string
    const modules = formData.get('modules') as string
    const requirements = formData.get('requirements') as string
    const installation = formData.get('installation') as string
    const technologies = formData.get('technologies') as string
    const frontend = formData.get('frontend') as string
    const dbType = formData.get('dbType') as string
    const sourceDriveLink = formData.get('sourceDriveLink') as string
    const originalPrice = Number(formData.get('originalPrice'))
    const sellerDeclared = formData.get('sellerDeclared') === 'true'

    if (!title || !shortDescription || !category || !projectType || !description || !features || !modules || !requirements || !installation || !technologies || !frontend || !dbType || !sourceDriveLink || !originalPrice || !sellerDeclared) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Handle Image Uploads
    const uploadImage = async (file: File | null) => {
      if (!file || file.size === 0) return null
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const uploadResult = await new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'tu-notes/seller-projects', resource_type: 'image' },
          (error, result) => error ? reject(error) : resolve(result)
        )
        stream.end(buffer)
      })
      return uploadResult.secure_url
    }

    const thumbnailUrl = await uploadImage(formData.get('thumbnail') as File) || (formData.get('thumbnailUrl') as string)
    const screenshot1 = await uploadImage(formData.get('screenshot1') as File)
    const screenshot2 = await uploadImage(formData.get('screenshot2') as File)
    const screenshot3 = await uploadImage(formData.get('screenshot3') as File)
    const screenshot4 = await uploadImage(formData.get('screenshot4') as File)

    if (!thumbnailUrl || !screenshot1 || !screenshot2) {
      return NextResponse.json({ error: 'Thumbnail and at least 2 screenshots are required' }, { status: 400 })
    }

    // Optional fields
    const subcategory = formData.get('subcategory') as string || null
    const projectObjective = formData.get('projectObjective') as string || null
    const limitations = formData.get('limitations') as string || null
    const version = formData.get('version') as string || null
    const backend = formData.get('backend') as string || null
    const framework = formData.get('framework') as string || null
    const libraries = formData.get('libraries') as string || null
    const negotiable = formData.get('negotiable') === 'true'
    const license = formData.get('license') as string || null
    const salesType = formData.get('salesType') as string || null
    
    // Demo & Social links
    const demoUrl = formData.get('demoUrl') as string || null
    const youtubeUrl = formData.get('youtubeUrl') as string || null
    const tiktokUrl = formData.get('tiktokUrl') as string || null
    const instagramUrl = formData.get('instagramUrl') as string || null
    const linkedinUrl = formData.get('linkedinUrl') as string || null
    const githubUrl = formData.get('githubUrl') as string || null
    const portfolioUrl = formData.get('portfolioUrl') as string || null
    
    // Credentials
    const demoCredentials = formData.get('demoCredentials') as string || null

    if (!demoUrl && !youtubeUrl && !screenshot1) { // Redundant check for screenshots, but keeping logic
       return NextResponse.json({ error: 'At least one demo method (Live, Video, or Screenshots) must be provided' }, { status: 400 })
    }

    const project = await prisma.projectItem.create({
      data: {
        title,
        shortDescription,
        category,
        subcategory,
        projectType,
        description,
        projectObjective,
        features,
        modules,
        requirements,
        installation,
        limitations,
        version,
        technologies,
        frontend,
        backend,
        dbType,
        framework,
        libraries,
        originalPrice,
        discountPercentage: 0,
        negotiable,
        license,
        salesType,
        thumbnailUrl,
        screenshot1,
        screenshot2,
        screenshot3,
        screenshot4,
        demoUrl,
        youtubeUrl,
        tiktokUrl,
        instagramUrl,
        linkedinUrl,
        githubUrl,
        portfolioUrl,
        sourceDriveLink,
        demoCredentials,
        sellerDeclared,
        status: 'PENDING',
        sellerId: user.id,
      },
    })

    return NextResponse.json({ success: true, project }, { status: 201 })
  } catch (error) {
    console.error('[SELLER_PROJECTS_POST]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
