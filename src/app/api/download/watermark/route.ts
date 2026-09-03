// src/app/api/download/watermark/route.ts
// Universal PDF Watermarker — adds QR code + branding to any PDF before download
import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib'
import QRCode from 'qrcode'

export const dynamic = 'force-dynamic'

// Max timeout: 60s (Vercel limit)
export const maxDuration = 60

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const fileUrl = url.searchParams.get('fileUrl')
    const noteId = url.searchParams.get('noteId')
    const bookId = url.searchParams.get('bookId')
    const filename = url.searchParams.get('filename') || 'TUNotes_Document'

    if (!fileUrl) {
      return NextResponse.json({ error: 'Missing fileUrl parameter' }, { status: 400 })
    }

    // 1. Fetch the original file
    let fetchUrl = fileUrl

    // Handle Google Drive: convert share URL to direct download URL
    if (fileUrl.includes('drive.google.com')) {
      const idMatch = fileUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || fileUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/)
      if (idMatch?.[1]) {
        fetchUrl = `https://drive.google.com/uc?export=download&id=${idMatch[1]}`
      }
    }

    const response = await fetch(fetchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TUNotesHub/1.0)' }
    })

    if (!response.ok) {
      console.error(`[Watermark] Failed to fetch: ${fetchUrl} → ${response.status}`)
      return NextResponse.json({ error: 'Failed to fetch the original file' }, { status: response.status })
    }

    const contentType = response.headers.get('Content-Type') || ''
    const arrayBuffer = await response.arrayBuffer()

    // 2. Try to load as PDF
    let pdfDoc: PDFDocument
    try {
      pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true })
    } catch (e) {
      // Not a PDF (image, etc.) — return original with download header
      console.warn('[Watermark] Not a valid PDF, returning original:', (e as Error).message)
      return new NextResponse(arrayBuffer, {
        headers: {
          'Content-Type': contentType || 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-store',
        }
      })
    }

    // 3. Embed font (for footer text)
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    // 4. Generate QR Code pointing to the resource page
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tunoteshub.com'
    let qrTarget = baseUrl
    if (bookId) qrTarget = `${baseUrl}/download/book/${bookId}`
    else if (noteId) qrTarget = `${baseUrl}/download/${noteId}`

    const qrCodeDataUrl = await QRCode.toDataURL(qrTarget, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 128,
      color: { dark: '#000000', light: '#FFFFFF' }
    })
    const qrBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64')
    const qrImage = await pdfDoc.embedPng(qrBuffer)
    const qrSize = 60 // 60pt QR code in corner

    // 5. Apply watermark to every page
    const pages = pdfDoc.getPages()

    for (const page of pages) {
      const { width, height } = page.getSize()

      // A. Center Diagonal Text Watermark (Copy Protection)
      page.drawText('TU Notes Hub', {
        x: width / 2 - 130,
        y: height / 2 - 30,
        size: 56,
        font: fontBold,
        color: rgb(0.15, 0.15, 0.15),
        rotate: degrees(45),
        opacity: 0.10,
      })

      // B. Second diagonal for dense coverage
      page.drawText('tunoteshub.com', {
        x: width / 4 - 80,
        y: height / 4,
        size: 28,
        font: font,
        color: rgb(0.15, 0.15, 0.15),
        rotate: degrees(45),
        opacity: 0.07,
      })

      // C. Bottom strip background (subtle footer bar)
      page.drawRectangle({
        x: 0,
        y: 0,
        width,
        height: 36,
        color: rgb(0.97, 0.97, 0.97),
        opacity: 0.85,
      })

      // D. Bottom Left: "Downloaded from tunoteshub.com"
      page.drawText('Downloaded from tunoteshub.com — Free TU Notes & Past Papers', {
        x: 12,
        y: 13,
        size: 8,
        font,
        color: rgb(0.25, 0.25, 0.25),
        opacity: 1.0,
      })

      // E. Bottom Right: QR Code
      page.drawImage(qrImage, {
        x: width - qrSize - 10,
        y: 4,
        width: qrSize,
        height: qrSize - 4,
        opacity: 0.92,
      })

      // F. "Scan to visit" text just below QR (tiny)
      page.drawText('tunoteshub.com', {
        x: width - qrSize - 8,
        y: 2,
        size: 6,
        font: fontBold,
        color: rgb(0.25, 0.25, 0.25),
        opacity: 0.9,
      })
    }

    // 6. Save and return
    const pdfBytes = await pdfDoc.save()

    const safeFilename = filename.replace(/[^a-zA-Z0-9_\-\.]/g, '_')
    const downloadName = safeFilename.endsWith('.pdf') ? safeFilename : `${safeFilename}.pdf`

    return new NextResponse(pdfBytes as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${downloadName}"`,
        'Cache-Control': 'no-store',
      }
    })

  } catch (error: any) {
    console.error('[Watermark API Error]:', error?.message || error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
