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
  const urlParam = searchParams.get('url')
  const idParam = searchParams.get('id')
  const mode = searchParams.get('mode') || 'file'

  const url = urlParam || (idParam ? `https://drive.google.com/file/d/${idParam}/view` : null)

  if (!url) {
    return NextResponse.json({ error: 'Missing url or id parameter' }, { status: 400 })
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

    // If Google Drive returns the virus scan warning page, it typically sets a cookie named 'download_warning_...'
    // Or we can fetch the HTML, extract the confirm=XXXX token, and re-fetch.
    let contentType = (response.headers.get('content-type') || '').toLowerCase()
    
    if (contentType.includes('text/html')) {
      const htmlText = await response.text()
      // Look for confirm=XXXX in the HTML (skipping confirm=t which is generic)
      const confirmMatch = htmlText.match(/confirm=([a-zA-Z0-9_-]{3,})/)
      
      if (confirmMatch && confirmMatch[1]) {
        const confirmToken = confirmMatch[1]
        const fileId = extractDriveFileId(url)
        const bypassUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=${confirmToken}`
        
        // Also extract cookies to send back
        const setCookie = response.headers.get('set-cookie') || ''
        const cookieStr = setCookie.split(';')[0]
        
        response = await fetch(bypassUrl, {
          redirect: 'follow',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Cookie': cookieStr
          },
        })
        contentType = (response.headers.get('content-type') || '').toLowerCase()
      } else {
        // If it's HTML but no confirm token, it might be a login page (restricted file)
        // Return a clear styled HTML page so the iframe displays a helpful card instead of a raw 403 error!
        const errorHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8" />
              <style>
                body { background: #090d16; color: white; font-family: system-ui, -apple-system, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; padding: 20px; box-sizing: border-box; }
                .card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); padding: 32px; border-radius: 16px; max-width: 480px; width: 100%; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
                .btn { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #6366f1, #06b6d4); color: white; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; margin-top: 16px; transition: transform 0.2s; }
                .btn:hover { transform: scale(1.03); }
              </style>
            </head>
            <body>
              <div class="card">
                <div style="font-size: 44px; margin-bottom: 12px;">🔒</div>
                <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 10px 0; color: #f8fafc;">Google Drive Access Restricted</h2>
                <p style="color: #94a3b8; font-size: 13.5px; line-height: 1.6; margin: 0;">
                  This Google Drive file permission is set to <strong>Private / Restricted</strong>. To view it inline, update Google Drive sharing settings to <strong>"Anyone with the link can view"</strong>, or click below to open directly.
                </p>
                <a href="${url}" target="_blank" class="btn">🔗 Open Directly in Google Drive ↗</a>
              </div>
            </body>
          </html>
        `
        return new NextResponse(errorHtml, {
          status: 200,
          headers: { 'Content-Type': 'text/html' }
        })
      }
    }

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch Drive file' }, { status: response.status })
    }

    contentType = (response.headers.get('content-type') || '').toLowerCase()

    if (mode === 'meta') {
      return NextResponse.json({
        contentType,
        fileName: response.headers.get('content-disposition') || '',
      })
    }

    let finalContentType = contentType
    if (finalContentType.includes('octet-stream') || finalContentType.includes('download')) {
      finalContentType = 'application/pdf'
    }

    // Stream the response directly to avoid out-of-memory errors on large files!
    return new NextResponse(response.body, {
      status: 200,
      headers: {
        'Content-Type': finalContentType,
        'Content-Disposition': 'inline',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
        // We cannot reliably send Content-Length when streaming without extracting it from the original response
        ...(response.headers.has('content-length') && { 'Content-Length': response.headers.get('content-length')! })
      },
    })
  } catch (error) {
    console.error('[DRIVE_PROXY]', error)
    return NextResponse.json({ error: 'Drive proxy error' }, { status: 500 })
  }
}