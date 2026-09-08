import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const fileUrl = url.searchParams.get('fileUrl')
    const noteId = url.searchParams.get('noteId')
    const rawFilename = url.searchParams.get('filename') || 'tunoteshub_image'

    if (!fileUrl || !fileUrl.includes('res.cloudinary.com')) {
      return NextResponse.json({ error: 'Invalid fileUrl' }, { status: 400 })
    }

    const parsedCleanName = rawFilename
      .replace(/\b(old|new)\s*syllabus\b/gi, '')
      .replace(/\b(old|new)_syllabus\b/gi, '')
      .replace(/\s*\(\s*(old|new)\s*\)/gi, '')
      .replace(/^(tunoteshub|tunotes)_/gi, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '')

    const cleanFilename = parsedCleanName ? `tunoteshub_${parsedCleanName}` : 'tunoteshub_image'

    // Parse Cloudinary URL
    const match = fileUrl.match(/res\.cloudinary\.com\/(.+?)\/image\/upload\/(.+)$/)
    if (!match) {
      return fetchAndStreamImage(fileUrl, cleanFilename)
    }

    const cloudName = match[1]
    let fullPath = match[2]
    
    let version: string | undefined;
    let publicId = fullPath;
    
    // Extract version if present (e.g. v1234567/...)
    const versionMatch = fullPath.match(/^v(\d+)\/(.+)$/);
    if (versionMatch) {
      version = versionMatch[1];
      publicId = versionMatch[2];
    }

    // Strip extension to prevent signature mismatch
    let format = 'png';
    const extMatch = publicId.match(/\.([a-zA-Z0-9]+)$/);
    if (extMatch) {
      format = extMatch[1];
      publicId = publicId.substring(0, publicId.lastIndexOf('.'));
    }
    
    // Find matching Cloudinary account from env
    const accountsStr = process.env.CLOUDINARY_ACCOUNTS || '[]'
    const accounts = JSON.parse(accountsStr)
    const account = accounts.find((a: any) => a.cloud_name === cloudName)

    if (!account) {
      return fetchAndStreamImage(fileUrl, cleanFilename, format)
    }

    // Configure Cloudinary SDK
    cloudinary.config({
      cloud_name: account.cloud_name,
      api_key: account.api_key,
      api_secret: account.api_secret,
    })

    // Construct transformations with valid Cloudinary layer syntax (comma separated layer options)
    
    // Add 160px padding to the bottom so the watermark doesn't cover original text
    const bottomPadding = `c_pad,h_h_add_160,w_w,g_north,b_white`
    
    const diagonalWatermark = `l_text:Arial_100_bold:TU%20Notes%20Hub,co_black,o_12,a_-45/fl_layer_apply,g_center`
    const footerLink = `l_text:Arial_22:tunoteshub.com,co_black,o_60/fl_layer_apply,g_south_east,x_15,y_15`
    
    // QR Code Layer (URL-safe Base64 without '=' padding)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tunoteshub.com'
    const targetUrl = noteId ? `${baseUrl}/download/${noteId}` : baseUrl
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(targetUrl)}`
    const b64Url = Buffer.from(qrApiUrl).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    const qrLayer = `l_fetch:${b64Url}/c_scale,w_100/fl_layer_apply,g_south_east,x_15,y_45`

    // Generate SIGNED URL
    const signedUrl = cloudinary.url(publicId, {
      version: version,
      format: format || undefined,
      raw_transformation: `${bottomPadding}/fl_attachment:${cleanFilename}/${diagonalWatermark}/${qrLayer}/${footerLink}`,
      sign_url: true,
      secure: true
    })

    // Try fetching the watermarked image from Cloudinary
    const res = await fetch(signedUrl, {
      headers: { 'User-Agent': 'TUNotesHub/1.0' }
    })

    if (res.ok) {
      const buffer = await res.arrayBuffer()
      const contentType = res.headers.get('content-type') || `image/${format}`
      const downloadName = cleanFilename.endsWith(`.${format}`) ? cleanFilename : `${cleanFilename}.${format}`
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${downloadName}"`,
          'Cache-Control': 'public, max-age=3600',
        }
      })
    } else {
      console.warn(`[Image Download] Signed URL returned status ${res.status}, falling back to original file.`)
    }

    // Fallback if signed URL returns 401 or non-200
    return fetchAndStreamImage(fileUrl, cleanFilename, format)

  } catch (error: any) {
    console.error('[Image Download Error]:', error)
    const fallbackUrl = new URL(req.url).searchParams.get('fileUrl')
    if (fallbackUrl) {
      return fetchAndStreamImage(fallbackUrl, 'TUNotes_Image')
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

async function fetchAndStreamImage(url: string, filename: string, ext: string = 'png') {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'TUNotesHub/1.0' } })
    if (res.ok) {
      const buffer = await res.arrayBuffer()
      const contentType = res.headers.get('content-type') || `image/${ext}`
      const downloadName = filename.endsWith(`.${ext}`) ? filename : `${filename}.${ext}`
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${downloadName}"`,
          'Cache-Control': 'public, max-age=3600',
        }
      })
    }
  } catch (e) {
    console.error('[Image Download Stream Error]:', e)
  }
  return NextResponse.redirect(url)
}

