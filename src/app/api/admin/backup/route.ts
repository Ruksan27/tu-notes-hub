// src/app/api/admin/backup/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Helper function to escape CSV cell values
function escapeCSV(val: any): string {
  if (val === null || val === undefined) return ''
  let str = String(val)
  // Replace double quotes with two double quotes
  str = str.replace(/"/g, '""')
  // If value contains comma, double quotes, or newline, wrap it in double quotes
  if (/[",\n\r]/.test(str)) {
    return `"${str}"`
  }
  return str
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const tableName = searchParams.get('table')

  if (!tableName) {
    return NextResponse.json({ error: 'Table name is required' }, { status: 400 })
  }

  let data: any[] = []
  let headers: string[] = []

  try {
    switch (tableName) {
      case 'user':
        data = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } })
        headers = ['id', 'name', 'email', 'role', 'packageType', 'isEmailVerified', 'subscriptionExpiresAt', 'createdAt']
        break
      case 'sellerProfile':
        data = await prisma.sellerProfile.findMany({ orderBy: { createdAt: 'desc' } })
        headers = ['id', 'userId', 'college', 'bio', 'experience', 'skills', 'isVerified', 'status', 'createdAt']
        break
      case 'payment':
        data = await prisma.payment.findMany({ orderBy: { createdAt: 'desc' } })
        headers = ['id', 'userId', 'transactionId', 'amount', 'status', 'packageBought', 'createdAt']
        break
      case 'faculty':
        data = await prisma.faculty.findMany()
        headers = ['id', 'name', 'slug', 'icon', 'systemType', 'visible']
        break
      case 'subject':
        data = await prisma.subject.findMany()
        headers = ['id', 'title', 'code', 'semesterId']
        break
      case 'note':
        data = await prisma.note.findMany({ orderBy: { createdAt: 'desc' } })
        headers = ['id', 'title', 'description', 'cloudinaryUrl', 'fileSize', 'noteType', 'isPremium', 'author', 'subjectId', 'createdAt']
        break
      case 'pastPaper':
        data = await prisma.pastPaper.findMany({ orderBy: { createdAt: 'desc' } })
        headers = ['id', 'title', 'year', 'examType', 'subjectId', 'createdAt']
        break
      case 'projectItem':
        data = await prisma.projectItem.findMany({ orderBy: { createdAt: 'desc' } })
        headers = ['id', 'title', 'description', 'originalPrice', 'discountPercentage', 'sellerId', 'createdAt']
        break
      case 'projectOrder':
        data = await prisma.projectOrder.findMany({ orderBy: { createdAt: 'desc' } })
        headers = ['id', 'buyerId', 'projectId', 'amountPaid', 'paymentStatus', 'createdAt']
        break
      default:
        return NextResponse.json({ error: 'Unsupported table name' }, { status: 400 })
    }

    // Convert data to CSV format
    const csvRows = [headers.join(',')]
    for (const item of data) {
      const values = headers.map(header => escapeCSV(item[header]))
      csvRows.push(values.join(','))
    }
    const csvContent = csvRows.join('\n')

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="backup_${tableName}_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error: any) {
    console.error('Backup error:', error)
    return NextResponse.json({ error: 'Failed to generate backup: ' + error.message }, { status: 500 })
  }
}
