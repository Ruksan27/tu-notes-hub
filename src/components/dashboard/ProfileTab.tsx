'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import Image from 'next/image'
import ReferralDashboardCard from '@/components/ReferralDashboardCard'

export default function ProfileTab() {
  const [user, setUser] = useState<any>(null)
  const [name, setName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [college, setCollege] = useState('')
  const [phone, setPhone] = useState('')
  const [gender, setGender] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [referralCodeInput, setReferralCodeInput] = useState('')
  const [redeemingReferral, setRedeemingReferral] = useState(false)

  useEffect(() => {
    // 1. Load from localStorage initially for fast render
    const stored = localStorage.getItem('tu_user')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setUser(parsed)
        setName(parsed.name || '')
        setAvatarUrl(parsed.avatarUrl || '')
        setCollege(parsed.college || '')
        setPhone(parsed.phone || '')
        setGender(parsed.gender || '')
      } catch {}
    }

    // 2. Always fetch latest from server to ensure fresh data
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data && data.authenticated && data.user) {
          setUser(data.user)
          setName(data.user.name || '')
          setAvatarUrl(data.user.avatarUrl || '')
          setCollege(data.user.college || '')
          setPhone(data.user.phone || '')
          setGender(data.user.gender || '')
          localStorage.setItem('tu_user', JSON.stringify(data.user))
        }
      })
      .catch(() => {})
  }, [])

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
        toast.success('Avatar uploaded!')
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
      toast.error('Name cannot be empty')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, avatarUrl, college, phone, gender })
      })

      const data = await res.json()
      if (res.ok && data.user) {
        toast.success('Profile updated successfully!')
        // Update local storage
        localStorage.setItem('tu_user', JSON.stringify(data.user))
        setUser(data.user)
        // Global event to notify navbar to re-render avatar
        window.dispatchEvent(new Event('tu_user_updated'))
      } else {
        toast.error(data.error || 'Failed to update profile')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  const handleRedeemReferral = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!referralCodeInput.trim()) return

    setRedeemingReferral(true)
    try {
      const res = await fetch('/api/user/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: referralCodeInput })
      })

      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || 'Referral code redeemed successfully!')
        // Update user state to reflect points and referredById
        const updatedUser = { ...user, rewardPoints: data.newPoints, referredById: 'SET' }
        setUser(updatedUser)
        localStorage.setItem('tu_user', JSON.stringify(updatedUser))
        setReferralCodeInput('')
      } else {
        toast.error(data.error || 'Failed to redeem referral code')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setRedeemingReferral(false)
    }
  }

  if (!user) return <div className="p-8 text-center text-slate-400">Loading profile...</div>

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

      <div className="admin-card p-6 sm:p-8" style={{ background: 'var(--clr-bg-800)', border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', color: 'var(--clr-text-1)', marginBottom: '8px' }}>Profile Settings</h2>
          <p style={{ color: 'var(--clr-text-3)', fontSize: '14px' }}>Update your personal details and profile picture.</p>
        </div>

        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '500px' }}>
        
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
                {uploading ? 'Uploading...' : 'Change Picture'}
              </label>
              <p style={{ fontSize: '11px', color: 'var(--clr-text-3)', marginTop: '8px' }}>
                Recommended: Square image, max 2MB.
              </p>
            </div>
          </div>
        </div>

        {/* Name Input */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--clr-text-2)', marginBottom: '8px' }}>Full Name</label>
          <input 
            type="text" 
            className="input-field" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="John Doe"
            required 
          />
        </div>

        {/* College Input */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--clr-text-2)', marginBottom: '8px' }}>College Name</label>
          <input 
            type="text" 
            className="input-field" 
            value={college} 
            onChange={e => setCollege(e.target.value)} 
            placeholder="e.g. Patan Multiple Campus"
          />
        </div>

        {/* Phone Input */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--clr-text-2)', marginBottom: '8px' }}>Phone Number</label>
          <input 
            type="tel" 
            className="input-field" 
            value={phone} 
            onChange={e => setPhone(e.target.value)} 
            placeholder="98XXXXXXXX"
          />
        </div>

        {/* Gender Input */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--clr-text-2)', marginBottom: '8px' }}>Gender</label>
          <select
            className="input-field"
            value={gender}
            onChange={e => setGender(e.target.value)}
            style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
          >
            <option value="">Select Gender</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        {/* Email Input (Readonly) */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--clr-text-2)', marginBottom: '8px' }}>Email Address</label>
          <input 
            type="email" 
            className="input-field" 
            value={user.email} 
            disabled 
            style={{ opacity: 0.6, cursor: 'not-allowed' }}
          />
          <p style={{ fontSize: '11px', color: 'var(--clr-text-3)', marginTop: '6px' }}>Email cannot be changed.</p>
        </div>

        <div style={{ paddingTop: '16px', borderTop: '1px solid var(--clr-border)' }}>
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={saving || uploading}
            style={{ padding: '10px 24px' }}
          >
            {saving ? 'Saving...' : '💾 Save Changes'}
          </button>
        </div>
      </form>
    </div>
  </div>
)
}
