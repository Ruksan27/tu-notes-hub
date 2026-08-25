// src/app/api/drive-proxy/route.ts
// Server-side proxy for public Google Drive files.
// This lets the browser render the file from our own origin instead of embedding Drive directly.
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function extractDriveFileId(link: string): string | null {
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
    /\/uc\?(?:.*&)?id=([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
  ]

  for (const pattern of patterns) {
    const match = link.match(pattern)
    if (match?.[1]) return match[1]
  }

  return null
}

function resolveDriveUrl(url: string): string | null {
  const fileId = extractDriveFileId(url)
  if (!fileId) return null

  return `https://drive.google.com/uc?export=download&id=${fileId}`
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const url = searchParams.get('url')
  const mode = searchParams.get('mode') || 'file'

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  const safeUrl = resolveDriveUrl(url)
  if (!safeUrl) {
    return NextResponse.json({ error: 'Invalid Google Drive URL' }, { status: 400 })
  }

  try {
    const response = await fetch(safeUrl, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'TUNotesHub/1.0',
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch Drive file' }, { status: response.status })
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream'

    if (mode === 'meta') {
      return NextResponse.json({
        contentType,
        fileName: response.headers.get('content-disposition') || '',
      })
    }

    const body = await response.arrayBuffer()

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'X-Frame-Options': 'SAMEORIGIN',
        'Cache-Control': 'public, max-age=3600',
        'Content-Length': body.byteLength.toString(),
      },
    })
  } catch (error) {
    console.error('[DRIVE_PROXY]', error)
    return NextResponse.json({ error: 'Drive proxy error' }, { status: 500 })
  }
}