// src/app/api/upload-drive/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { uploadFileToDriveNative } from '@/lib/googleDrive'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Call native Google Drive API upload
    const uploadResult = await uploadFileToDriveNative(file)

    return NextResponse.json({
      success: true,
      driveLink: uploadResult.driveLink,
      fileId: uploadResult.fileId,
      fileName: uploadResult.fileName,
      fileSize: uploadResult.fileSize
    })

  } catch (error: any) {
    console.error('[GOOGLE DRIVE UPLOAD ERROR]', error)
    return NextResponse.json(
      { error: error?.message || 'Google Drive upload failed' },
      { status: 500 }
    )
  }
}
