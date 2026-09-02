'use client'
import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'react-toastify'
import { getProjectSlug } from '@/lib/slugs'

interface Project {
  id: string
  title: string
  shortDescription: string | null
  projectType: string | null
  originalPrice: number
}

interface SellerProfile {
  id: string
  userId: string
  college: string | null
  bio: string | null
  experience: string | null
  skills: string | null
  profilePic: string | null
  isVerified: boolean
  github: string | null
  linkedin: string | null
  youtube: string | null
  instagram: string | null
  tiktok: string | null
}

interface Seller {
  id: string
  name: string
  email: string
  sellerProfile: SellerProfile | null
  projectsListed: Project[]
}

interface DeveloperProfileClientProps {
  seller: Seller
  currentUser: { id: string; role: string } | null
}

export default function DeveloperProfileClient({ seller, currentUser }: DeveloperProfileClientProps) {
  const [profile, setProfile] = useState<SellerProfile | null>(seller.sellerProfile)
  const [isEditing, setIsEditing] = useState(false)

  // Form states
  const [college, setCollege] = useState(profile?.college || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [experience, setExperience] = useState(profile?.experience || '')
  const [skills, setSkills] = useState(profile?.skills || '')
  const [github, setGithub] = useState(profile?.github || '')
  const [linkedin, setLinkedin] = useState(profile?.linkedin || '')
  const [youtube, setYoutube] = useState(profile?.youtube || '')
  
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null)
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(profile?.profilePic || null)
  const [saving, setSaving] = useState(false)

  const isOwner = currentUser?.id === seller.id
  const canEdit = isOwner

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size must be less than 2MB.')
        return
      }
      setProfilePicFile(file)
      setProfilePicPreview(URL.createObjectURL(file))
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const fd = new FormData()
    fd.append('college', college)
    fd.append('bio', bio)
    fd.append('experience', experience)
    fd.append('skills', skills)
    fd.append('github', github)
    fd.append('linkedin', linkedin)
    fd.append('youtube', youtube)
    if (profilePicFile) {
      fd.append('profilePic', profilePicFile)
    }

    try {
      const res = await fetch('/api/student/seller/profile', {
        method: 'PUT',
        body: fd
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Profile updated successfully! 🎉')
        setProfile(data.profile)
        setIsEditing(false)
      } else {
        toast.error(data.error || 'Failed to update profile')
      }
    } catch {
      toast.error('Network error. Failed to save profile details.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container" style={{ padding: '60px 20px', maxWidth: '900px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/projects" style={{ color: 'var(--clr-text-3)', fontSize: '13px', textDecoration: 'none' }}>
          ← Back to Marketplace
        </Link>
        {canEdit && !isEditing && (
          <button className="btn btn-outline btn-sm" onClick={() => setIsEditing(true)}>
            ✏️ Edit Profile
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSave} className="glass-card" style={{ padding: '36px', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '24px' }}>✏️ Edit Profile Details</h2>
          
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {profilePicPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profilePicPreview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '32px' }}>👨‍💻</span>
              )}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--clr-text-3)', marginBottom: '6px', fontWeight: 600 }}>Change Avatar Picture</label>
              <input type="file" accept="image/*" onChange={handleFileChange} style={{ fontSize: '13px' }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--clr-text-3)', marginBottom: '6px', fontWeight: 600 }}>College Name *</label>
              <input type="text" required className="input-field" value={college} onChange={e => setCollege(e.target.value)} placeholder="e.g. Patan Multiple Campus" />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--clr-text-3)', marginBottom: '6px', fontWeight: 600 }}>Bio Description *</label>
              <textarea required rows={4} className="input-field" value={bio} onChange={e => setBio(e.target.value)} placeholder="Describe yourself, your interests and background..." style={{ padding: '12px', fontSize: '13px' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--clr-text-3)', marginBottom: '6px', fontWeight: 600 }}>Years of Experience *</label>
                <input type="text" required className="input-field" value={experience} onChange={e => setExperience(e.target.value)} placeholder="e.g. 2 years, Fresher" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--clr-text-3)', marginBottom: '6px', fontWeight: 600 }}>Skills (comma-separated) *</label>
                <input type="text" required className="input-field" value={skills} onChange={e => setSkills(e.target.value)} placeholder="e.g. React, Node.js, Next.js" />
              </div>
            </div>

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '10px 0' }} />
            <h4 style={{ fontSize: '14px', margin: '0 0 4px 0', color: 'var(--clr-text-2)' }}>🔗 Social Media Links</h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--clr-text-3)', marginBottom: '6px', fontWeight: 600 }}>GitHub Profile URL</label>
                <input type="url" className="input-field" value={github} onChange={e => setGithub(e.target.value)} placeholder="https://github.com/username" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--clr-text-3)', marginBottom: '6px', fontWeight: 600 }}>LinkedIn Profile URL</label>
                <input type="url" className="input-field" value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/username" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--clr-text-3)', marginBottom: '6px', fontWeight: 600 }}>YouTube Channel URL</label>
                <input type="url" className="input-field" value={youtube} onChange={e => setYoutube(e.target.value)} placeholder="https://youtube.com/@channel" />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button type="button" className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { setIsEditing(false); setProfilePicPreview(profile?.profilePic || null); }}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 2, justifyContent: 'center' }} disabled={saving}>
                {saving ? 'Saving changes...' : '💾 Save Profile'}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="glass-card" style={{ padding: '36px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', overflow: 'hidden' }}>
              {profile?.profilePic ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.profilePic} alt={seller.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                '👨‍💻'
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0 }}>{seller.name}</h1>
                {profile?.isVerified && (
                  <span style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(110,231,183,0.15)', color: '#6ee7b7', padding: '3px 10px', borderRadius: '20px', border: '1px solid rgba(110,231,183,0.3)' }}>
                    ✓ Verified Seller
                  </span>
                )}
              </div>
              {profile?.college && (
                <p style={{ color: 'var(--clr-text-3)', margin: '4px 0 0', fontSize: '14px' }}>🎓 {profile.college}</p>
              )}
            </div>
          </div>

          {profile?.bio && (
            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--clr-text-3)', marginBottom: '8px' }}>Bio</h3>
              <p style={{ color: 'var(--clr-text-2)', lineHeight: 1.7, margin: 0, fontSize: '14px' }}>{profile.bio}</p>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            {profile?.experience && (
              <div>
                <div style={{ fontSize: '11px', color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Experience</div>
                <div style={{ fontWeight: 600, fontSize: '14px', marginTop: '2px' }}>{profile.experience}</div>
              </div>
            )}
            {profile?.skills && (
              <div>
                <div style={{ fontSize: '11px', color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Skills</div>
                <div style={{ fontWeight: 600, fontSize: '14px', marginTop: '2px' }}>{profile.skills}</div>
              </div>
            )}
          </div>

          {/* Social Links */}
          {(profile?.github || profile?.linkedin || profile?.youtube) && (
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
              {profile.github && <a href={profile.github} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">🐙 GitHub</a>}
              {profile.linkedin && <a href={profile.linkedin} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">🔗 LinkedIn</a>}
              {profile.youtube && <a href={profile.youtube} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">▶️ YouTube</a>}
            </div>
          )}
        </div>
      )}

      <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '16px' }}>Projects listed by {seller.name}</h2>
      {seller.projectsListed.length === 0 ? (
        <p style={{ color: 'var(--clr-text-3)' }}>No public projects listed yet.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
          {seller.projectsListed.map(project => (
            <Link key={project.id} href={`/projects/${getProjectSlug(project)}`} style={{ textDecoration: 'none' }}>
              <div className="glass-card hover-lift" style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px', color: '#fff' }}>{project.title}</h3>
                <p style={{ fontSize: '13px', color: 'var(--clr-text-2)', flex: 1, lineBreak: 'anywhere' }}>{project.shortDescription}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--clr-text-3)' }}>{project.projectType}</span>
                  <span style={{ fontWeight: 700, color: '#6ee7b7' }}>Rs. {project.originalPrice}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
