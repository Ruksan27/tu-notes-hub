// src/app/api/upload-drive/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { google } from 'googleapis'
import { Readable } from 'stream'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== 'ADMIN' && user.role !== 'CHILD_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 })
    }

    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
    let privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID

    if (!email || !privateKey || !folderId) {
      return NextResponse.json(
        { error: 'Google Drive configuration missing on server' },
        { status: 500 }
      )
    }

    // Unescape newlines in private key if formatted as literal \n in env
    privateKey = privateKey.replace(/\\n/g, '\n')

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Authenticate with Google Service Account
    const auth = new google.auth.JWT({
      email,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive']
    })

    const drive = google.drive({ version: 'v3', auth })

    // Convert Web File to Node Readable Stream
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const stream = new Readable()
    stream.push(buffer)
    stream.push(null)

    // 1. Upload File to Google Drive Folder
    const response = await drive.files.create({
      requestBody: {
        name: file.name,
        parents: [folderId],
      },
      media: {
        mimeType: file.type || 'application/octet-stream',
        body: stream,
      },
      fields: 'id, name, webViewLink, webContentLink',
    })

    const fileId = response.data.id
    if (!fileId) {
      throw new Error('Failed to obtain File ID from Google Drive response')
    }

    // 2. Set file permissions so anyone with link can view/download
    try {
      await drive.permissions.create({
        fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      })
    } catch (permError) {
      console.warn('[DRIVE PERMISSION WARNING]', permError)
    }

    const driveLink = `https://drive.google.com/file/d/${fileId}/view?usp=sharing`
    const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}`

    return NextResponse.json({
      success: true,
      fileId,
      driveLink,
      webViewLink: response.data.webViewLink || driveLink,
      webContentLink: response.data.webContentLink || directUrl,
      fileName: response.data.name || file.name,
      fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`
    })

  } catch (error: any) {
    console.error('[GOOGLE DRIVE UPLOAD ERROR]', error)
    return NextResponse.json(
      { error: error?.message || 'Google Drive upload failed' },
      { status: 500 }
    )
  }
}
