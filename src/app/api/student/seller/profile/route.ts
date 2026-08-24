import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadToCloudinary } from '@/lib/cloudinary'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const college = formData.get('college') as string
    const bio = formData.get('bio') as string
    const experience = formData.get('experience') as string
    const skills = formData.get('skills') as string
    
    // Optional Socials
    const github = formData.get('github') as string || null
    const linkedin = formData.get('linkedin') as string || null
    const youtube = formData.get('youtube') as string || null
    const instagram = formData.get('instagram') as string || null
    const tiktok = formData.get('tiktok') as string || null

    if (!college || !bio || !experience || !skills) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    let profilePicUrl: string | undefined = undefined
    const picFile = formData.get('profilePic') as File | null
    if (picFile && picFile.size > 0) {
      const buffer = Buffer.from(await picFile.arrayBuffer())
      const uploadRes = await uploadToCloudinary(buffer, 'tu-notes/profile-pics', 'image')
      profilePicUrl = uploadRes.url
    }

    const updateData: any = {
      college,
      bio,
      experience,
      skills,
      github,
      linkedin,
      youtube,
      instagram,
      tiktok
    }

    if (profilePicUrl !== undefined) {
      updateData.profilePic = profilePicUrl
    }

    const sellerProfile = await prisma.sellerProfile.upsert({
      where: { userId: user.userId },
      update: updateData,
      create: {
        userId: user.userId,
        ...updateData
      }
    })

    return NextResponse.json({ success: true, profile: sellerProfile })

  } catch (error) {
    console.error('[SELLER_PROFILE_UPDATE_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
