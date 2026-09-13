// src/lib/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary'

export async function uploadToCloudinary(
  fileBuffer: Buffer,
  folder: string,
  resourceType: 'image' | 'raw' = 'raw'
): Promise<{ url: string; publicId: string }> {
  
  // Parse accounts from .env
  const accountsStr = process.env.CLOUDINARY_ACCOUNTS || '[]'
  let accounts: any[] = []
  try {
    accounts = JSON.parse(accountsStr)
  } catch (e) {
    console.error('Failed to parse CLOUDINARY_ACCOUNTS')
  }

  if (accounts.length === 0) {
    throw new Error('No Cloudinary accounts configured')
  }

  // Randomly select an account for load balancing
  const account = accounts[Math.floor(Math.random() * accounts.length)]

  cloudinary.config({
    cloud_name: account.cloud_name,
    api_key: account.api_key,
    api_secret: account.api_secret,
  })

  const uploadOptions: any = {
    folder,
    resource_type: resourceType,
  }

  if (resourceType === 'image') {
    uploadOptions.allowed_formats = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'bmp', 'tiff']
  }

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        uploadOptions,
        (error, result) => {
          if (error || !result) return reject(error || new Error('Upload failed'))
          resolve({ url: result.secure_url, publicId: result.public_id })
        }
      )
      .end(fileBuffer)
  })
}

export async function deleteFromCloudinary(publicId: string, resourceType: 'image' | 'raw' = 'raw') {
  const accountsStr = process.env.CLOUDINARY_ACCOUNTS || '[]'
  let accounts: any[] = []
  try { accounts = JSON.parse(accountsStr) } catch (e) {}

  // Attempt deletion across all accounts until successful
  for (const account of accounts) {
    try {
      cloudinary.config({
        cloud_name: account.cloud_name,
        api_key: account.api_key,
        api_secret: account.api_secret,
      })

      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      })
      if (result.result === 'ok') break; // Successfully deleted from this account
    } catch (e) {
      // Ignore errors and try the next account
    }
  }
}

export function getCloudinaryAccounts() {
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

export function signCloudinaryUrl(rawUrl: string): string {
  if (!rawUrl || /\/s--/.test(rawUrl)) return rawUrl

  const accounts = getCloudinaryAccounts()
  if (accounts.length === 0) return rawUrl

  const isRaw = rawUrl.includes('/raw/upload/')
  const isImage = rawUrl.includes('/image/upload/')
  if (!isRaw && !isImage) return rawUrl

  try {
    const match = rawUrl.match(/res\.cloudinary\.com\/([^/]+)\//)
    const urlCloudName = match ? match[1] : ''
    const account = accounts.find(a => a.cloud_name === urlCloudName) || accounts[0]
    if (!account?.api_secret) return rawUrl

    cloudinary.config({
      cloud_name: account.cloud_name,
      api_key: account.api_key,
      api_secret: account.api_secret,
      secure: true,
    })

    const uploadSegment = isRaw ? '/raw/upload/' : '/image/upload/'
    const afterUpload = rawUrl.split(uploadSegment)[1]
    if (!afterUpload) return rawUrl

    const withoutQuery = afterUpload.split('?')[0]
    const publicId = withoutQuery.replace(/^v\d+\//, '')

    if (isRaw) {
      try {
        const downloadUrl = cloudinary.utils.private_download_url(publicId, '', {
          resource_type: 'raw',
          type: 'upload',
          expires_at: Math.floor(Date.now() / 1000) + 3600,
        })
        return downloadUrl
      } catch (err) {
        console.warn('[CLOUDINARY_SIGN] private_download_url failed:', err)
      }
    }

    const versionMatch = withoutQuery.match(/^v(\d+)\//)
    const version = versionMatch ? versionMatch[1] : undefined

    for (const deliveryType of ['authenticated', 'upload'] as const) {
      try {
        const options: any = {
          resource_type: isImage ? 'image' : 'raw',
          type: deliveryType,
          sign_url: true,
          secure: true,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
        }
        if (version) options.version = version
        return cloudinary.url(publicId, options)
      } catch {}
    }

    return rawUrl
  } catch (e) {
    console.error('[CLOUDINARY_SIGN_ERROR]', e)
    return rawUrl
  }
}
