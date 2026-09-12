// src/app/api/file-proxy/route.ts
// Server-side proxy: fetches files from Cloudinary and streams them through our domain.
// This bypasses browser CORS, CSP, and X-Frame-Options restrictions completely.
import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

export const dynamic = 'force-dynamic'

function getCloudinaryAccounts() {
  let accounts: Array<{ cloud_name: string; api_key: string; api_secret: string }> = []
  try {
    const accountsStr = process.env.CLOUDINARY_ACCOUNTS || '[]'
    const parsed = JSON.parse(accountsStr)
    if (Array.isArray(parsed) && parsed.length > 0) {
      accounts = parsed
    }
  } catch {}

  if (accounts.length === 0 && process.env.CLOUDINARY_API_SECRET) {
    accounts = [{
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '',
      api_key: process.env.CLOUDINARY_API_KEY || '',
      api_secret: process.env.CLOUDINARY_API_SECRET,
    }]
  }
  return accounts
}

/**
 * Try to generate a signed Cloudinary URL for the given URL.
 * Works for BOTH /raw/upload/ and /image/upload/ paths.
 * Tries 'authenticated' delivery type first, then 'upload' (public).
 * Falls back to the original URL if signing fails or credentials are missing.
 */
function trySignCloudinaryUrl(rawUrl: string): string {
  // Already signed – nothing to do
  if (/\/s--/.test(rawUrl)) return rawUrl

  const accounts = getCloudinaryAccounts()
  if (accounts.length === 0) return rawUrl

  const isRaw = rawUrl.includes('/raw/upload/')
  const isImage = rawUrl.includes('/image/upload/')
  if (!isRaw && !isImage) return rawUrl

  try {
    // Extract cloud_name from URL (e.g. https://res.cloudinary.com/<cloud_name>/...)
    const match = rawUrl.match(/res\.cloudinary\.com\/([^/]+)\//)
    const urlCloudName = match ? match[1] : ''

    // Find the matching account, or fall back to default
    const account = accounts.find(a => a.cloud_name === urlCloudName) || accounts[0]
    if (!account?.api_secret) return rawUrl

    // Configure the SDK with the correct account credentials for this URL
    cloudinary.config({
      cloud_name: account.cloud_name,
      api_key: account.api_key,
      api_secret: account.api_secret,
      secure: true,
    })

    const uploadSegment = isRaw ? '/raw/upload/' : '/image/upload/'
    const afterUpload = rawUrl.split(uploadSegment)[1]
    if (!afterUpload) return rawUrl

    // Strip query-string
    const withoutQuery = afterUpload.split('?')[0]
    
    // Extract version if present (e.g. v1789117166)
    const versionMatch = withoutQuery.match(/^v(\d+)\//)
    const version = versionMatch ? versionMatch[1] : undefined
    
    // Strip leading version prefix for the public ID
    const publicId = withoutQuery.replace(/^v\d+\//, '')

    if (isRaw) {
      try {
        const downloadUrl = cloudinary.utils.private_download_url(publicId, '', {
          resource_type: 'raw',
          type: 'upload',
          expires_at: Math.floor(Date.now() / 1000) + 3600,
        })
        console.log('[FILE_PROXY_SIGN] Generated private download URL for raw asset:', downloadUrl)
        return downloadUrl
      } catch (err) {
        console.warn('[FILE_PROXY_SIGN] private_download_url failed:', err)
      }
    }

    // For images, try standard signed URLs
    for (const deliveryType of ['authenticated', 'upload'] as const) {
      try {
        const options: any = {
          resource_type: isImage ? 'image' : 'raw',
          type: deliveryType,
          sign_url: true,
          secure: true,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
        }
        
        if (version) {
          options.version = version
        }

        const signedUrl: string = cloudinary.url(publicId, options)
        return signedUrl
      } catch (innerErr) {
        // Try next type
      }
    }

    return rawUrl
  } catch (e) {
    console.error('[FILE_PROXY_SIGN] failed, falling back to unsigned URL:', e)
    return rawUrl
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  // Security: only allow Cloudinary URLs
  let safeUrl = url
  if (
    !safeUrl.startsWith('https://res.cloudinary.com') &&
    !safeUrl.startsWith('http://res.cloudinary.com')
  ) {
    return NextResponse.json({ error: 'Only Cloudinary URLs are allowed' }, { status: 403 })
  }

  // Force HTTPS
  safeUrl = safeUrl.replace(/^http:\/\//, 'https://')

  // Sign PDF URLs (handles both /raw/upload/ and /image/upload/ PDFs)
  const isPdf =
    safeUrl.includes('/raw/upload/') ||
    safeUrl.toLowerCase().includes('.pdf')

  const fetchUrl = isPdf ? trySignCloudinaryUrl(safeUrl) : safeUrl

  try {
    const response = await fetch(fetchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: '*/*',
      },
    })

    if (!response.ok) {
      console.error('[FILE_PROXY_ERROR]', safeUrl, response.status, '| fetchUrl:', fetchUrl)
      return NextResponse.json(
        { error: `Failed to fetch file (${response.status})` },
        { status: response.status }
      )
    }

    const filename = searchParams.get('filename')
    const isDownload = searchParams.get('download') === 'true'
    const contentType =
      response.headers.get('content-type') || 'application/octet-stream'

    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    }

    if (filename) {
      const cleanName = decodeURIComponent(filename).replace(/[^a-zA-Z0-9_\-.]/g, '_')
      const disposition = isDownload ? 'attachment' : 'inline'
      headers['Content-Disposition'] =
        `${disposition}; filename="${cleanName}"; filename*=UTF-8''${encodeURIComponent(cleanName)}`
    } else {
      headers['Content-Disposition'] = 'inline'
    }

    // Stream directly – avoids loading the full PDF into memory
    return new NextResponse(response.body, { status: 200, headers })
  } catch (error) {
    console.error('[FILE_PROXY]', error)
    return NextResponse.json({ error: 'Proxy error' }, { status: 500 })
  }
}
