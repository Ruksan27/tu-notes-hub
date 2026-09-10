// src/app/api/student/notes/submit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NoteType } from '@prisma/client';

// GET: Fetch all faculties with semesters & subjects for dynamic dropdown selection
export async function GET(req: NextRequest) {
  try {
    const rawFaculties = await prisma.faculty.findMany({
      include: {
        semesters: {
          orderBy: { order: 'asc' },
          include: {
            subjects: {
              select: { id: true, title: true, code: true }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    const faculties = rawFaculties.map((fac) => {
      const activeSemesters = fac.semesters
        .filter((sem) => sem.visible !== false)
        .map((sem) => {
          const visibleNew = sem.visibleNew !== false;
          const visibleOld = sem.visibleOld !== false;

          const filteredSubjects = sem.subjects.filter((sub) => {
            const isNew = sub.title.includes('New Syllabus') || sub.code.startsWith('BCA ');
            const isOld =
              sub.title.includes('Old Syllabus') ||
              sub.code.startsWith('CACS') ||
              sub.code.startsWith('CAMT') ||
              sub.code.startsWith('CASO') ||
              sub.code.startsWith('CAEN') ||
              sub.code.startsWith('CAAC') ||
              sub.code.startsWith('CAST') ||
              sub.code.startsWith('CAPJ') ||
              sub.code.startsWith('CAEC') ||
              sub.code.startsWith('CAMG') ||
              sub.code.startsWith('CAIN') ||
              sub.code.startsWith('CAOR');

            if (isNew && !visibleNew) return false;
            if (isOld && !visibleOld) return false;
            return true;
          });

          return {
            ...sem,
            subjects: filteredSubjects,
          };
        });

      return {
        ...fac,
        semesters: activeSemesters,
      };
    });

    return NextResponse.json({ faculties });
  } catch (error: any) {
    console.error('[SUBMIT NOTES GET ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch faculties' }, { status: 500 });
  }
}

// POST: Submit a note with rate limiting (Max 4/day), file size routing, and PENDING status
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Please log in to upload notes and earn reward points.' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      facultyId, 
      semesterId, 
      subjectId, 
      subjectName, 
      title, 
      description, 
      noteType = 'HANDWRITTEN', 
      fileSizeMB = 0, 
      cloudinaryUrl, 
      driveUrl 
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // ── 1. RATE LIMIT CHECK: Max 4 uploads per user in the last 24 hours ──
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentUploadCount = await prisma.note.count({
      where: {
        author: user.email,
        createdAt: { gte: twentyFourHoursAgo }
      }
    });

    if (recentUploadCount >= 4) {
      return NextResponse.json({ 
        error: 'Spam Protection: You have reached the maximum limit of 4 uploads per day (24 hours). Please try again tomorrow!' 
      }, { status: 429 });
    }

    // ── 2. FILE SIZE ROUTING & VALIDATION ──
    if (fileSizeMB > 25) {
      return NextResponse.json({ 
        error: 'File size exceeds 25MB limit. Please compress the file or share via Google Drive link instead.' 
      }, { status: 400 });
    }

    let finalUrl = cloudinaryUrl || driveUrl;
    if (!finalUrl || finalUrl === 'https://drive.google.com') {
      return NextResponse.json({ error: 'Please upload a valid file or provide a working external link.' }, { status: 400 });
    }

    // ── 3. MAP NOTE TYPE TO PRISMA ENUM ──
    const validTypes: NoteType[] = [
      'HANDWRITTEN', 'SLIDES_PPT', 'PDF_BOOK', 'SHORT_NOTES', 
      'PROJECT_WORK', 'PROJECT', 'GUIDE', 'LAB_WORK', 'SYLLABUS', 'MCQ_FILE'
    ];
    
    let resolvedNoteType: NoteType = 'HANDWRITTEN';
    if (validTypes.includes(noteType as NoteType)) {
      resolvedNoteType = noteType as NoteType;
    }

    // Calculate points preview for this note type (Balanced Rate System)
    let pointsPreview = 20; // Default for HANDWRITTEN
    if (['PDF_BOOK', 'GUIDE', 'PROJECT_WORK', 'PROJECT'].includes(resolvedNoteType)) pointsPreview = 25;
    else if (resolvedNoteType === 'HANDWRITTEN') pointsPreview = 20;
    else if (resolvedNoteType === 'LAB_WORK' || resolvedNoteType === 'MCQ_FILE') pointsPreview = 15;
    else if (resolvedNoteType === 'SHORT_NOTES' || resolvedNoteType === 'SLIDES_PPT') pointsPreview = 10;
    else if (resolvedNoteType === 'SYLLABUS') pointsPreview = 5;

    // ── 4. RESOLVE SUBJECT ID ──
    let targetSubjectId = subjectId;

    if (!targetSubjectId) {
      let firstSubject = await prisma.subject.findFirst({
        where: { title: { contains: subjectName || 'General' } }
      });
      if (firstSubject) {
        targetSubjectId = firstSubject.id;
      } else {
        const fallback = await prisma.subject.findFirst();
        if (fallback) {
          targetSubjectId = fallback.id;
        } else {
          return NextResponse.json({ error: 'No valid subject found. Please select a subject.' }, { status: 400 });
        }
      }
    }

    // ── 5. CREATE NOTE WITH STATUS 'PENDING' (WITH GRACEFUL FALLBACK) ──
    let note;
    try {
      note = await prisma.note.create({
        data: {
          title: title.trim(),
          description: description || '',
          cloudinaryUrl: finalUrl,
          fileSize: fileSizeMB ? `${fileSizeMB.toFixed(1)} MB` : 'Link',
          status: 'PENDING',
          awardedPoints: pointsPreview,
          noteType: resolvedNoteType,
          isPremium: false,
          author: user.email,
          subjectId: targetSubjectId,
        }
      });
    } catch (createErr: any) {
      if (createErr?.message?.includes('status') || createErr?.message?.includes('Unknown argument')) {
        console.warn('[SUBMIT NOTE] Stale Prisma client detected, creating note with default status schema.');
        note = await prisma.note.create({
          data: {
            title: title.trim(),
            description: description || '',
            cloudinaryUrl: finalUrl,
            fileSize: fileSizeMB ? `${fileSizeMB.toFixed(1)} MB` : 'Link',
            awardedPoints: pointsPreview,
            noteType: resolvedNoteType,
            isPremium: false,
            author: user.email,
            subjectId: targetSubjectId,
          }
        });
      } else {
        throw createErr;
      }
    }

    // Notify Admins of new pending submission
    await prisma.notification.create({
      data: {
        type: 'NOTE_SUBMISSION',
        title: `New ${resolvedNoteType.replace(/_/g, ' ')} Submission`,
        message: `${user.name} (${user.email}) submitted "${title.trim()}". Pending Admin approval (OCR will run on approval).`,
        link: '/admin?tab=materials',
      }
    });

    return NextResponse.json({ 
      success: true, 
      note,
      remainingUploadsToday: 4 - (recentUploadCount + 1),
      message: `Submitted successfully! Pending Admin review before +${pointsPreview} Points and OCR extraction are processed.`
    });

  } catch (error: any) {
    console.error('[SUBMIT NOTE POST ERROR]', error);
    if (error?.message?.includes('column') && error?.message?.includes('does not exist')) {
      return NextResponse.json({
        error: 'Database schema sync required! Please run "npx prisma db push" in your terminal to update database tables.'
      }, { status: 500 });
    }
    return NextResponse.json({ error: error?.message || 'Failed to submit note' }, { status: 500 });
  }
}
