import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PDFDocument, rgb, degrees } from 'pdf-lib'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const blogId = searchParams.get('blogId')

  if (!blogId) {
    return new NextResponse('Blog ID is required', { status: 400 })
  }

  try {
    const blog = await prisma.blog.findUnique({
      where: { id: blogId }
    })

    if (!blog || !blog.fileUrl) {
      return new NextResponse('File not found for this blog', { status: 404 })
    }

    // 1. Fetch the remote PDF
    const pdfResponse = await fetch(blog.fileUrl)
    if (!pdfResponse.ok) {
      return new NextResponse('Failed to fetch the remote file', { status: 500 })
    }
    
    // Check if it's a PDF (basic check)
    const contentType = pdfResponse.headers.get('content-type')
    if (!contentType?.includes('application/pdf')) {
      // If it's not a PDF, we can't watermark it using pdf-lib. Just redirect to the raw file.
      return NextResponse.redirect(blog.fileUrl)
    }

    const pdfArrayBuffer = await pdfResponse.arrayBuffer()

    // 2. Load PDF into pdf-lib
    const pdfDoc = await PDFDocument.load(pdfArrayBuffer)

    // Embed standard font
    const helveticaFont = await pdfDoc.embedFont('Helvetica-Bold')

    // 3. Apply Watermark to all pages
    const pages = pdfDoc.getPages()
    const watermarkText = 'TU Notes Hub'

    for (const page of pages) {
      const { width, height } = page.getSize()
      const fontSize = 60
      const textWidth = helveticaFont.widthOfTextAtSize(watermarkText, fontSize)
      
      // Calculate center position and rotation
      const x = (width - textWidth) / 2
      const y = height / 2

      page.drawText(watermarkText, {
        x: x,
        y: y,
        size: fontSize,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5),
        opacity: 0.3, // 30% opacity for watermark
        rotate: degrees(45),
      })
      
      // Add a smaller footer watermark
      page.drawText('Downloaded from tunoteshub.com', {
        x: 40,
        y: 20,
        size: 10,
        font: helveticaFont,
        color: rgb(0.3, 0.3, 0.3),
        opacity: 0.5
      })
    }

    // 4. Serialize and send
    const watermarkedPdfBytes = await pdfDoc.save()

    // Generate a clean filename
    const safeTitle = blog.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()
    const filename = `${safeTitle}_tunoteshub.pdf`

    return new NextResponse(Buffer.from(watermarkedPdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store'
      }
    })

  } catch (error) {
    console.error('Watermarking Error:', error)
    return new NextResponse('Internal Server Error during watermarking', { status: 500 })
  }
}
