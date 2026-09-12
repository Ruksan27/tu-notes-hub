import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const notes = await prisma.note.findMany({
    where: {
      title: {
        contains: 'lab'
      }
    },
    include: {
      subject: true
    }
  })

  console.log("Found notes count:", notes.length)
  for (const n of notes) {
    console.log(`ID: ${n.id} | Title: ${n.title} | NoteType: ${n.noteType} | URL: ${n.cloudinaryUrl}`)
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
