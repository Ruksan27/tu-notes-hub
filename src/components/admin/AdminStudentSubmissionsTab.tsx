'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  CheckCircle2, XCircle, Clock, FileText, ExternalLink, 
  Sparkles, Award, User, BookOpen, RefreshCw, Trash2, Eye, ShieldAlert
} from 'lucide-react';

export default function AdminStudentSubmissionsTab() {
  const [notes, setNotes] = useState<any[]>([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [ocrRunningId, setOcrRunningId] = useState<string | null>(null);
  const [rejectingNoteId, setRejectingNoteId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchSubmissions();
  }, [filterStatus]);

  async function fetchSubmissions() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/notes/pending?status=${filterStatus}`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes || []);
        if (data.counts) {
          setCounts(data.counts);
        }
      } else {
        toast.error('Failed to load student submissions');
      }
    } catch {
      toast.error('Network error loading submissions');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(noteId: string) {
    setActionLoadingId(noteId);
    try {
      const res = await fetch('/api/admin/notes/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId, action: 'APPROVE' })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Note Approved! Rewards credited and background OCR triggered. 🎉');
        fetchSubmissions();
      } else {
        toast.error(data.error || 'Failed to approve note');
      }
    } catch {
      toast.error('Network error during note approval');
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleConfirmReject() {
    if (!rejectingNoteId) return;
    setActionLoadingId(rejectingNoteId);
    try {
      const res = await fetch('/api/admin/notes/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          noteId: rejectingNoteId, 
          action: 'REJECT',
          rejectionReason: rejectionReason || 'Content did not meet verification guidelines.'
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.info('Note submission rejected');
        setRejectingNoteId(null);
        setRejectionReason('');
        fetchSubmissions();
      } else {
        toast.error(data.error || 'Failed to reject note');
      }
    } catch {
      toast.error('Network error during note rejection');
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleRunOcr(id: string, label: string) {
    setOcrRunningId(id);
    toast.info('Extracting text using Gemini AI... ⏳', { autoClose: 8000 });
    try {
      const res = await fetch('/api/admin/materials/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type: 'note' })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`OCR Success! Extracted ${data.extractedTextLength.toLocaleString()} characters 🎉`);
        fetchSubmissions();
      } else {
        toast.error(data.error || 'OCR failed');
      }
    } catch {
      toast.error('Network error during OCR');
    } finally {
      setOcrRunningId(null);
    }
  }

  async function handleDeleteNote(id: string, title: string) {
    if (!window.confirm(`⚠️ Permanently delete submission "${title}"?`)) return;
    try {
      const res = await fetch(`/api/admin/materials?id=${id}&type=note`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Deleted submission successfully!');
        fetchSubmissions();
      } else {
        toast.error('Failed to delete');
      }
    } catch {
      toast.error('Network error');
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Info */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '16px', background: 'rgba(15,23,42,0.6)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '24px 28px'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#67e8f9', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
            <Award style={{ width: '15px', height: '15px' }} /> Dedicated Student Submission Review Queue
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#fff' }}>
            📥 Student Upload Approvals & Points Pipeline
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '13.5px', margin: '4px 0 0 0', maxWidth: '650px', lineHeight: 1.5 }}>
            Review, verify, and approve notes, MCQs, and past papers uploaded by students across all faculties. Approving credits reward points to student profiles and triggers automated Gemini OCR text extraction.
          </p>
        </div>

        <button
          onClick={() => fetchSubmissions()}
          style={{
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
            color: '#fff', padding: '10px 18px', borderRadius: '12px', fontSize: '13px',
            fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <RefreshCw style={{ width: '15px', height: '15px' }} /> Refresh Queue
        </button>
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div 
          onClick={() => setFilterStatus('PENDING')}
          style={{
            background: filterStatus === 'PENDING' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(15, 23, 42, 0.5)',
            border: `1px solid ${filterStatus === 'PENDING' ? '#f59e0b' : 'rgba(255, 255, 255, 0.08)'}`,
            borderRadius: '16px', padding: '18px 20px', cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#fcd34d', textTransform: 'uppercase' }}>⏳ Pending Review</span>
            <Clock style={{ width: '18px', height: '18px', color: '#f59e0b' }} />
          </div>
          <div style={{ fontSize: '32px', fontWeight: 900, color: '#fcd34d' }}>{counts.pending}</div>
        </div>

        <div 
          onClick={() => setFilterStatus('APPROVED')}
          style={{
            background: filterStatus === 'APPROVED' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(15, 23, 42, 0.5)',
            border: `1px solid ${filterStatus === 'APPROVED' ? '#22c55e' : 'rgba(255, 255, 255, 0.08)'}`,
            borderRadius: '16px', padding: '18px 20px', cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#4ade80', textTransform: 'uppercase' }}>✅ Approved Notes</span>
            <CheckCircle2 style={{ width: '18px', height: '18px', color: '#22c55e' }} />
          </div>
          <div style={{ fontSize: '32px', fontWeight: 900, color: '#4ade80' }}>{counts.approved}</div>
        </div>

        <div 
          onClick={() => setFilterStatus('REJECTED')}
          style={{
            background: filterStatus === 'REJECTED' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(15, 23, 42, 0.5)',
            border: `1px solid ${filterStatus === 'REJECTED' ? '#ef4444' : 'rgba(255, 255, 255, 0.08)'}`,
            borderRadius: '16px', padding: '18px 20px', cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#f87171', textTransform: 'uppercase' }}>❌ Rejected Notes</span>
            <XCircle style={{ width: '18px', height: '18px', color: '#ef4444' }} />
          </div>
          <div style={{ fontSize: '32px', fontWeight: 900, color: '#f87171' }}>{counts.rejected}</div>
        </div>

        <div 
          onClick={() => setFilterStatus('ALL')}
          style={{
            background: filterStatus === 'ALL' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(15, 23, 42, 0.5)',
            border: `1px solid ${filterStatus === 'ALL' ? '#6366f1' : 'rgba(255, 255, 255, 0.08)'}`,
            borderRadius: '16px', padding: '18px 20px', cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#a5b4fc', textTransform: 'uppercase' }}>📋 Total Submitted</span>
            <FileText style={{ width: '18px', height: '18px', color: '#818cf8' }} />
          </div>
          <div style={{ fontSize: '32px', fontWeight: 900, color: '#a5b4fc' }}>{counts.total}</div>
        </div>
      </div>

      {/* Rejection Modal */}
      {rejectingNoteId && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{
            background: '#0b192c', border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '20px', padding: '28px', maxWidth: '480px', width: '100%', color: '#fff'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 12px 0', color: '#f87171' }}>
              ❌ Reject Student Submission
            </h3>
            <p style={{ fontSize: '13.5px', color: '#94a3b8', marginBottom: '16px' }}>
              Specify the reason why this submission is being rejected. This reason will be sent to the student.
            </p>
            <textarea
              rows={3}
              placeholder="e.g. Blur pages, duplicate note, missing diagrams, or wrong subject category."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              style={{
                width: '100%', padding: '12px', borderRadius: '12px', background: '#050a14',
                border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '13.5px', outline: 'none', marginBottom: '20px'
              }}
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setRejectingNoteId(null)}
                style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 22px', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submissions List */}
      {loading ? (
        <div style={{ background: 'rgba(15,23,42,0.5)', borderRadius: '20px', padding: '60px', textAlign: 'center' }}>
          <span className="spinner" style={{ width: '28px', height: '28px' }} />
          <p style={{ color: '#94a3b8', marginTop: '12px', fontSize: '14px' }}>Loading student submissions...</p>
        </div>
      ) : notes.length === 0 ? (
        <div style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '60px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: '0 0 8px 0' }}>No {filterStatus} Submissions Found</h3>
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
            {filterStatus === 'PENDING' ? 'Great job! All student submissions have been reviewed and processed.' : 'No notes match the selected status filter.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {notes.map((note) => {
            const hasText = Boolean(note.extractedText && note.extractedText.trim().length > 0);
            const isPending = note.status === 'PENDING';
            const isApproved = note.status === 'APPROVED';
            const isRejected = note.status === 'REJECTED';
            const pts = note.awardedPoints > 0 ? note.awardedPoints : 20;

            const facName = note.subject?.semester?.faculty?.name || 'General';
            const semName = note.subject?.semester?.name || '';
            const subTitle = note.subject?.title || 'Subject';
            const subCode = note.subject?.code || '';

            return (
              <div
                key={note.id}
                style={{
                  background: isPending ? 'rgba(15, 23, 42, 0.8)' : 'rgba(15, 23, 42, 0.4)',
                  border: `1px solid ${isPending ? 'rgba(245, 158, 11, 0.35)' : isApproved ? 'rgba(34, 197, 94, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                  borderRadius: '20px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  boxShadow: isPending ? '0 8px 24px rgba(245,158,11,0.06)' : 'none'
                }}
              >
                {/* Top Row: Category badges & Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc', fontSize: '11.5px', fontWeight: 700, padding: '4px 10px', borderRadius: '8px' }}>
                      🎓 {facName}
                    </span>
                    <span style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)', color: '#67e8f9', fontSize: '11.5px', fontWeight: 700, padding: '4px 10px', borderRadius: '8px' }}>
                      🗓️ {semName}
                    </span>
                    <span style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#e2e8f0', fontSize: '11.5px', fontWeight: 600, padding: '4px 10px', borderRadius: '8px' }}>
                      📘 [{subCode}] {subTitle}
                    </span>
                    <span style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#fcd34d', fontSize: '11.5px', fontWeight: 700, padding: '4px 10px', borderRadius: '8px' }}>
                      🏷️ {note.noteType?.replace(/_/g, ' ')} (+{pts} PTS)
                    </span>
                  </div>

                  <div>
                    {isPending && <span style={{ background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.4)', color: '#fcd34d', fontSize: '12px', fontWeight: 800, padding: '6px 14px', borderRadius: '999px' }}>⏳ PENDING APPROVAL</span>}
                    {isApproved && <span style={{ background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.4)', color: '#4ade80', fontSize: '12px', fontWeight: 800, padding: '6px 14px', borderRadius: '999px' }}>✅ APPROVED</span>}
                    {isRejected && <span style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171', fontSize: '12px', fontWeight: 800, padding: '6px 14px', borderRadius: '999px' }}>❌ REJECTED</span>}
                  </div>
                </div>

                {/* Middle Row: Content & Submitter Details */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  {/* Left: Material Info */}
                  <div>
                    <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#fff', margin: '0 0 6px 0' }}>
                      {note.title}
                    </h3>
                    {note.description && (
                      <p style={{ color: '#94a3b8', fontSize: '13.5px', margin: '0 0 12px 0', lineHeight: 1.5 }}>
                        {note.description}
                      </p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12.5px', color: '#64748b' }}>
                      <span>📦 Size: <strong style={{ color: '#cbd5e1' }}>{note.fileSize || 'Link'}</strong></span>
                      <span>📅 Date: <strong style={{ color: '#cbd5e1' }}>{new Date(note.createdAt).toLocaleString()}</strong></span>
                      {hasText && (
                        <span style={{ color: '#22d3ee', fontWeight: 600 }}>
                          ✨ OCR Extracted ({note.extractedText.length.toLocaleString()} chars)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Submitter Profile */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '50%',
                      background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                      color: '#fff', fontWeight: 800, fontSize: '18px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      {(note.authorUser?.name?.[0] || note.author?.[0] || 'U').toUpperCase()}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {note.authorUser?.name || 'Student Submitter'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#818cf8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {note.author || 'No email provided'}
                      </div>
                      {note.authorUser?.college && (
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                          🏫 {note.authorUser.college}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Actions */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  flexWrap: 'wrap', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px'
                }}>
                  {/* File Link Preview */}
                  <a
                    href={note.cloudinaryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)',
                      color: '#a5b4fc', padding: '8px 16px', borderRadius: '10px', fontSize: '13px',
                      fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px'
                    }}
                  >
                    <Eye style={{ width: '15px', height: '15px' }} /> View Submitted Document / Link
                    <ExternalLink style={{ width: '13px', height: '13px' }} />
                  </a>

                  {/* Primary Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {isPending ? (
                      <>
                        <button
                          onClick={() => handleApprove(note.id)}
                          disabled={actionLoadingId === note.id}
                          style={{
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            color: '#ffffff', border: 'none', borderRadius: '10px',
                            padding: '10px 22px', fontSize: '13px', fontWeight: 800,
                            cursor: actionLoadingId === note.id ? 'not-allowed' : 'pointer',
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                          }}
                        >
                          <CheckCircle2 style={{ width: '16px', height: '16px' }} />
                          {actionLoadingId === note.id ? 'Approving...' : `Approve & Award +${pts} PTS`}
                        </button>

                        <button
                          onClick={() => { setRejectingNoteId(note.id); setRejectionReason(''); }}
                          disabled={actionLoadingId === note.id}
                          style={{
                            background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#f87171', borderRadius: '10px', padding: '10px 18px', fontSize: '13px',
                            fontWeight: 700, cursor: actionLoadingId === note.id ? 'not-allowed' : 'pointer',
                            display: 'inline-flex', alignItems: 'center', gap: '6px'
                          }}
                        >
                          <XCircle style={{ width: '16px', height: '16px' }} /> Reject
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleRunOcr(note.id, note.title)}
                        disabled={ocrRunningId === note.id}
                        style={{
                          background: 'rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.3)',
                          color: '#67e8f9', borderRadius: '10px', padding: '8px 16px', fontSize: '12.5px',
                          fontWeight: 700, cursor: ocrRunningId === note.id ? 'not-allowed' : 'pointer',
                          display: 'inline-flex', alignItems: 'center', gap: '6px'
                        }}
                      >
                        <Sparkles style={{ width: '14px', height: '14px' }} />
                        {ocrRunningId === note.id ? 'Extracting Text...' : hasText ? 'Re-run Gemini AI OCR' : 'Run Gemini AI OCR'}
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteNote(note.id, note.title)}
                      style={{
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                        color: '#94a3b8', borderRadius: '10px', padding: '8px 12px', fontSize: '12.5px',
                        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px'
                      }}
                    >
                      <Trash2 style={{ width: '14px', height: '14px' }} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
