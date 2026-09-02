import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Cleaning up duplicate/old subjects from database...')
  
  // Find subjects that don't have (New Syllabus) or (Old Syllabus) but share similarities
  // Specifically, CACS304 Introduction to Management which conflicts with CAMG304
  const badSubject = await prisma.subject.findFirst({
    where: {
      code: 'CACS304',
      title: 'Introduction to Management'
    }
  })

  if (badSubject) {
    console.log(`Found conflicting subject: ${badSubject.code} ${badSubject.title}`)
    
    // First, delete any related PastPapers, Notes, Cheatsheets if they exist (cascade should handle it if set, but let's be safe)
    await prisma.pastPaper.deleteMany({ where: { subjectId: badSubject.id } })
    await prisma.cheatsheet.deleteMany({ where: { subjectId: badSubject.id } })
    await prisma.solutionBook.deleteMany({ where: { subjectId: badSubject.id } })
    
    // Delete the subject
    await prisma.subject.delete({
      where: { id: badSubject.id }
    })
    console.log('Successfully deleted the conflicting subject.')
  } else {
    console.log('No conflicting CACS304 subject found.')
  }

  // General cleanup: If there are other subjects that don't belong, we could delete them,
  // but let's just delete this specific one that was shown in the screenshot.
  
  console.log('Cleanup finished.')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
