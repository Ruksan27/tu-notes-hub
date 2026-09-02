import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Cleaning up duplicate/legacy old syllabus subjects...')
  
  // Find all subjects that start with CACS/CAST/etc but DO NOT have "(Old Syllabus)" in their title
  const subjectsToDelete = await prisma.subject.findMany({
    where: {
      AND: [
        {
          OR: [
            { code: { startsWith: 'CACS' } },
            { code: { startsWith: 'CAST' } },
            { code: { startsWith: 'CAMT' } },
            { code: { startsWith: 'CASO' } },
            { code: { startsWith: 'CAEN' } },
            { code: { startsWith: 'CAAC' } },
            { code: { startsWith: 'CAPJ' } },
            { code: { startsWith: 'CAEC' } },
            { code: { startsWith: 'CAMG' } },
            { code: { startsWith: 'CAIN' } },
            { code: { startsWith: 'CAOR' } },
          ]
        },
        {
          NOT: {
            title: {
              contains: '(Old Syllabus)'
            }
          }
        },
        {
          NOT: {
            title: {
              contains: '(Old)'
            }
          }
        }
      ]
    }
  })

  console.log(`Found ${subjectsToDelete.length} legacy subjects to delete.`)
  
  for (const subject of subjectsToDelete) {
    console.log(`Deleting ${subject.code}: ${subject.title}`)
    try {
      // Delete related records first
      await prisma.note.deleteMany({ where: { subjectId: subject.id } })
      await prisma.pastPaper.deleteMany({ where: { subjectId: subject.id } })
      await prisma.solutionBook.deleteMany({ where: { subjectId: subject.id } })
      await prisma.cheatsheet.deleteMany({ where: { subjectId: subject.id } })
      
      // Delete the subject
      await prisma.subject.delete({ where: { id: subject.id } })
      console.log(`Deleted successfully.`)
    } catch (e: any) {
      console.error(`Error deleting ${subject.code}:`, e.message)
    }
  }

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
