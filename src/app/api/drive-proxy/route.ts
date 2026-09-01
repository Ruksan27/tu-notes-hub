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

  return `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`
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
    let response = await fetch(safeUrl, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    })

    if (!response.ok) {
      const fileId = extractDriveFileId(url)
      if (fileId) {
        response = await fetch(`https://drive.usercontent.google.com/download?id=${fileId}&export=view&confirm=t`, {
          redirect: 'follow',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        })
      }
    }

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch Drive file' }, { status: response.status })
    }

    const contentType = (response.headers.get('content-type') || '').toLowerCase()

    if (mode === 'meta') {
      return NextResponse.json({
        contentType,
        fileName: response.headers.get('content-disposition') || '',
      })
    }

    const body = await response.arrayBuffer()
    const uint8 = new Uint8Array(body)

    let finalContentType = contentType
    // PNG magic bytes (0x89 0x50 0x4E 0x47)
    if (uint8.length >= 4 && uint8[0] === 0x89 && uint8[1] === 0x50 && uint8[2] === 0x4E && uint8[3] === 0x47) {
      finalContentType = 'image/png'
    }
    // JPEG magic bytes (0xFF 0xD8 0xFF)
    else if (uint8.length >= 3 && uint8[0] === 0xFF && uint8[1] === 0xD8 && uint8[2] === 0xFF) {
      finalContentType = 'image/jpeg'
    }
    // GIF magic bytes (0x47 0x49 0x46)
    else if (uint8.length >= 3 && uint8[0] === 0x47 && uint8[1] === 0x49 && uint8[2] === 0x46) {
      finalContentType = 'image/gif'
    }
    // PDF magic bytes %PDF- (0x25 0x50 0x44 0x46 0x2D)
    else if (uint8.length >= 5 && uint8[0] === 0x25 && uint8[1] === 0x50 && uint8[2] === 0x44 && uint8[3] === 0x46 && uint8[4] === 0x2D) {
      finalContentType = 'application/pdf'
    }
    else if (finalContentType.includes('octet-stream') || finalContentType.includes('download')) {
      finalContentType = 'application/pdf'
    }

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': finalContentType,
        'Content-Disposition': 'inline',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
        'Content-Length': body.byteLength.toString(),
      },
    })
  } catch (error) {
    console.error('[DRIVE_PROXY]', error)
    return NextResponse.json({ error: 'Drive proxy error' }, { status: 500 })
  }
}