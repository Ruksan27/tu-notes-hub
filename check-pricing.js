const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const plan = await prisma.pricingPlan.findFirst({ where: { packageType: 'SEMESTER_PASS' } })
  console.log(plan)
}

main().catch(console.error).finally(() => prisma.$disconnect())
