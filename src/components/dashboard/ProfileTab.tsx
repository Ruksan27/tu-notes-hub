'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import Image from 'next/image'

export default function ProfileTab() {
  const [user, setUser] = useState<any>(null)
  const [name, setName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('tu_user')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setUser(parsed)
        setName(parsed.name || '')
        setAvatarUrl(parsed.avatarUrl || '')
      } catch {}
    }
  }, [])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', 'tu-notes-hub')

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/dcvd8oio1/image/upload`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.secure_url) {
        setAvatarUrl(data.secure_url)
        toast.success('Avatar uploaded!')
      } else {
        toast.error('Failed to upload avatar')
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
        body: JSON.stringify({ name, avatarUrl })
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

  if (!user) return <div className="p-8 text-center text-slate-400">Loading profile...</div>

  return (
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
  )
}
