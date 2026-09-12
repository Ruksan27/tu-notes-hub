// src/app/api/cloudinary-sign/route.ts
// Generates a short-lived signed Cloudinary URL so private/authenticated assets can be accessed.
import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

export const dynamic = 'force-dynamic'

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || ''
const apiKey = process.env.CLOUDINARY_API_KEY || ''
const apiSecret = process.env.CLOUDINARY_API_SECRET || ''

if (cloudName && apiSecret) {
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true })
}

function extractPublicIdAndType(rawUrl: string): { publicId: string; resourceType: 'raw' | 'image'; version?: string } | null {
  const isRaw = rawUrl.includes('/raw/upload/')
  const isImage = rawUrl.includes('/image/upload/')
  if (!isRaw && !isImage) return null

  const uploadSegment = isRaw ? '/raw/upload/' : '/image/upload/'
  const afterUpload = rawUrl.split(uploadSegment)[1]
  if (!afterUpload) return null

  const withoutQuery = afterUpload.split('?')[0]
  const versionMatch = withoutQuery.match(/^v(\d+)\//)
  const version = versionMatch ? versionMatch[1] : undefined
  const publicId = withoutQuery.replace(/^v\d+\//, '')

  return { publicId, resourceType: isRaw ? 'raw' : 'image', version }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const rawUrl = searchParams.get('url')

  if (!rawUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  if (!apiSecret) {
    // No credentials — return the original URL as-is
    return NextResponse.json({ signedUrl: rawUrl })
  }

  const parsed = extractPublicIdAndType(rawUrl)
  if (!parsed) {
    return NextResponse.json({ signedUrl: rawUrl })
  }

  const { publicId, resourceType, version } = parsed
  const expiresAt = Math.floor(Date.now() / 1000) + 3600 // 1 hour

  // Try both delivery types — authenticated files need 'authenticated', public need 'upload'
  for (const deliveryType of ['upload', 'authenticated'] as const) {
    try {
      const options: any = {
        resource_type: resourceType,
        type: deliveryType,
        sign_url: true,
        secure: true,
        expires_at: expiresAt,
      }
      if (version) options.version = version

      const signedUrl: string = cloudinary.url(publicId, options)
      console.log(`[CLOUDINARY_SIGN] type=${deliveryType} → ${signedUrl}`)
      return NextResponse.json({ signedUrl })
    } catch (err) {
      console.warn(`[CLOUDINARY_SIGN] type=${deliveryType} failed:`, err)
    }
  }

  // All failed — return original
  return NextResponse.json({ signedUrl: rawUrl })
}
