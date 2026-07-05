// src/lib/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function uploadToCloudinary(
  fileBuffer: Buffer,
  folder: string,
  resourceType: 'image' | 'raw' = 'raw'
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: `tu-notes-hub/${folder}`,
          resource_type: resourceType,
          allowed_formats: resourceType === 'raw' ? ['pdf', 'docx', 'doc', 'pptx', 'ppt', 'txt'] : ['jpg', 'jpeg', 'png', 'webp'],
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
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
}
