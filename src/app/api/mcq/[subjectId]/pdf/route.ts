import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib'
import QRCode from 'qrcode'

export const dynamic = 'force-dynamic'

function wrapText(text: string, font: any, fontSize: number, maxWidth: number): string[] {
  if (!text) return []
  const words = text.replace(/[\r\n]+/g, ' ').split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    const width = font.widthOfTextAtSize(testLine, fontSize)
    if (width <= maxWidth) {
      currentLine = testLine
    } else {
      if (currentLine) lines.push(currentLine)
      currentLine = word
    }
  }
  if (currentLine) lines.push(currentLine)
  return lines
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ subjectId: string }> }) {
  const { subjectId } = await params

  try {
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        mcqs: { orderBy: { createdAt: 'asc' } },
        semester: { include: { faculty: true } }
      }
    })

    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 })
    }

    const mcqs = subject.mcqs || []
    const cleanTitle = subject.title
      .replace(/\s*\(\s*(old syllabus|new syllabus|old|new)\s*\)/gi, '')
      .replace(/\s*(old syllabus|new syllabus)/gi, '')
      .trim()

    const facultyName = subject.semester?.faculty?.name || 'Faculty of Humanities & Social Sciences'
    const semName = subject.semester?.name || 'V'
    const years = Array.from(new Set(mcqs.map(m => m.year).filter(Boolean))).sort((a, b) => (b as number) - (a as number))
    const yearText = years.length > 0 ? String(years[0]) : String(new Date().getFullYear())

    // 1. Create PDF Document & embed fonts
    const pdfDoc = await PDFDocument.create()
    const fontTimes = await pdfDoc.embedFont(StandardFonts.TimesRoman)
    const fontTimesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)
    const fontTimesItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic)
    const fontHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontHelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    // 2. Generate QR code PNG
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tunoteshub.com'
    const targetUrl = `${baseUrl}/mcq/${subject.id}`
    const qrCodeDataUrl = await QRCode.toDataURL(targetUrl, {
      errorCorrectionLevel: 'M',
      margin: 1,
      color: { dark: '#000000', light: '#FFFFFF' }
    })
    const qrBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64')
    const qrImage = await pdfDoc.embedPng(qrBuffer)
    const qrDims = qrImage.scale(0.4)

    // Helper: Add new page with watermarks & header
    const addPageWithWatermarks = () => {
      const page = pdfDoc.addPage([595.28, 841.89]) // A4 Size
      const { width, height } = page.getSize()

      // Diagonal Center Watermark (Theft protection)
      page.drawText('TU Notes Hub', {
        x: width / 2 - 140,
        y: height / 2 - 40,
        size: 50,
        font: fontHelveticaBold,
        color: rgb(0.2, 0.2, 0.2),
        rotate: degrees(45),
        opacity: 0.12,
      })

      // Footer Website Link (Bottom Left)
      page.drawText('Downloaded from tunoteshub.com — Free TU Notes & Solution Hub', {
        x: 40,
        y: 20,
        size: 8,
        font: fontHelvetica,
        color: rgb(0.3, 0.3, 0.3),
        opacity: 0.8,
      })

      // Footer QR Code & link (Bottom Right)
      page.drawImage(qrImage, {
        x: width - qrDims.width - 40,
        y: 16,
        width: qrDims.width,
        height: qrDims.height,
        opacity: 0.9,
      })

      page.drawText('tunoteshub.com', {
        x: width - qrDims.width - 38,
        y: 6,
        size: 7,
        font: fontHelveticaBold,
        color: rgb(0.3, 0.3, 0.3),
      })

      return page
    }

    let currentPage = addPageWithWatermarks()
    let y = 790

    // ── Exam Header (Page 1) ──
    // TRIBHUVAN UNIVERSITY
    const t1 = 'TRIBHUVAN UNIVERSITY'
    const t1Width = fontTimesBold.widthOfTextAtSize(t1, 16)
    currentPage.drawText(t1, { x: (595.28 - t1Width) / 2, y, size: 16, font: fontTimesBold, color: rgb(0, 0, 0) })
    y -= 20

    // Faculty Name
    const t2 = facultyName
    const t2Width = fontTimes.widthOfTextAtSize(t2, 11)
    currentPage.drawText(t2, { x: (595.28 - t2Width) / 2, y, size: 11, font: fontTimes, color: rgb(0, 0, 0) })
    y -= 16

    // OFFICE OF THE DEAN
    const t3 = 'OFFICE OF THE DEAN'
    const t3Width = fontTimesBold.widthOfTextAtSize(t3, 12)
    currentPage.drawText(t3, { x: (595.28 - t3Width) / 2, y, size: 12, font: fontTimesBold, color: rgb(0, 0, 0) })
    y -= 18

    // Year
    const t4 = yearText
    const t4Width = fontTimesBold.widthOfTextAtSize(t4, 12)
    currentPage.drawText(t4, { x: (595.28 - t4Width) / 2, y, size: 12, font: fontTimesBold, color: rgb(0, 0, 0) })
    y -= 25

    // Metadata Row
    // Left side
    currentPage.drawText('Bachelor in Computer Application', { x: 45, y, size: 10.5, font: fontTimesBold, color: rgb(0, 0, 0) })
    currentPage.drawText('Full Marks: 60', { x: 460, y, size: 10.5, font: fontTimesBold, color: rgb(0, 0, 0) })
    y -= 15

    currentPage.drawText(`Course Title: ${cleanTitle}`, { x: 45, y, size: 10.5, font: fontTimesBold, color: rgb(0, 0, 0) })
    currentPage.drawText('Pass Marks: 24', { x: 460, y, size: 10.5, font: fontTimesBold, color: rgb(0, 0, 0) })
    y -= 15

    currentPage.drawText(`Code No: ${subject.code}`, { x: 45, y, size: 10.5, font: fontTimesBold, color: rgb(0, 0, 0) })
    currentPage.drawText('Time: 3 hours', { x: 460, y, size: 10.5, font: fontTimesBold, color: rgb(0, 0, 0) })
    y -= 15

    currentPage.drawText(`Semester: ${semName}`, { x: 45, y, size: 10.5, font: fontTimesBold, color: rgb(0, 0, 0) })
    y -= 15

    // Divider line
    currentPage.drawLine({
      start: { x: 45, y },
      end: { x: 550, y },
      thickness: 1,
      color: rgb(0, 0, 0),
    })
    y -= 22

    // Group A Title
    const gTitle = 'Group A (Multiple Choice Questions)'
    const gWidth = fontTimesBold.widthOfTextAtSize(gTitle, 11.5)
    currentPage.drawText(gTitle, { x: (595.28 - gWidth) / 2, y, size: 11.5, font: fontTimesBold, color: rgb(0, 0, 0) })
    y -= 18

    // Notice
    currentPage.drawText('Attempt all questions. Correct answers are highlighted in yellow.', { x: 45, y, size: 10, font: fontTimesItalic, color: rgb(0.2, 0.2, 0.2) })
    y -= 25

    // ── MCQ Questions Loop ──
    for (let i = 0; i < mcqs.length; i++) {
      const mcq = mcqs[i]
      const qNum = `${i + 1}. `
      const qLines = wrapText(`${qNum}${mcq.question}`, fontTimesBold, 10.5, 500)

      // Estimate required height for question + options + explanation
      const optionsArray = Array.isArray(mcq.options) ? (mcq.options as string[]) : []
      const estHeight = (qLines.length * 14) + (optionsArray.length * 20) + (mcq.explanation ? 30 : 0) + 20
      if (y - estHeight < 70) {
        currentPage = addPageWithWatermarks()
        y = 790
      }

      // Draw Question Lines
      for (const line of qLines) {
        currentPage.drawText(line, { x: 45, y, size: 10.5, font: fontTimesBold, color: rgb(0, 0, 0) })
        y -= 14
      }
      y -= 2

      // Draw Options
      for (let idx = 0; idx < optionsArray.length; idx++) {
        const optText = `${String.fromCharCode(97 + idx)}) ${optionsArray[idx]}`
        const optLines = wrapText(optText, fontTimes, 10, 480)
        const isCorrect = mcq.correctOption === idx

        if (y - (optLines.length * 14) < 65) {
          currentPage = addPageWithWatermarks()
          y = 790
        }

        const boxHeight = (optLines.length * 13) + 6

        if (isCorrect) {
          // Yellow Highlight Background for Correct Answer
          currentPage.drawRectangle({
            x: 60,
            y: y - boxHeight + 11,
            width: 485,
            height: boxHeight,
            color: rgb(1, 0.95, 0.8), // #fff3cd
            borderColor: rgb(1, 0.9, 0.65), // #ffeeba
            borderWidth: 1,
          })
        }

        // Draw Radio dot symbol
        currentPage.drawText(isCorrect ? '(•)' : '( )', {
          x: 65,
          y,
          size: 9.5,
          font: fontTimesBold,
          color: isCorrect ? rgb(0.52, 0.39, 0.02) : rgb(0.3, 0.3, 0.3),
        })

        // Draw Option Text
        for (let l = 0; l < optLines.length; l++) {
          currentPage.drawText(optLines[l], {
            x: 85,
            y: y - (l * 13),
            size: 10,
            font: isCorrect ? fontTimesBold : fontTimes,
            color: isCorrect ? rgb(0.52, 0.39, 0.02) : rgb(0.1, 0.1, 0.1),
          })
        }
        y -= (optLines.length * 13) + 5
      }

      // Draw Explanation if available
      if (mcq.explanation) {
        const expLines = wrapText(`Explanation: ${mcq.explanation}`, fontTimesItalic, 9.5, 470)
        const expHeight = (expLines.length * 12) + 8

        if (y - expHeight < 65) {
          currentPage = addPageWithWatermarks()
          y = 790
        }

        currentPage.drawRectangle({
          x: 65,
          y: y - expHeight + 10,
          width: 480,
          height: expHeight,
          color: rgb(0.95, 0.97, 1),
          borderColor: rgb(0.7, 0.85, 1),
          borderWidth: 1,
        })

        for (let l = 0; l < expLines.length; l++) {
          currentPage.drawText(expLines[l], {
            x: 75,
            y: y - (l * 12),
            size: 9.5,
            font: fontTimesItalic,
            color: rgb(0.1, 0.25, 0.45),
          })
        }
        y -= (expLines.length * 12) + 8
      }

      y -= 14 // Margin between questions
    }

    // ── Final Page Footer Branding ──
    // Final Thank You & Website Link Footer
    if (y < 100) {
      currentPage = addPageWithWatermarks()
      y = 790
    }
    y -= 10
    currentPage.drawLine({ start: { x: 45, y }, end: { x: 550, y }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) })
    y -= 16

    const footerNotice = `Downloaded from TU Notes Hub — https://tunoteshub.com`
    const fnWidth = fontHelveticaBold.widthOfTextAtSize(footerNotice, 9)
    currentPage.drawText(footerNotice, { x: (595.28 - fnWidth) / 2, y, size: 9, font: fontHelveticaBold, color: rgb(0.3, 0.3, 0.3) })

    // Save PDF Bytes
    const pdfBytes = await pdfDoc.save()
    const safeTitle = cleanTitle.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_')
    const filename = `TUNotes_MCQ_${safeTitle}_${yearText}.pdf`

    return new NextResponse(pdfBytes as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      }
    })

  } catch (error) {
    console.error('MCQ PDF API Error:', error)
    return NextResponse.json({ error: 'Failed to generate MCQ PDF' }, { status: 500 })
  }
}
