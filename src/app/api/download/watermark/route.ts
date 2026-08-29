import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, rgb, degrees } from 'pdf-lib'
import QRCode from 'qrcode'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const fileUrl = url.searchParams.get('fileUrl')
    const noteId = url.searchParams.get('noteId')
    
    if (!fileUrl) {
      return NextResponse.json({ error: 'Missing fileUrl parameter' }, { status: 400 })
    }

    // Only process PDFs
    if (!fileUrl.toLowerCase().endsWith('.pdf') && !fileUrl.includes('cloudinary') && !fileUrl.includes('/uc?export=')) {
      // In production, we'd verify the MIME type, but relying on the client route to only send PDFs here
    }

    // 1. Fetch the original PDF from Cloudinary or Google Drive
    const response = await fetch(fileUrl)
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch the original file' }, { status: 500 })
    }

    const arrayBuffer = await response.arrayBuffer()
    
    // Attempt to load as PDF
    let pdfDoc;
    try {
      pdfDoc = await PDFDocument.load(arrayBuffer)
    } catch (e) {
      // If it's not a valid PDF (maybe it's a corrupted file or an image), just return the original
      return new NextResponse(arrayBuffer, {
        headers: {
          'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
          'Content-Disposition': 'attachment',
        }
      })
    }

    // 2. Generate QR Code pointing to the note page
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tunoteshub.com'
    const targetUrl = noteId ? `${baseUrl}/download/${noteId}` : baseUrl
    
    // Generate QR code as a PNG buffer
    const qrCodeDataUrl = await QRCode.toDataURL(targetUrl, { 
      errorCorrectionLevel: 'M',
      margin: 1,
      color: { dark: '#000000', light: '#FFFFFF' }
    })
    const qrBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64')
    const qrImage = await pdfDoc.embedPng(qrBuffer)
    const qrDims = qrImage.scale(0.5) // Scale down the QR code

    // 3. Apply Watermark to every page
    const pages = pdfDoc.getPages()
    
    for (const page of pages) {
      const { width, height } = page.getSize()

      // A. Center Diagonal Text Watermark (Subtle Theft Protection)
      // Uses Dark Gray (0.2), 15% opacity, and diagonal layout
      page.drawText('TU Notes Hub', {
        x: width / 2 - 150,
        y: height / 2 - 50,
        size: 60,
        color: rgb(0.2, 0.2, 0.2), 
        rotate: degrees(45),
        opacity: 0.15, // 15% opacity
      })

      // B. Bottom Left Website Link (Subtle Branding)
      page.drawText('tunoteshub.com', {
        x: 40,
        y: 20,
        size: 10,
        color: rgb(0.3, 0.3, 0.3),
        opacity: 0.7,
      })

      // C. Bottom Right QR Code
      page.drawImage(qrImage, {
        x: width - qrDims.width - 20,
        y: 20,
        width: qrDims.width,
        height: qrDims.height,
        opacity: 0.85,
      })
      
      // D. "Scan to view" text under QR code
      page.drawText('tunoteshub.com', {
        x: width - qrDims.width - 15,
        y: 8,
        size: 8,
        color: rgb(0.3, 0.3, 0.3),
      })
    }

    // 4. Save and return the modified PDF
    const pdfBytes = await pdfDoc.save()
    
    const filename = url.searchParams.get('filename') || 'TUNotes_Document'

    return new NextResponse(pdfBytes as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}.pdf"`,
      }
    })

  } catch (error) {
    console.error('Watermark API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
