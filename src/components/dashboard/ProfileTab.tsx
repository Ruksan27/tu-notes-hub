'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import Image from 'next/image'
import ReferralDashboardCard from '@/components/ReferralDashboardCard'

interface Faculty {
  id: string
  name: string
  systemType: 'SEMESTER' | 'YEARLY'
  semCount?: number
}

export default function ProfileTab() {
  const [user, setUser] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)

  const [name, setName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [college, setCollege] = useState('')
  const [phone, setPhone] = useState('')
  const [gender, setGender] = useState('')
  const [facultyId, setFacultyId] = useState('')
  const [semesterOrder, setSemesterOrder] = useState('')

  const [faculties, setFaculties] = useState<Faculty[]>([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const populateUserData = (userData: any) => {
    setName(userData.name || '')
    setAvatarUrl(userData.avatarUrl || '')
    setCollege(userData.college || '')
    setPhone(userData.phone || '')
    setGender(userData.gender || '')
    setFacultyId(userData.facultyId || '')
    setSemesterOrder(userData.semesterOrder ? String(userData.semesterOrder) : '')
  }

  useEffect(() => {
    // 1. Load from localStorage initially for fast render
    const stored = localStorage.getItem('tu_user')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setUser(parsed)
        populateUserData(parsed)
      } catch {}
    }

    // 2. Fetch faculties for reference
    fetch('/api/admin/faculties')
      .then(res => res.json())
      .then(data => {
        if (data && data.faculties) {
          setFaculties(data.faculties)
        }
      })
      .catch(() => {})

    // 3. Always fetch latest user data from server
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data && data.authenticated && data.user) {
          setUser(data.user)
          populateUserData(data.user)
          localStorage.setItem('tu_user', JSON.stringify(data.user))
        }
      })
      .catch(() => {})
  }, [])

  const selectedFaculty = faculties.find(f => f.id === facultyId)

  const handleCancelEdit = () => {
    if (user) {
      populateUserData(user)
    }
    setIsEditing(false)
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const sigRes = await fetch('/api/upload/signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: 'tu-notes-hub/avatars' }),
      })
      const sigData = await sigRes.json()

      if (!sigRes.ok || sigData.error) {
        toast.error(sigData.error || 'Failed to authorize upload')
        return
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('api_key', sigData.apiKey)
      formData.append('timestamp', sigData.timestamp)
      formData.append('signature', sigData.signature)
      formData.append('folder', sigData.folder)

      const res = await fetch(`https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.secure_url) {
        setAvatarUrl(data.secure_url)
        toast.success('Avatar uploaded successfully! 🎉')
      } else {
        toast.error(data.error?.message || 'Failed to upload avatar')
      }
    } catch {
      toast.error('Upload error')
    } finally {
      setUploading(false)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Full Name cannot be empty')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          avatarUrl,
          college,
          phone,
          gender,
        })
      })

      const data = await res.json()
      if (res.ok && data.user) {
        toast.success(data.message || 'Profile updated successfully! 🎉')
        localStorage.setItem('tu_user', JSON.stringify(data.user))
        setUser(data.user)
        populateUserData(data.user)
        setIsEditing(false)
        window.dispatchEvent(new Event('tu_user_updated'))
      } else {
        toast.error(data.error || 'Failed to update profile')
      }
    } catch {
      toast.error('Network error while saving profile')
    } finally {
      setSaving(false)
    }
  }

  if (!user) return <div className="p-8 text-center text-slate-400">Loading profile details...</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* ── Reward Points & Contribution Card ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(6,182,212,0.15))',
        border: '1px solid rgba(99,102,241,0.25)',
        borderRadius: '16px',
        padding: '24px 28px',
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
            padding: '4px 12px', borderRadius: '999px', fontSize: '11px', color: '#a5b4fc',
            fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px',
          }}>
            🎁 Reward Points Balance
          </div>
          <div style={{ fontSize: '32px', fontWeight: 900, color: '#ffffff', lineHeight: 1 }}>
            {user.rewardPoints ?? 0} <span style={{ fontSize: '16px', color: '#67e8f9', fontWeight: 700 }}>PTS</span>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: '6px 0 0 0' }}>
            Earn +50 PTS per approved note. Max 4 uploads/day.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <a
            href="/dashboard/notes/upload"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
              color: '#ffffff', fontWeight: 700, fontSize: '13px',
              padding: '10px 20px', borderRadius: '10px', textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              boxShadow: '0 4px 14px rgba(99,102,241,0.3)',
            }}
          >
            📤 Upload & Earn Points
          </a>
        </div>
      </div>

      {/* ── Referral System Card ── */}
      <ReferralDashboardCard
        user={user}
        onUserUpdate={(updated) => setUser((prev: any) => ({ ...prev, ...updated }))}
      />

      {/* ── Profile Details Card ── */}
      <div className="admin-card p-6 sm:p-8" style={{ background: 'var(--clr-bg-800)', border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-lg)' }}>
        
        {/* Card Header with Edit Toggle Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '20px', color: 'var(--clr-text-1)', marginBottom: '4px', fontWeight: 800 }}>
              Profile Details
            </h2>
            <p style={{ color: 'var(--clr-text-3)', fontSize: '13px', margin: 0 }}>
              {isEditing ? 'Make changes to your editable profile details below and save.' : 'View your account details below or click Edit Profile to make changes.'}
            </p>
          </div>

          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              style={{
                background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                padding: '9px 20px',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(99,102,241,0.3)',
                transition: 'all 0.2s ease'
              }}
            >
              ✏️ Edit Profile
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="btn btn-outline"
              style={{ padding: '8px 16px', fontSize: '13px' }}
            >
              ✕ Cancel
            </button>
          )}
        </div>

        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '640px' }}>
        
          {/* Avatar Upload */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--clr-text-2)', marginBottom: '12px' }}>Profile Picture</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ 
                width: '80px', height: '80px', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(6,182,212,0.1))',
                border: '2px solid rgba(99,102,241,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', position: 'relative'
              }}>
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="Avatar" fill style={{ objectFit: 'cover' }} unoptimized />
                ) : (
                  <span style={{ fontSize: '32px', fontWeight: 700, color: 'var(--clr-primary)' }}>
                    {name ? name[0].toUpperCase() : 'U'}
                  </span>
                )}
              </div>
              {isEditing && (
                <div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    id="avatarUpload" 
                    style={{ display: 'none' }} 
                    onChange={handleAvatarUpload}
                  />
                  <label 
                    htmlFor="avatarUpload" 
                    className="btn btn-outline btn-sm" 
                    style={{ cursor: 'pointer', display: 'inline-flex', padding: '6px 16px' }}
                  >
                    {uploading ? 'Uploading...' : '📷 Change Picture'}
                  </label>
                  <p style={{ fontSize: '11px', color: 'var(--clr-text-3)', marginTop: '8px' }}>
                    Recommended: Square image, max 2MB.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Full Name & Phone Number */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--clr-text-2)', marginBottom: '8px' }}>Full Name</label>
              <input 
                type="text" 
                className="input-field" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="Hari Prasad Sharma"
                disabled={!isEditing}
                style={{ opacity: isEditing ? 1 : 0.8, cursor: isEditing ? 'text' : 'not-allowed', background: isEditing ? undefined : 'rgba(0,0,0,0.3)' }}
                required 
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--clr-text-2)', marginBottom: '8px' }}>Phone Number</label>
              <input 
                type="tel" 
                className="input-field" 
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
                placeholder="98XXXXXXXX"
                disabled={!isEditing}
                style={{ opacity: isEditing ? 1 : 0.8, cursor: isEditing ? 'text' : 'not-allowed', background: isEditing ? undefined : 'rgba(0,0,0,0.3)' }}
              />
            </div>
          </div>

          {/* College Name */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--clr-text-2)', marginBottom: '8px' }}>College Name</label>
            <input 
              type="text" 
              className="input-field" 
              value={college} 
              onChange={e => setCollege(e.target.value)} 
              placeholder="e.g. Patan Multiple Campus"
              disabled={!isEditing}
              style={{ opacity: isEditing ? 1 : 0.8, cursor: isEditing ? 'text' : 'not-allowed', background: isEditing ? undefined : 'rgba(0,0,0,0.3)' }}
            />
          </div>

          {/* Gender */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--clr-text-2)', marginBottom: '8px' }}>Gender</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {[
                { val: 'MALE', label: 'Male' },
                { val: 'FEMALE', label: 'Female' },
                { val: 'OTHER', label: 'Other' }
              ].map(g => (
                <button
                  key={g.val}
                  type="button"
                  disabled={!isEditing}
                  onClick={() => setGender(g.val)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: isEditing ? 'pointer' : 'not-allowed',
                    opacity: isEditing ? 1 : 0.7,
                    background: gender === g.val ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${gender === g.val ? 'var(--clr-primary)' : 'rgba(255,255,255,0.1)'}`,
                    color: gender === g.val ? '#ffffff' : 'var(--clr-text-2)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Faculty & Semester / Year (Non-editable Education Info) */}
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--clr-text-2)', marginBottom: '8px' }}>Faculty (Education)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={selectedFaculty ? `${selectedFaculty.name} (${selectedFaculty.id.toUpperCase()})` : (facultyId ? facultyId.toUpperCase() : 'Not Set')} 
                  disabled 
                  style={{ opacity: 0.6, cursor: 'not-allowed', background: '#050a14' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--clr-text-2)', marginBottom: '8px' }}>Semester / Year (Education)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={semesterOrder ? `${semesterOrder}${semesterOrder === '1' ? 'st' : semesterOrder === '2' ? 'nd' : semesterOrder === '3' ? 'rd' : 'th'} ${selectedFaculty?.systemType === 'YEARLY' ? 'Year' : 'Semester'}` : 'Not Set'} 
                  disabled 
                  style={{ opacity: 0.6, cursor: 'not-allowed', background: '#050a14' }}
                />
              </div>
            </div>
            <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
              🔒 Education details (Faculty & Semester/Year) cannot be changed from profile settings.
            </p>
          </div>

          {/* Email Address (Non-editable / Gmail) */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--clr-text-2)', marginBottom: '8px' }}>Email Address (Gmail)</label>
            <input 
              type="email" 
              className="input-field" 
              value={user.email} 
              disabled 
              style={{ opacity: 0.6, cursor: 'not-allowed', background: '#050a14' }}
            />
            <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>🔒 Gmail address cannot be changed.</p>
          </div>

          {/* Action buttons on Edit mode */}
          {isEditing && (
            <div style={{ paddingTop: '16px', borderTop: '1px solid var(--clr-border)', display: 'flex', gap: '12px', justifyContent: 'flex-start' }}>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={saving || uploading}
                style={{ padding: '12px 28px', fontSize: '14px', fontWeight: 700 }}
              >
                {saving ? '💾 Saving Profile...' : '💾 Save Changes'}
              </button>
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={handleCancelEdit}
                disabled={saving || uploading}
                style={{ padding: '12px 20px', fontSize: '14px' }}
              >
                Cancel
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
