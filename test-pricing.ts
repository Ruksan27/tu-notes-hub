import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function test() {
  try {
    const plans = await prisma.pricingPlan.findMany()
    console.log('Plans found:', plans.length)
    if (plans.length === 0) {
      console.log('Would seed plans...')
    } else {
      console.log(plans)
    }
  } catch (err) {
    console.error('Error:', err)
  } finally {
    await prisma.$disconnect()
  }
}

test()
