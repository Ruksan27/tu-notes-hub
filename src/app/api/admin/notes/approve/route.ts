// src/app/api/admin/notes/approve/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { extractTextFromPdfUrl } from '@/lib/gemini';
import { sendSubmissionStatusEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const admin = await getCurrentUser();
    if (!admin || (admin.role !== 'ADMIN' && admin.role !== 'CHILD_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 401 });
    }

    const body = await req.json();
    const { noteId, action, rejectionReason, customPoints } = body;

    if (!noteId) {
      return NextResponse.json({ error: 'noteId is required' }, { status: 400 });
    }

    const note = await prisma.note.findUnique({
      where: { id: noteId }
    });

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    const pointsToAward = customPoints ?? (note.awardedPoints > 0 ? note.awardedPoints : 20);

    if (action === 'APPROVE') {
      // 1. Update Note status to APPROVED
      let updatedNote;
      try {
        updatedNote = await prisma.note.update({
          where: { id: noteId },
          data: {
            status: 'APPROVED',
            awardedPoints: pointsToAward,
            rejectionReason: null,
          }
        });
      } catch (err: any) {
        updatedNote = await prisma.note.update({
          where: { id: noteId },
          data: {
            awardedPoints: pointsToAward,
            rejectionReason: null,
          }
        });
      }

      // 2. TRIGGER OCR MODEL IN BACKGROUND FOR APPROVED NOTE/PAPER/MCQ
      if (note.cloudinaryUrl && (!note.extractedText || note.extractedText.trim().length === 0)) {
        void (async () => {
          try {
            console.log(`[OCR PIPELINE] Starting Gemini OCR extraction for approved Note ${note.id}...`);
            const text = await extractTextFromPdfUrl(note.cloudinaryUrl);
            if (text && text.trim().length > 0) {
              await prisma.note.update({
                where: { id: note.id },
                data: { extractedText: text }
              });
              console.log(`[OCR PIPELINE SUCCESS] Successfully extracted text for Note ${note.id} (${text.length} chars)`);
            }
          } catch (ocrErr) {
            console.error(`[OCR PIPELINE ERROR] Failed OCR for Note ${note.id}:`, ocrErr);
          }
        })();
      }

      // 3. Find Submitting User by email (note.author)
      if (note.author) {
        const user = await prisma.user.findFirst({
          where: { email: note.author }
        });

        // Fetch subject & semester details for rich notification
        const fullNote = await prisma.note.findUnique({
          where: { id: noteId },
          include: {
            subject: {
              include: {
                semester: {
                  include: { faculty: true }
                }
              }
            }
          }
        });

        const subCode = fullNote?.subject?.code ? `[${fullNote.subject.code}] ` : '';
        const subTitle = fullNote?.subject?.title ? fullNote.subject.title.replace(/\s*\(.*?\)/gi, '').trim() : '';
        const semName = fullNote?.subject?.semester?.name || '';
        const detailStr = [semName, `${subCode}${subTitle}`].filter(Boolean).join(' · ');

        const isSubAdmin = user?.role === 'CHILD_ADMIN' || user?.role === 'ADMIN';

        if (user && !isSubAdmin) {
          // Credit points ONLY to regular Students
          await prisma.user.update({
            where: { id: user.id },
            data: {
              rewardPoints: { increment: pointsToAward }
            }
          });

          // Log Point Transaction
          await prisma.pointTransaction.create({
            data: {
              userId: user.id,
              amount: pointsToAward,
              reason: `NOTE_APPROVED: ${note.title}`
            }
          });

          // Send Email Notification
          await sendSubmissionStatusEmail(
            user.email,
            user.name || 'Student',
            note.title,
            'APPROVED',
            pointsToAward
          ).catch(e => console.error('Failed to send approval email', e));

          // Send Notification
          await prisma.notification.create({
            data: {
              type: 'NOTE_APPROVED',
              title: 'Material Approved & Points Credited! 🎉',
              message: `Your submitted material "${note.title}" (${detailStr}) has been approved! +${pointsToAward} Reward Points credited to your account.`,
              link: '/dashboard',
            }
          });
        } else if (user && isSubAdmin) {
          // Notification for Sub-Admins / Admins (No Points awarded)
          await prisma.notification.create({
            data: {
              type: 'NOTE_APPROVED',
              title: 'Sub-Admin Material Approved! ✅',
              message: `Your uploaded material "${note.title}" (${detailStr}) has been approved by Main Admin. OCR text extraction is running in background.`,
              link: '/admin',
            }
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: `Material "${note.title}" approved successfully! OCR extraction triggered.`,
        note: updatedNote
      });
    }

    if (action === 'REJECT') {
      const reasonText = rejectionReason?.trim() || 'Content did not meet quality guidelines.'
      let updatedNote;
      try {
        updatedNote = await prisma.note.update({
          where: { id: noteId },
          data: {
            status: 'REJECTED',
            rejectionReason: reasonText,
          }
        });
      } catch (err: any) {
        updatedNote = await prisma.note.update({
          where: { id: noteId },
          data: {
            rejectionReason: reasonText,
          }
        });
      }

      // Send Notification to submitter if user exists
      if (note.author) {
        const user = await prisma.user.findFirst({
          where: { email: note.author }
        });

        if (user) {
          // Send Email Notification
          await sendSubmissionStatusEmail(
            user.email,
            user.name || 'Student',
            note.title,
            'REJECTED',
            0,
            reasonText
          ).catch(e => console.error('Failed to send rejection email', e));

          await prisma.notification.create({
            data: {
              type: 'NOTE_REJECTED',
              title: 'Material Submission Rejected ❌',
              message: `Your submitted material "${note.title}" was rejected. Reason: "${reasonText}"`,
              link: '/dashboard/notes/upload',
            }
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: `Material "${note.title}" rejected. Reason: "${reasonText}"`,
        note: updatedNote
      });
    }

    return NextResponse.json({ error: 'Invalid action. Must be APPROVE or REJECT' }, { status: 400 });

  } catch (error: any) {
    console.error('[ADMIN APPROVE NOTE ERROR]', error);
    return NextResponse.json({ error: error?.message || 'Failed to process note approval' }, { status: 500 });
  }
}
