const fs = require('fs');

async function getGoogleDriveAccessToken() {
  const envText = fs.readFileSync('.env.local', 'utf-8');
  const clientId = envText.match(/GOOGLE_OAUTH_CLIENT_ID="([^"]+)"/)?.[1];
  const clientSecret = envText.match(/GOOGLE_OAUTH_CLIENT_SECRET="([^"]+)"/)?.[1];
  const refreshToken = envText.match(/GOOGLE_OAUTH_REFRESH_TOKEN="([^"]+)"/)?.[1];

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}

async function makePublic() {
  try {
    const fileId = '1QKcuZiZia6E3ODa55bFOFMquOk6ovuFK';
    const accessToken = await getGoogleDriveAccessToken();
    console.log('Got token:', accessToken.substring(0, 10) + '...');
    
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
    });
    
    if (!permRes.ok) {
      const errText = await permRes.text();
      console.error('[DRIVE PERMISSION ERROR]', errText);
    } else {
      console.log('[DRIVE PERMISSION SUCCESS]', await permRes.json());
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

makePublic();
