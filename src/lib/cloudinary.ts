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

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          resource_type: resourceType,
          allowed_formats: resourceType === 'raw' ? ['pdf', 'docx', 'doc', 'pptx', 'ppt', 'txt'] : ['jpg', 'jpeg', 'png', 'webp'],
          // Provide credentials directly for this specific upload
          cloud_name: account.cloud_name,
          api_key: account.api_key,
          api_secret: account.api_secret
        },
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
      const result = await cloudinary.uploader.destroy(publicId, { 
        resource_type: resourceType,
        cloud_name: account.cloud_name,
        api_key: account.api_key,
        api_secret: account.api_secret
      })
      if (result.result === 'ok') break; // Successfully deleted from this account
    } catch (e) {
      // Ignore errors and try the next account
    }
  }
}
