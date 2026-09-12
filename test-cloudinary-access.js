// Quick diagnostic: test if a Cloudinary URL is accessible and what type it is
// Run: node test-cloudinary-access.js <cloudinary_url>
const url = process.argv[2]
if (!url) {
  console.log('Usage: node test-cloudinary-access.js <cloudinary_url>')
  process.exit(1)
}

const { v2: cloudinary } = require('cloudinary')

cloudinary.config({
  cloud_name: 'dpfyit7rz',
  api_key: '413954286534876',
  api_secret: '9Xjr1PoGhBZi638Tao-Yku2nFnM',
})

async function test() {
  console.log('\n=== CLOUDINARY URL DIAGNOSTIC ===')
  console.log('URL:', url)
  
  // 1. Test direct access
  console.log('\n1. Testing direct access...')
  try {
    const res = await fetch(url)
    console.log('   Status:', res.status, res.statusText)
    console.log('   Content-Type:', res.headers.get('content-type'))
  } catch (e) {
    console.log('   Error:', e.message)
  }

  // Parse URL
  const isRaw = url.includes('/raw/upload/')
  const isImage = url.includes('/image/upload/')
  const uploadSegment = isRaw ? '/raw/upload/' : '/image/upload/'
  const afterUpload = url.split(uploadSegment)[1]
  const withoutQuery = afterUpload?.split('?')[0] || ''
  const versionMatch = withoutQuery.match(/^v(\d+)\//)
  const version = versionMatch ? versionMatch[1] : undefined
  const publicId = withoutQuery.replace(/^v\d+\//, '')
  const resourceType = isRaw ? 'raw' : 'image'
  
  console.log('\n   Parsed:')
  console.log('   publicId:', publicId)
  console.log('   resourceType:', resourceType)
  console.log('   version:', version)

  // 2. Test with 'upload' type signed URL
  for (const type of ['upload', 'authenticated']) {
    console.log(`\n2. Testing signed URL (type=${type})...`)
    try {
      const options = {
        resource_type: resourceType,
        type,
        sign_url: true,
        secure: true,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      }
      if (version) options.version = version
      
      const signedUrl = cloudinary.url(publicId, options)
      console.log('   Signed URL:', signedUrl.substring(0, 100) + '...')
      
      const res = await fetch(signedUrl)
      console.log('   Status:', res.status, res.statusText)
      if (res.ok) {
        console.log('   ✅ SUCCESS with type=' + type)
        break
      }
    } catch (e) {
      console.log('   Error:', e.message)
    }
  }
  
  // 3. Try Cloudinary API to get resource info
  console.log('\n3. Fetching resource info from Cloudinary API...')
  try {
    const info = await cloudinary.api.resource(publicId, { resource_type: resourceType })
    console.log('   type:', info.type)
    console.log('   access_mode:', info.access_mode)
    console.log('   secure_url:', info.secure_url?.substring(0, 80) + '...')
  } catch (e) {
    console.log('   Error (try authenticated type):', e.message)
    try {
      const info = await cloudinary.api.resource(publicId, { resource_type: resourceType, type: 'authenticated' })
      console.log('   type: authenticated ✅')
      console.log('   access_mode:', info.access_mode)
      console.log('   secure_url:', info.secure_url?.substring(0, 80) + '...')
    } catch (e2) {
      console.log('   Also failed for authenticated:', e2.message)
    }
  }
}

test().catch(console.error)
