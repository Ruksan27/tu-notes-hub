'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  UploadCloud, FileText, Gift, Award, CheckCircle2, 
  ArrowLeft, Info, BookOpen, ShieldAlert, Send, Clock, Sparkles, Lock, LogIn,
  Link2, HardDrive
} from 'lucide-react';
import { toast } from 'react-toastify';

export default function StudentNoteUploadPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [remainingUploads, setRemainingUploads] = useState<number | null>(4);
  // Upload mode: 'file' = direct file upload, 'link' = external link (Google Drive etc.)
  const [uploadMode, setUploadMode] = useState<'file' | 'link'>('file');

  // Dynamic Data States
  const [facultiesList, setFacultiesList] = useState<any[]>([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>('');
  const [semestersList, setSemestersList] = useState<any[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>('');
  const [subjectsList, setSubjectsList] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

  // Form State
  const [customSubjectName, setCustomSubjectName] = useState('');
  const [title, setTitle] = useState('');
  const [noteType, setNoteType] = useState('HANDWRITTEN');
  const [description, setDescription] = useState('');
  const [driveUrl, setDriveUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    // Check logged in user from localStorage and verify with server
    try {
      const stored = localStorage.getItem('tu_user');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {}

    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data && data.authenticated && data.user) {
          setUser(data.user);
          localStorage.setItem('tu_user', JSON.stringify(data.user));
        } else {
          setUser(null);
        }
      })
      .catch(() => {});

    // Fetch dynamic faculties list
    fetch('/api/student/notes/submit')
      .then((res) => res.json())
      .then((data) => {
        if (data.faculties && data.faculties.length > 0) {
          setFacultiesList(data.faculties);
          const firstFac = data.faculties[0];
          setSelectedFacultyId(firstFac.id);
          if (firstFac.semesters && firstFac.semesters.length > 0) {
            setSemestersList(firstFac.semesters);
            const firstSem = firstFac.semesters[0];
            setSelectedSemesterId(firstSem.id);
            if (firstSem.subjects) {
              setSubjectsList(firstSem.subjects);
            }
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load faculties:', err);
      })
      .finally(() => setFetchingData(false));
  }, []);

  // When faculty changes, update semesters & subjects
  const handleFacultyChange = (facId: string) => {
    setSelectedFacultyId(facId);
    const fac = facultiesList.find((f) => f.id === facId);
    if (fac && fac.semesters && fac.semesters.length > 0) {
      setSemestersList(fac.semesters);
      const firstSem = fac.semesters[0];
      setSelectedSemesterId(firstSem.id);
      setSubjectsList(firstSem.subjects || []);
      if (firstSem.subjects && firstSem.subjects.length > 0) {
        setSelectedSubjectId(firstSem.subjects[0].id);
      } else {
        setSelectedSubjectId('');
      }
    } else {
      setSemestersList([]);
      setSubjectsList([]);
      setSelectedSemesterId('');
      setSelectedSubjectId('');
    }
  };

  // When semester changes, update subjects
  const handleSemesterChange = (semId: string) => {
    setSelectedSemesterId(semId);
    const sem = semestersList.find((s) => s.id === semId);
    if (sem && sem.subjects) {
      setSubjectsList(sem.subjects);
      if (sem.subjects.length > 0) {
        setSelectedSubjectId(sem.subjects[0].id);
      } else {
        setSelectedSubjectId('');
      }
    } else {
      setSubjectsList([]);
      setSelectedSubjectId('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const fileSizeMB = file.size / (1024 * 1024);

      if (fileSizeMB > 25) {
        toast.error('❌ File size exceeds 25MB limit. Please upload to Google Drive and paste the link below instead.');
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('🔒 Account login required! Please log in to upload materials.');
      router.push('/login');
      return;
    }

    if (!title.trim()) {
      toast.error('Please enter a title for your material.');
      return;
    }

    if (!selectedFile && !driveUrl.trim()) {
      if (uploadMode === 'file') {
        toast.error('Please select a file to upload.');
      } else {
        toast.error('Please provide an external link (Google Drive, Dropbox, etc.).');
      }
      return;
    }

    if (uploadMode === 'link' && driveUrl.trim()) {
      // Basic URL validation
      try { new URL(driveUrl.trim()); } catch {
        toast.error('Please enter a valid URL (e.g. https://drive.google.com/...)');
        return;
      }
    }

    setLoading(true);

    try {
      const fileSizeMB = selectedFile ? selectedFile.size / (1024 * 1024) : 0;
      let finalFileUrl = driveUrl.trim();

      // Upload file if selected
      if (uploadMode === 'file' && selectedFile) {
        if (fileSizeMB <= 10) {
          toast.loading(`⚡ Uploading file (${fileSizeMB.toFixed(1)}MB)...`, { toastId: 'file-upload' });
        } else {
          toast.loading(`☁️ Uploading file (${fileSizeMB.toFixed(1)}MB)...`, { toastId: 'file-upload' });
        }

        const formData = new FormData();
        formData.append('file', selectedFile);

        const uploadRes = await fetch('/api/upload-student-file', {
          method: 'POST',
          body: formData,
        });

        const uploadData = await uploadRes.json();
        toast.dismiss('file-upload');

        if (!uploadRes.ok || !uploadData.url) {
          toast.error(uploadData.error || 'Failed to upload file. Please try again.');
          setLoading(false);
          return;
        }

        finalFileUrl = uploadData.url;
        toast.success('✅ File uploaded successfully!');
      }

      if (!finalFileUrl) {
        toast.error('File upload or external link is required.');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/student/notes/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facultyId: selectedFacultyId,
          semesterId: selectedSemesterId,
          subjectId: selectedSubjectId,
          subjectName: customSubjectName || subjectsList.find((s) => s.id === selectedSubjectId)?.title || 'General Subject',
          title,
          description,
          noteType,
          fileSizeMB,
          cloudinaryUrl: finalFileUrl,
          driveUrl: driveUrl.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          toast.error('🔒 Session expired. Please log in to submit materials.');
          router.push('/login');
        } else if (res.status === 429) {
          toast.error(`⚠️ ${data.error}`);
        } else {
          toast.error(data.error || 'Failed to submit material.');
        }
        return;
      }

      setSubmitted(true);
      if (data.remainingUploadsToday !== undefined) {
        setRemainingUploads(data.remainingUploadsToday);
      }
      toast.success('🎉 Material submitted for review!');

    } catch (err: any) {
      console.error(err);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #060913 0%, #0a0f1d 100%)',
      color: '#f8fafc',
      paddingTop: '32px',
      paddingBottom: '80px',
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 20px' }}>
        
        {/* Back Link */}
        <Link 
          href="/" 
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: '#94a3b8',
            fontSize: '14px',
            textDecoration: 'none',
            marginBottom: '24px',
            transition: 'color 0.2s',
          }}
        >
          <ArrowLeft style={{ width: '16px', height: '16px' }} /> Back to Home
        </Link>

        {/* Header Banner */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(6,182,212,0.15))',
          border: '1px solid rgba(99,102,241,0.25)',
          borderRadius: '20px',
          padding: '28px 32px',
          marginBottom: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
        }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)',
              padding: '4px 12px', borderRadius: '999px', fontSize: '12px', color: '#a5b4fc',
              fontWeight: 600, marginBottom: '12px',
            }}>
              <Award style={{ width: '14px', height: '14px' }} /> Contribute & Earn Rewards
            </div>
            <h1 style={{
              fontSize: '26px', fontWeight: 800, margin: '0 0 8px 0', color: '#ffffff',
              fontFamily: 'var(--font-display)',
            }}>
              Upload Notes, MCQs & Past Papers
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0, maxWidth: '540px', lineHeight: 1.6 }}>
              Share handwritten notes, solution sets, MCQs, or past papers across any faculty. Earn reward points upon Admin verification!
            </p>
          </div>

          <div style={{
            background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.08)',
            padding: '16px 20px', borderRadius: '16px', textAlign: 'center', minWidth: '160px',
          }}>
            <div style={{ fontSize: '30px', lineHeight: 1, marginBottom: '4px' }}>🎁</div>
            <div style={{ color: '#67e8f9', fontWeight: 800, fontSize: '18px' }}>Earn Rewards</div>
            <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>Per Verified Material</div>
          </div>
        </div>

        {/* ── Points & Anti-Spam Rules Cards ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}>
          {/* Rule 1: Point Generation Breakdown */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '18px 20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#67e8f9', fontWeight: 700, fontSize: '14px', marginBottom: '8px' }}>
              <Sparkles style={{ width: '16px', height: '16px' }} /> Point Reward Breakdown
            </div>
            <ul style={{ paddingLeft: '18px', margin: 0, color: '#94a3b8', fontSize: '13px', lineHeight: 1.7 }}>
              <li>📚 <strong>Books, Guides & Projects:</strong> +25 Points</li>
              <li>📝 <strong>Handwritten Study Notes:</strong> +20 Points</li>
              <li>🎯 <strong>MCQs & Lab Work Files:</strong> +15 Points</li>
              <li>📋 <strong>Short Notes & PPT Slides:</strong> +10 Points</li>
              <li>📊 <strong>Syllabus & Course Outline:</strong> +5 Points</li>
            </ul>
          </div>

          {/* Rule 2: Upload Limits & Approval */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '18px 20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a5b4fc', fontWeight: 700, fontSize: '14px', marginBottom: '8px' }}>
              <Clock style={{ width: '16px', height: '16px' }} /> Verification Pipeline
            </div>
            <ul style={{ paddingLeft: '18px', margin: 0, color: '#94a3b8', fontSize: '13px', lineHeight: 1.7 }}>
              <li>🛡️ <strong>Daily Upload Limit:</strong> Max 4 uploads per user / day</li>
              <li>⚡ <strong>Quick Review:</strong> Points credited on Admin approval</li>
              <li>🔒 <strong>Account Required:</strong> Must be logged in to claim points</li>
            </ul>
          </div>
        </div>

        {/* ── LOGIN REQUIRED GUARD (If not logged in) ── */}
        {!user ? (
          <div style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '20px',
            padding: '48px 32px',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px auto',
            }}>
              <Lock style={{ width: '32px', height: '32px' }} />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', marginBottom: '12px' }}>
              Account Login Required to Upload Materials
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '15px', maxWidth: '500px', margin: '0 auto 28px auto', lineHeight: 1.6 }}>
              Please log in or create a free TU Notes Hub account to submit your study materials, MCQs, or past papers and earn reward points!
            </p>
            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                href="/login"
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                  color: '#ffffff', padding: '12px 28px', borderRadius: '12px',
                  fontWeight: 700, fontSize: '15px', textDecoration: 'none',
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
                }}
              >
                <LogIn style={{ width: '18px', height: '18px' }} /> Log In to Continue
              </Link>
              <Link
                href="/register"
                style={{
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                  color: '#e2e8f0', padding: '12px 28px', borderRadius: '12px',
                  fontWeight: 600, fontSize: '15px', textDecoration: 'none', display: 'inline-block',
                }}
              >
                Create Free Account
              </Link>
            </div>
          </div>
        ) : submitted ? (
          <div style={{
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '20px',
            padding: '48px 32px',
            textAlign: 'center',
          }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px auto',
            }}>
              <CheckCircle2 style={{ width: '36px', height: '36px' }} />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', marginBottom: '12px' }}>
              Material Submitted for Review!
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '15px', maxWidth: '520px', margin: '0 auto 24px auto', lineHeight: 1.6 }}>
              Your submission has been queued for Admin verification. Once approved, reward points will be credited to your account!
            </p>
            {remainingUploads !== null && (
              <div style={{
                display: 'inline-block', background: 'rgba(99,102,241,0.12)',
                border: '1px solid rgba(99,102,241,0.25)', padding: '6px 16px',
                borderRadius: '999px', fontSize: '13px', color: '#a5b4fc', marginBottom: '28px',
              }}>
                Remaining uploads for today: <strong>{remainingUploads} / 4</strong>
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => { setSubmitted(false); setSelectedFile(null); setTitle(''); setDescription(''); }}
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  color: '#fff', padding: '12px 24px', borderRadius: '12px',
                  fontWeight: 600, fontSize: '14px', border: 'none', cursor: 'pointer',
                }}
              >
                Upload Another Item
              </button>
              <Link
                href="/dashboard"
                style={{
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#e2e8f0', padding: '12px 24px', borderRadius: '12px',
                  fontWeight: 600, fontSize: '14px', textDecoration: 'none', display: 'inline-block',
                }}
              >
                View Profile Points
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}>

            {/* Dynamic Faculty & Semester Selection */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}>
                  Faculty / Program <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={selectedFacultyId}
                  onChange={(e) => handleFacultyChange(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: '12px',
                    background: '#090d16', border: '1px solid rgba(255,255,255,0.12)',
                    color: '#fff', fontSize: '14px', outline: 'none',
                  }}
                >
                  {facultiesList.length > 0 ? (
                    facultiesList.map((fac) => (
                      <option key={fac.id} value={fac.id}>
                        {fac.name} ({fac.slug.toUpperCase()})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="BCA">BCA (Bachelor in Computer Applications)</option>
                      <option value="CSIT">BSc CSIT</option>
                      <option value="BIT">BIT</option>
                      <option value="BBS">BBS</option>
                      <option value="BBA">BBA</option>
                      <option value="BIM">BIM</option>
                      <option value="BBM">BBM</option>
                      <option value="MBBS">MBBS</option>
                      <option value="BHM">BHM</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}>
                  Semester / Year <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={selectedSemesterId}
                  onChange={(e) => handleSemesterChange(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: '12px',
                    background: '#090d16', border: '1px solid rgba(255,255,255,0.12)',
                    color: '#fff', fontSize: '14px', outline: 'none',
                  }}
                >
                  {semestersList.length > 0 ? (
                    semestersList.map((sem) => (
                      <option key={sem.id} value={sem.id}>
                        {sem.name}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="1st Semester">1st Semester</option>
                      <option value="2nd Semester">2nd Semester</option>
                      <option value="3rd Semester">3rd Semester</option>
                      <option value="4th Semester">4th Semester</option>
                      <option value="5th Semester">5th Semester</option>
                      <option value="6th Semester">6th Semester</option>
                      <option value="7th Semester">7th Semester</option>
                      <option value="8th Semester">8th Semester</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* Subject Name & Note Type */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}>
                  Subject Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                {subjectsList.length > 0 ? (
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: '12px',
                      background: '#090d16', border: '1px solid rgba(255,255,255,0.12)',
                      color: '#fff', fontSize: '14px', outline: 'none',
                    }}
                  >
                    {subjectsList.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.title} ({sub.code})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="e.g. C Programming, Financial Accounting"
                    value={customSubjectName}
                    onChange={(e) => setCustomSubjectName(e.target.value)}
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: '12px',
                      background: '#090d16', border: '1px solid rgba(255,255,255,0.12)',
                      color: '#fff', fontSize: '14px', outline: 'none',
                    }}
                  />
                )}
              </div>

              {/* Complete List of Material Types */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}>
                  Material Type <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={noteType}
                  onChange={(e) => setNoteType(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: '12px',
                    background: '#090d16', border: '1px solid rgba(255,255,255,0.12)',
                    color: '#fff', fontSize: '14px', outline: 'none',
                  }}
                >
                  <option value="HANDWRITTEN">📖 Handwritten Study Notes (+20 PTS)</option>
                  <option value="PDF_BOOK">📚 PDF Book / Reference Book (+25 PTS)</option>
                  <option value="GUIDE">📖 Guide & Solution Book (+25 PTS)</option>
                  <option value="PROJECT_WORK">🛠️ Project Work / Report (+25 PTS)</option>
                  <option value="MCQ_FILE">🎯 MCQ Question Collection File (+15 PTS)</option>
                  <option value="LAB_WORK">⚡ Lab Work / Practical File (+15 PTS)</option>
                  <option value="LAB_REPORT">🔬 Lab Report / Practical Report (+15 PTS)</option>
                  <option value="SHORT_NOTES">📋 Short Notes / Cheatsheet (+10 PTS)</option>
                  <option value="SLIDES_PPT">🖥️ Presentation Slides / PPT (+10 PTS)</option>
                  <option value="SYLLABUS">📊 Syllabus & Course Outline (+5 PTS)</option>
                </select>
              </div>
            </div>

            {/* Note Title */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}>
                Material Title / Topic <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Complete Unit 1 to 5 Handwritten Notes with Solutions & MCQs"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: '12px',
                  background: '#090d16', border: '1px solid rgba(255,255,255,0.12)',
                  color: '#fff', fontSize: '14px', outline: 'none',
                }}
              />
            </div>

            {/* Description */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}>
                Description (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Add any helpful details (e.g. includes board MCQs, handwritten diagrams, 2026 updated syllabus)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: '12px',
                  background: '#090d16', border: '1px solid rgba(255,255,255,0.12)',
                  color: '#fff', fontSize: '14px', outline: 'none', resize: 'vertical',
                }}
              />
            </div>

            {/* ── Upload Mode Tab Switcher ── */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '12px' }}>
                Upload Method <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
              }}>
                {/* Tab 1: Direct File Upload */}
                <button
                  type="button"
                  onClick={() => { setUploadMode('file'); setDriveUrl(''); }}
                  style={{
                    padding: '16px',
                    borderRadius: '14px',
                    border: uploadMode === 'file' ? '2px solid #6366f1' : '1px solid rgba(255,255,255,0.1)',
                    background: uploadMode === 'file' ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.02)',
                    color: uploadMode === 'file' ? '#a5b4fc' : '#94a3b8',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                    boxShadow: uploadMode === 'file' ? '0 0 20px rgba(99,102,241,0.2)' : 'none',
                  }}
                >
                  <HardDrive style={{ width: '26px', height: '26px', color: uploadMode === 'file' ? '#818cf8' : '#64748b' }} />
                  <span style={{ fontWeight: 700, fontSize: '13.5px' }}>Direct File Upload</span>
                  <span style={{ fontSize: '11px', color: uploadMode === 'file' ? '#818cf8' : '#475569', textAlign: 'center', lineHeight: 1.4 }}>PDF, DOCX, Image<br/>Max 25MB</span>
                </button>

                {/* Tab 2: External Link */}
                <button
                  type="button"
                  onClick={() => { setUploadMode('link'); setSelectedFile(null); }}
                  style={{
                    padding: '16px',
                    borderRadius: '14px',
                    border: uploadMode === 'link' ? '2px solid #06b6d4' : '1px solid rgba(255,255,255,0.1)',
                    background: uploadMode === 'link' ? 'rgba(6,182,212,0.1)' : 'rgba(255,255,255,0.02)',
                    color: uploadMode === 'link' ? '#67e8f9' : '#94a3b8',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                    boxShadow: uploadMode === 'link' ? '0 0 20px rgba(6,182,212,0.2)' : 'none',
                  }}
                >
                  <Link2 style={{ width: '26px', height: '26px', color: uploadMode === 'link' ? '#22d3ee' : '#64748b' }} />
                  <span style={{ fontWeight: 700, fontSize: '13.5px' }}>External Link</span>
                  <span style={{ fontSize: '11px', color: uploadMode === 'link' ? '#22d3ee' : '#475569', textAlign: 'center', lineHeight: 1.4 }}>Google Drive, Dropbox<br/>OneDrive, Any URL</span>
                </button>
              </div>
            </div>

            {/* ── FILE UPLOAD SECTION ── */}
            {uploadMode === 'file' && (
              <div style={{
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: '16px',
                padding: '20px',
                background: 'rgba(99,102,241,0.04)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <HardDrive style={{ width: '16px', height: '16px', color: '#818cf8' }} />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#a5b4fc' }}>Direct File Upload</span>
                  <span style={{ fontSize: '11px', color: '#475569', marginLeft: '4px' }}>• PDF, DOCX, PNG, JPG — Max 25MB</span>
                </div>
                <div
                  style={{
                    border: '2px dashed rgba(99, 102, 241, 0.35)',
                    borderRadius: '14px',
                    padding: '32px 20px',
                    textAlign: 'center',
                    background: 'rgba(99, 102, 241, 0.04)',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s, background 0.2s',
                  }}
                  onClick={() => document.getElementById('file-upload-input')?.click()}
                >
                  <input
                    id="file-upload-input"
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                  <UploadCloud style={{ width: '40px', height: '40px', color: '#6366f1', margin: '0 auto 12px auto' }} />
                  {selectedFile ? (
                    <div>
                      <p style={{ color: '#4ade80', fontWeight: 700, fontSize: '14px', margin: '0 0 4px 0' }}>
                        ✅ {selectedFile.name}
                      </p>
                      <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB — Ready to submit
                      </p>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                        style={{ marginTop: '10px', background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '4px 14px', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                      >
                        ✕ Remove File
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p style={{ color: '#e2e8f0', fontSize: '14px', fontWeight: 600, margin: '0 0 6px 0' }}>
                        Click to choose a file or drag & drop here
                      </p>
                      <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>
                        Supports PDF, DOCX, PNG, JPG — Max 25MB per file
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── EXTERNAL LINK SECTION ── */}
            {uploadMode === 'link' && (
              <div style={{
                border: '1px solid rgba(6,182,212,0.2)',
                borderRadius: '16px',
                padding: '20px',
                background: 'rgba(6,182,212,0.04)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <Link2 style={{ width: '16px', height: '16px', color: '#22d3ee' }} />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#67e8f9' }}>External Link Submission</span>
                </div>

                <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: 1.6, marginBottom: '16px' }}>
                  Share your file through <strong style={{ color: '#67e8f9' }}>Google Drive, Dropbox, OneDrive</strong>, or any publicly accessible link. Make sure the link is set to <strong style={{ color: '#fcd34d' }}>"Anyone with the link can view"</strong>.
                </p>

                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}>
                  Paste External Link <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/file/d/... or any public link"
                    value={driveUrl}
                    onChange={(e) => setDriveUrl(e.target.value)}
                    style={{
                      width: '100%', padding: '13px 14px 13px 44px', borderRadius: '12px',
                      background: '#090d16', border: `1px solid ${driveUrl.trim() ? 'rgba(6,182,212,0.4)' : 'rgba(255,255,255,0.12)'}`,
                      color: '#fff', fontSize: '14px', outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                  />
                  <Link2 style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#22d3ee', pointerEvents: 'none' }} />
                </div>

                {driveUrl.trim() && (
                  <div style={{ marginTop: '10px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '10px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 style={{ width: '16px', height: '16px', color: '#4ade80', flexShrink: 0 }} />
                    <span style={{ fontSize: '12.5px', color: '#86efac' }}>Link detected — ensure it is set to public access before submitting.</span>
                  </div>
                )}

                <div style={{
                  marginTop: '14px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '8px',
                }}>
                  {[
                    { name: '🟡 Google Drive', hint: 'drive.google.com' },
                    { name: '🔵 OneDrive', hint: 'onedrive.live.com' },
                    { name: '📦 Dropbox', hint: 'dropbox.com' },
                    { name: '🔗 Any URL', hint: 'Any public file link' },
                  ].map((p) => (
                    <div key={p.name} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '8px 12px' }}>
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#e2e8f0' }}>{p.name}</div>
                      <div style={{ fontSize: '11px', color: '#475569' }}>{p.hint}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}



            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: uploadMode === 'file'
                  ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
                  : 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '16px',
                padding: '14px',
                borderRadius: '12px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: uploadMode === 'file' ? '0 4px 16px rgba(99,102,241,0.3)' : '0 4px 16px rgba(6,182,212,0.3)',
                opacity: loading ? 0.7 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              <Send style={{ width: '18px', height: '18px' }} />
              {loading
                ? 'Submitting...'
                : uploadMode === 'file'
                ? '📤 Upload File & Claim Reward Points'
                : '🔗 Submit Link & Claim Reward Points'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
