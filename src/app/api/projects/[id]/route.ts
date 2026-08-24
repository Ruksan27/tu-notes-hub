import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const project = await prisma.projectItem.findUnique({
      where: { id: params.id }
    })
    
    if (!project) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ project })
  } catch (error) {
    console.error('[PROJECT_GET_ID]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
