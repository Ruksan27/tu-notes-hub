export async function getGoogleDriveAccessToken(): Promise<string> {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Google Drive OAuth credentials are not configured in .env.local')
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  const tokenData = await tokenRes.json()
  if (!tokenRes.ok || !tokenData.access_token) {
    throw new Error(tokenData.error_description || tokenData.error || 'Failed to authenticate with Google')
  }

  return tokenData.access_token
}

/**
 * Uploads a file to Google Drive using native multipart upload REST API
 */
export async function uploadFileToDriveNative(file: File) {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID
  if (!folderId) {
    throw new Error('GOOGLE_DRIVE_FOLDER_ID is missing in .env.local')
  }

  const accessToken = await getGoogleDriveAccessToken()
  const fileBuffer = Buffer.from(await file.arrayBuffer())

  // Multipart upload payload
  const metadata = {
    name: file.name,
    parents: [folderId],
  }

  const boundary = 'foo_bar_baz_' + Math.random().toString(36).substring(2)
  const delimiter = `\r\n--${boundary}\r\n`
  const closeDelimiter = `\r\n--${boundary}--`

  let contentType = file.type
  if (!contentType || contentType === 'application/octet-stream') {
    if (file.name.toLowerCase().endsWith('.pdf')) {
      contentType = 'application/pdf'
    } else if (file.name.toLowerCase().match(/\.(jpg|jpeg)$/)) {
      contentType = 'image/jpeg'
    } else if (file.name.toLowerCase().endsWith('.png')) {
      contentType = 'image/png'
    } else {
      contentType = 'application/octet-stream'
    }
  }

  const multipartRequestBody = Buffer.concat([
    Buffer.from(
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${contentType}\r\n\r\n`
    ),
    fileBuffer,
    Buffer.from(closeDelimiter),
  ])

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  )

  const uploadData = await uploadRes.json()
  if (!uploadRes.ok || !uploadData.id) {
    throw new Error(uploadData.error?.message || 'Google Drive file upload failed')
  }

  const fileId = uploadData.id

  // Make file publicly readable
  try {
    const permRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
      }),
    })
    if (!permRes.ok) {
      const errText = await permRes.text()
      console.error('[DRIVE PERMISSION ERROR]', errText)
    } else {
      console.log('[DRIVE PERMISSION SUCCESS]', await permRes.json())
    }
  } catch (pErr) {
    console.warn('[DRIVE PERMISSION WARNING]', pErr)
  }

  const driveLink = `https://drive.google.com/file/d/${fileId}/preview`

  return {
    fileId,
    driveLink,
    fileName: uploadData.name || file.name,
    fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
  }
}


export async function deleteFileFromDriveNative(fileId: string) {
  try {
    const accessToken = await getGoogleDriveAccessToken()
    const deleteRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    if (deleteRes.ok || deleteRes.status === 404) {
      console.log(`[DRIVE DELETE SUCCESS] File ${fileId} deleted from Google Drive`)
      return true
    } else {
      const errData = await deleteRes.json().catch(() => ({}))
      console.warn(`[DRIVE DELETE FAILED] File ${fileId}:`, errData)
      return false
    }
  } catch (err) {
    console.warn(`[DRIVE DELETE ERROR]`, err)
    return false
  }
}
