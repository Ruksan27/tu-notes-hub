// src/app/api/admin/notes/pending/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const admin = await getCurrentUser();
    if (!admin || (admin.role !== 'ADMIN' && admin.role !== 'CHILD_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filterStatus = searchParams.get('status') || 'PENDING'; // 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'

    let whereClause: any = {};
    if (filterStatus !== 'ALL') {
      whereClause = { status: filterStatus };
    }

    // Fetch notes matching status filter
    const rawNotes = await prisma.note.findMany({
      where: whereClause,
      include: {
        subject: {
          include: {
            semester: {
              include: {
                faculty: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Also get counts for tabs
    const [pendingCount, approvedCount, rejectedCount] = await Promise.all([
      prisma.note.count({ where: { status: 'PENDING' } }),
      prisma.note.count({ where: { status: 'APPROVED' } }),
      prisma.note.count({ where: { status: 'REJECTED' } }),
    ]);

    // Enhance notes with author details if available
    const authorEmails = Array.from(new Set(rawNotes.map(n => n.author).filter(Boolean))) as string[];
    const users = await prisma.user.findMany({
      where: { email: { in: authorEmails } },
      select: { email: true, name: true, avatarUrl: true, college: true }
    });

    const userMap = new Map(users.map(u => [u.email, u]));

    const notes = rawNotes.map(n => ({
      ...n,
      authorUser: n.author ? userMap.get(n.author) || null : null
    }));

    return NextResponse.json({
      success: true,
      notes,
      counts: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        total: pendingCount + approvedCount + rejectedCount
      }
    });

  } catch (error: any) {
    console.error('[ADMIN PENDING NOTES GET ERROR]', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch pending submissions' }, { status: 500 });
  }
}
