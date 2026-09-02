import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Cleaning up mock projects...')
  
  // Titles of the mock projects I added
  const mockTitles = [
    'E-commerce React & Node.js Platform',
    'Hospital Management System',
    'Student Attendance Tracker',
    'Food Delivery App (Flutter UI)'
  ]

  const mockProjects = await prisma.projectItem.findMany({
    where: {
      title: { in: mockTitles }
    }
  })

  if (mockProjects.length > 0) {
    const ids = mockProjects.map(p => p.id)
    
    await prisma.$transaction([
      prisma.cartItem.deleteMany({ where: { projectItemId: { in: ids } } }),
      prisma.projectOrder.deleteMany({ where: { projectItemId: { in: ids } } }),
      prisma.projectReview.deleteMany({ where: { projectId: { in: ids } } }),
      prisma.projectItem.deleteMany({ where: { id: { in: ids } } })
    ])
    
    console.log(`Successfully deleted ${mockProjects.length} mock projects.`)
  } else {
    console.log('No mock projects found.')
  }

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
