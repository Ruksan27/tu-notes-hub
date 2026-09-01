const fs = require('fs')
const path = require('path')

const trendsDir = path.join(__dirname, 'src', 'app', 'trends')
const backupDir = path.join(__dirname, 'seo_engine_backup')

try {
  if (fs.existsSync(trendsDir)) {
    if (fs.existsSync(backupDir)) {
      fs.rmSync(backupDir, { recursive: true, force: true })
    }
    fs.renameSync(trendsDir, backupDir)
    console.log('Successfully moved trends directory to seo_engine_backup!')
  } else {
    console.log('trends directory does not exist in src/app.')
  }
} catch (err) {
  console.error('Failed to move trends directory:', err)
}
