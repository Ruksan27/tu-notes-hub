import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const books = await prisma.solutionBook.findMany({
    include: {
      subject: true,
      semester: true
    }
  })
  console.log(JSON.stringify(books, null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
