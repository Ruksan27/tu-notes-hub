const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('Cleaning up dummy links from the database...')

  // Clear dummy URLs in Notes
  const updatedNotes = await prisma.note.updateMany({
    where: {
      cloudinaryUrl: {
        contains: 'res.cloudinary.com/demo'
      }
    },
    data: {
      cloudinaryUrl: null
    }
  })
  console.log(`Cleared dummy links in ${updatedNotes.count} Notes.`)

  // Clear dummy URLs in PastPapers
  const updatedPapers = await prisma.pastPaper.updateMany({
    where: {
      cloudinaryUrl: {
        contains: 'res.cloudinary.com/demo'
      }
    },
    data: {
      cloudinaryUrl: null
    }
  })
  console.log(`Cleared dummy links in ${updatedPapers.count} Past Papers.`)

  console.log('Done cleaning up!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
