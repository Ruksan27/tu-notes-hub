const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const bca = await prisma.faculty.findUnique({ where: { slug: 'bca' }, include: { semesters: { include: { subjects: true } } } })
  if (!bca) { console.log('BCA not found'); return }
  
  for (const sem of bca.semesters) {
    console.log(`Semester ${sem.order}: visibleNew=${sem.visibleNew}, visibleOld=${sem.visibleOld}`)
    for (const sub of sem.subjects) {
      console.log(`  - ${sub.title}`)
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
