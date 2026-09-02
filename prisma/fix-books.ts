import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Fixing solution book titles...')
  
  const books = await prisma.solutionBook.findMany({
    where: {
      title: 'Static Solution Book'
    }
  })

  console.log(`Found ${books.length} books.`)
  
  for (const book of books) {
    await prisma.solutionBook.update({
      where: { id: book.id },
      data: {
        title: 'Static Solution Book (Old Syllabus)'
      }
    })
    console.log(`Updated book ${book.id} to have (Old Syllabus) in title.`)
  }

  console.log('Done fixing!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
