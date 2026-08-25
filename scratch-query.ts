// scratch-query.ts
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const papers = await prisma.pastPaper.findMany({
    where: { year: 2020 },
    select: { id: true, year: true, cloudinaryUrl: true, extractedText: true }
  })
  console.log('PAPERS:', JSON.stringify(papers, null, 2))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
