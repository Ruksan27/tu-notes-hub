// Get a sample cloudinaryUrl from the database to test
const { PrismaClient } = require('@prisma/client')
require('dotenv').config({ path: '.env.local' })

const prisma = new PrismaClient()

async function main() {
  const note = await prisma.note.findFirst({ select: { cloudinaryUrl: true, title: true } })
  const paper = await prisma.pastPaper.findFirst({ select: { cloudinaryUrl: true } })
  const cheatsheet = await prisma.cheatsheet.findFirst({ select: { cloudinaryUrl: true, title: true } })
  
  console.log('=== SAMPLE URLS FROM DB ===')
  console.log('Note URL:', note?.cloudinaryUrl)
  console.log('PastPaper URL:', paper?.cloudinaryUrl)  
  console.log('Cheatsheet URL:', cheatsheet?.cloudinaryUrl)
  
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
