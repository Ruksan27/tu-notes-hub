import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
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

    // Handle Profile Pic upload (For now, we'll just skip the actual Cloudinary upload in this implementation 
    // unless you want to add the Cloudinary logic here, which is standard via a stream).
    // Let's assume we handle it or leave it null.
    let profilePicUrl = null
    // const picFile = formData.get('profilePic') as File | null
    // if (picFile) { ... upload to Cloudinary ... profilePicUrl = result.secure_url }

    // Upsert the SellerProfile
    const sellerProfile = await prisma.sellerProfile.upsert({
      where: { userId: user.userId },
      update: {
        college, bio, experience, skills,
        github, linkedin, youtube, instagram, tiktok,
        status: 'PENDING' // reset status on re-apply
      },
      create: {
        userId: user.userId,
        college, bio, experience, skills,
        github, linkedin, youtube, instagram, tiktok,
        status: 'PENDING'
      }
    })

    return NextResponse.json({ success: true, profile: sellerProfile })

  } catch (error) {
    console.error('[SELLER_APPLY_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
