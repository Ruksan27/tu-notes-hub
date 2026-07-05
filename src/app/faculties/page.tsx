// src/app/faculties/page.tsx
import { prisma } from '@/lib/prisma'
import type { Metadata } from 'next'
import FacultiesList from '@/components/FacultiesList'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'All TU Faculties — BCA, CSIT, BIT, BBS, BBA & More',
  description: 'Browse all Tribhuvan University faculties and access free study notes, past papers, and AI exam predictions.',
}

export default async function FacultiesPage() {
  let faculties: Array<{
    id: string
    name: string
    slug: string
    icon: string | null
    systemType: 'SEMESTER' | 'YEARLY'
    _count: { semesters: number }
  }> = []

  try {
    faculties = await prisma.faculty.findMany({
      where: { visible: true },
      orderBy: { name: 'asc' },
      include: { _count: { select: { semesters: true } } },
    })
  } catch {
    faculties = []
  }

  return (
    <div className="container" style={{ padding: '60px 24px' }}>
      {/* Header */}
      <div className="text-center" style={{ marginBottom: '56px' }}>
        <div className="badge badge-elite" style={{ marginBottom: '16px', display: 'inline-flex' }}>
          🏫 All Faculties
        </div>
        <h1 style={{ fontSize: 'clamp(32px,5vw,52px)', marginBottom: '16px' }}>
          Choose Your <span className="text-gradient">Faculty</span>
        </h1>
        <p style={{ color: 'var(--clr-text-2)', fontSize: '16px', maxWidth: '500px', margin: '0 auto' }}>
          Access free notes and past papers for all TU programs. Select your faculty to get started.
        </p>
      </div>

      {/* Interactive Faculties Search/List */}
      <FacultiesList initialFaculties={faculties as any} />
    </div>
  )
}
