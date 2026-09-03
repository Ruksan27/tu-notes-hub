import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

export async function GET() {
  try {
    const publicDir = path.join(process.cwd(), 'public')
    const faviconSrc = path.join(publicDir, 'favicon.ico')

    if (!fs.existsSync(faviconSrc)) {
      return NextResponse.json({ error: 'favicon.ico not found' }, { status: 404 })
    }

    const darkBg = { r: 8, g: 10, b: 18, alpha: 1 }

    await sharp(faviconSrc)
      .resize(512, 512, { fit: 'contain', background: darkBg })
      .png()
      .toFile(path.join(publicDir, 'icon-512.png'))

    await sharp(faviconSrc)
      .resize(192, 192, { fit: 'contain', background: darkBg })
      .png()
      .toFile(path.join(publicDir, 'icon-192.png'))

    await sharp(faviconSrc)
      .resize(180, 180, { fit: 'contain', background: darkBg })
      .png()
      .toFile(path.join(publicDir, 'apple-icon.png'))

    await sharp(faviconSrc)
      .resize(512, 512, { fit: 'contain', background: darkBg })
      .png()
      .toFile(path.join(publicDir, 'logo.png'))

    await sharp(faviconSrc)
      .resize(192, 192, { fit: 'contain', background: darkBg })
      .png()
      .toFile(path.join(publicDir, 'icon.png'))

    return NextResponse.json({ success: true, message: 'PWA icons generated from favicon.ico' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
