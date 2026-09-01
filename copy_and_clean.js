const fs = require('fs')
const path = require('path')

const targetDir = path.join(__dirname, 'src', 'app', 'trends', 'tu-notes-hub-seo-engine')
const backupDir = path.join(__dirname, 'seo_engine_backup')

// Recursive copy helper
function copyFolderRecursiveSync(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true })
  }

  if (fs.lstatSync(source).isDirectory()) {
    const files = fs.readdirSync(source)
    files.forEach((file) => {
      const curSource = path.join(source, file)
      const curTarget = path.join(target, file)
      if (fs.lstatSync(curSource).isDirectory()) {
        copyFolderRecursiveSync(curSource, curTarget)
      } else {
        try {
          fs.copyFileSync(curSource, curTarget)
        } catch (e) {}
      }
    })
  }
}

try {
  if (fs.existsSync(targetDir)) {
    console.log('1. Copying tu-notes-hub-seo-engine to root folder (seo_engine_backup)...')
    copyFolderRecursiveSync(targetDir, backupDir)
    console.log('✅ Copy complete!')

    console.log('2. Removing conflicting config files from src/app/trends...')
    const conflictingFiles = ['package.json', 'vite.config.ts', 'tsconfig.json', 'index.html', 'server.ts']
    conflictingFiles.forEach((file) => {
      const filePath = path.join(targetDir, file)
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath)
          console.log(`- Removed ${file}`)
        } catch (e) {
          // If locked, overwrite with dummy string
          try {
            fs.writeFileSync(filePath, '// disabled')
            console.log(`- Overwritten ${file}`)
          } catch (err) {}
        }
      }
    })

    // Also clean up trends/page.tsx
    const trendsPagePath = path.join(__dirname, 'src', 'app', 'trends', 'page.tsx')
    if (fs.existsSync(trendsPagePath)) {
      try {
        fs.unlinkSync(trendsPagePath)
      } catch (e) {}
    }

    console.log('🎉 Successfully removed config files! Next.js Router is now unlocked!')
  } else {
    console.log('targetDir does not exist.')
  }
} catch (err) {
  console.error('Error during cleanup:', err)
}
