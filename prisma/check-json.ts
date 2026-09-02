import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const paper = await prisma.pastPaper.findFirst({
    where: {
      extractedText: {
        contains: 'Computer Graphics and Animation'
      }
    }
  })

  if (paper && paper.extractedText) {
    console.log("Found paper:", paper.id)
    console.log("Extracted Text typeof:", typeof paper.extractedText)
    try {
      const parsed = JSON.parse(paper.extractedText)
      console.log("Parsed typeof:", typeof parsed)
      console.log("Has groups?", !!parsed.groups)
    } catch (e: any) {
      console.error("JSON.parse error:", e.message)
    }
  } else {
    console.log("Not found")
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
