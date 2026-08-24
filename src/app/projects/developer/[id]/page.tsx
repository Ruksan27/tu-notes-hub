import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import DeveloperProfileClient from './DeveloperProfileClient'

export const dynamic = 'force-dynamic'

export default async function SellerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const currentUser = await getCurrentUser()

  const seller = await prisma.user.findUnique({
    where: { id },
    include: {
      sellerProfile: true,
      projectsListed: {
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  if (!seller || !seller.sellerProfile) {
    notFound()
  }

  // Map database response to strict types required by the Client component
  const typedSeller = {
    id: seller.id,
    name: seller.name,
    email: seller.email,
    sellerProfile: seller.sellerProfile,
    projectsListed: seller.projectsListed.map(p => ({
      id: p.id,
      title: p.title,
      shortDescription: p.shortDescription,
      projectType: p.projectType,
      originalPrice: p.originalPrice
    }))
  }

  const typedCurrentUser = currentUser ? {
    id: currentUser.userId,
    role: currentUser.role
  } : null

  return (
    <DeveloperProfileClient seller={typedSeller} currentUser={typedCurrentUser} />
  )
}

