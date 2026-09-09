import { getGoogleDriveAccessToken } from './src/lib/googleDrive'

async function makePublic() {
  try {
    const fileId = '1QKcuZiZia6E3ODa55bFOFMquOk6ovuFK'
    const accessToken = await getGoogleDriveAccessToken()
    console.log('Got token:', accessToken.substring(0, 10) + '...')
    
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
  } catch (err) {
    console.error('Error:', err)
  }
}

makePublic()
