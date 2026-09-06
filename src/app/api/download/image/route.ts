import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const fileUrl = url.searchParams.get('fileUrl')
    const noteId = url.searchParams.get('noteId')
    const filename = url.searchParams.get('filename') || 'TUNotes_Image'

    if (!fileUrl || !fileUrl.includes('res.cloudinary.com')) {
      return NextResponse.json({ error: 'Invalid fileUrl' }, { status: 400 })
    }

    // Parse Cloudinary URL
    const match = fileUrl.match(/res\.cloudinary\.com\/(.+?)\/image\/upload\/(.+)$/)
    if (!match) {
      return NextResponse.redirect(fileUrl)
    }

    const cloudName = match[1]
    let publicIdWithVersion = match[2] // This includes the version and folders/filename
    
    // Find matching Cloudinary account from env
    const accountsStr = process.env.CLOUDINARY_ACCOUNTS || '[]'
    const accounts = JSON.parse(accountsStr)
    const account = accounts.find((a: any) => a.cloud_name === cloudName)

    if (!account) {
      // If we don't have the secret, just redirect to original
      return NextResponse.redirect(fileUrl)
    }

    // Configure Cloudinary SDK
    cloudinary.config({
      cloud_name: account.cloud_name,
      api_key: account.api_key,
      api_secret: account.api_secret,
    })

    // Construct transformations
    const diagonalWatermark = `l_text:Arial_100_bold:TU%20Notes%20Hub/co_black,o_12,a_-45/fl_layer_apply,g_center`
    const footerLink = `l_text:Arial_22:tunoteshub.com/co_black,o_60/fl_layer_apply,g_south_east,x_15,y_15`
    
    // QR Code Layer
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tunoteshub.com'
    const targetUrl = `${baseUrl}/download/${noteId}`
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(targetUrl)}`
    const b64Url = Buffer.from(qrApiUrl).toString('base64').replace(/\+/g, '-').replace(/\//g, '_')
    const qrLayer = `l_fetch:${b64Url}/c_scale,w_100/fl_layer_apply,g_south_east,x_15,y_45`

    // Generate SIGNED URL
    const signedUrl = cloudinary.url(publicIdWithVersion, {
      raw_transformation: `fl_attachment:${filename}/${diagonalWatermark}/${qrLayer}/${footerLink}`,
      sign_url: true,
      secure: true
    })

    // Redirect to the signed URL
    return NextResponse.redirect(signedUrl)

  } catch (error: any) {
    console.error('[Image Download Error]:', error)
    const fallbackUrl = new URL(req.url).searchParams.get('fileUrl')
    if (fallbackUrl) {
       return NextResponse.redirect(fallbackUrl)
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
