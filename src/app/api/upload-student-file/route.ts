// src/app/api/upload-student-file/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { uploadFileToDriveNative } from '@/lib/googleDrive'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized access. Please log in.' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const fileSizeBytes = file.size
    const fileSizeMB = fileSizeBytes / (1024 * 1024)

    // Rule: Max 25MB overall
    if (fileSizeMB > 25) {
      return NextResponse.json({
        error: 'File size exceeds 25MB limit. Please upload to Google Drive and paste the share link.'
      }, { status: 400 })
    }

    const fileName = file.name
    const ext = fileName.split('.').pop()?.toLowerCase() || ''
    const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'].includes(ext)

    // Rule 1: <= 10MB -> Upload to Cloudinary
    if (fileSizeMB <= 10) {
      console.log(`[FILE ROUTING] File "${fileName}" (${fileSizeMB.toFixed(2)}MB) <= 10MB -> Saving to Cloudinary...`)
      
      const fileBuffer = Buffer.from(await file.arrayBuffer())
      const resourceType = isImage ? 'image' : 'raw'
      
      const cloudinaryResult = await uploadToCloudinary(
        fileBuffer,
        'tu-notes-hub/student-uploads',
        resourceType
      )

      return NextResponse.json({
        success: true,
        url: cloudinaryResult.url,
        storage: 'CLOUDINARY',
        fileSize: `${fileSizeMB.toFixed(2)} MB`,
        fileName
      })
    } 
    // Rule 2: > 10MB and <= 25MB -> Upload to Google Drive
    else {
      console.log(`[FILE ROUTING] File "${fileName}" (${fileSizeMB.toFixed(2)}MB) > 10MB -> Saving to Google Drive...`)
      
      const driveResult = await uploadFileToDriveNative(file)

      return NextResponse.json({
        success: true,
        url: driveResult.driveLink,
        storage: 'DRIVE',
        fileSize: `${fileSizeMB.toFixed(2)} MB`,
        fileName: driveResult.fileName
      })
    }

  } catch (error: any) {
    console.error('[STUDENT FILE UPLOAD ROUTE ERROR]', error)
    return NextResponse.json(
      { error: error?.message || 'File upload failed. Please try again.' },
      { status: 500 }
    )
  }
}
