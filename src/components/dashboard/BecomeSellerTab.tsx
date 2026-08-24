'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { toast } from 'react-toastify'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  name: string
  email: string
  sellerProfile?: any
}

export default function BecomeSellerTab({ user }: { user: User }) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    college: '',
    bio: '',
    experience: '',
    skills: '',
    github: '',
    linkedin: '',
    youtube: '',
    instagram: '',
    tiktok: '',
  })
  
  const [profilePic, setProfilePic] = useState<File | null>(null)
  const [picPreview, setPicPreview] = useState<string | null>(null)
  
  const termsList = [
    "I have read and agree to the TU Notes Seller Rules & Regulations.",
    "I confirm that I have the right to sell the project submitted by me.",
    "I confirm that my project information, demo, screenshots and files are accurate.",
    "I agree to the 20–25% platform commission.",
    "I agree that all marketplace payments must be processed through TU Notes.",
    "I agree to the platform's delivery, dispute, refund, review and payout policies.",
    "I will not upload stolen, pirated, malicious, or unauthorized content.",
    "I will not attempt to bypass TU Notes or deal directly with buyers outside the platform.",
    "I understand that violating these rules may lead to project removal, payout hold, seller suspension, or account termination.",
    "I understand that the source-code repository for the project must remain PRIVATE before and during the sale, unless TU Notes explicitly allows otherwise."
  ]

  const [acceptedTerms, setAcceptedTerms] = useState<boolean[]>(new Array(termsList.length).fill(false))
  const [submitting, setSubmitting] = useState(false)

  const allTermsAccepted = acceptedTerms.every(Boolean)

  function toggleTerm(index: number) {
    const newTerms = [...acceptedTerms]
    newTerms[index] = !newTerms[index]
    setAcceptedTerms(newTerms)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setProfilePic(file)
      const reader = new FileReader()
      reader.onloadend = () => setPicPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!allTermsAccepted) {
      toast.error('You must accept all terms and conditions to proceed.')
      return
    }
    
    setSubmitting(true)
    try {
      const fd = new FormData()
      Object.entries(formData).forEach(([key, val]) => fd.append(key, val))
      if (profilePic) fd.append('profilePic', profilePic)

      const res = await fetch('/api/student/seller/apply', {
        method: 'POST',
        body: fd
      })
      
      const data = await res.json()
      if (res.ok) {
        toast.success('Seller application submitted successfully! 🚀')
        // Give time for toast then reload to reflect PENDING state
        setTimeout(() => window.location.reload(), 1500)
      } else {
        toast.error(data.error || 'Failed to submit application.')
      }
    } catch (err) {
      toast.error('Network error. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="glass-card" style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h3 className="section-title text-center">🛍️ Become a Verified Seller</h3>
      <p className="text-center" style={{ color: 'var(--clr-text-2)', marginBottom: '32px' }}>
        Sell your projects, source codes, and study materials on TU Notes Hub. Provide your details and accept the seller policies to begin.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Profile Details */}
        <div>
          <h4 className="text-lg font-bold mb-4" style={{ color: 'var(--clr-primary-h)' }}>1. Professional Profile</h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
               <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--clr-text-2)' }}>Profile Picture / Avatar</label>
               <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px dashed var(--clr-border)', overflow: 'hidden' }}>
                    {picPreview ? (
                      <img src={picPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div className="flex items-center justify-center h-full text-2xl">📸</div>
                    )}
                  </div>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="input-field" style={{ flex: 1 }} />
               </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--clr-text-2)' }}>College / University</label>
              <input required className="input-field" placeholder="e.g. Tribhuvan University" value={formData.college} onChange={e => setFormData({...formData, college: e.target.value})} />
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--clr-text-2)' }}>Years of Experience</label>
              <input required className="input-field" placeholder="e.g. 2 Years" value={formData.experience} onChange={e => setFormData({...formData, experience: e.target.value})} />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--clr-text-2)' }}>Skills & Frameworks (comma separated)</label>
              <input required className="input-field" placeholder="e.g. Next.js, React, PHP, MySQL, Python" value={formData.skills} onChange={e => setFormData({...formData, skills: e.target.value})} />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--clr-text-2)' }}>Short Bio / About You</label>
              <textarea required className="input-field" rows={3} placeholder="Tell buyers a bit about yourself and your expertise..." value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} />
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div style={{ borderTop: '1px solid var(--clr-border)', paddingTop: '24px' }}>
          <h4 className="text-lg font-bold mb-4" style={{ color: 'var(--clr-primary-h)' }}>2. Social Links (Optional)</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
             <div>
               <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--clr-text-2)' }}>GitHub Profile</label>
               <input className="input-field" placeholder="https://github.com/..." value={formData.github} onChange={e => setFormData({...formData, github: e.target.value})} />
             </div>
             <div>
               <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--clr-text-2)' }}>LinkedIn Profile</label>
               <input className="input-field" placeholder="https://linkedin.com/in/..." value={formData.linkedin} onChange={e => setFormData({...formData, linkedin: e.target.value})} />
             </div>
             <div>
               <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--clr-text-2)' }}>YouTube Channel</label>
               <input className="input-field" placeholder="https://youtube.com/..." value={formData.youtube} onChange={e => setFormData({...formData, youtube: e.target.value})} />
             </div>
             <div>
               <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--clr-text-2)' }}>Instagram</label>
               <input className="input-field" placeholder="https://instagram.com/..." value={formData.instagram} onChange={e => setFormData({...formData, instagram: e.target.value})} />
             </div>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div style={{ borderTop: '1px solid var(--clr-border)', paddingTop: '24px' }}>
          <h4 className="text-lg font-bold mb-4" style={{ color: 'var(--clr-warning)' }}>3. Mandatory Rules & Regulations</h4>
          
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {termsList.map((term, i) => (
              <label key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer' }}>
                <input type="checkbox" checked={acceptedTerms[i]} onChange={() => toggleTerm(i)} style={{ marginTop: '4px', width: '18px', height: '18px', cursor: 'pointer' }} />
                <span style={{ fontSize: '14px', color: 'var(--clr-text-1)', lineHeight: 1.5 }}>
                  {term}
                </span>
              </label>
            ))}
          </div>
        </div>

        <button type="submit" disabled={!allTermsAccepted || submitting} className="btn btn-primary btn-lg" style={{ marginTop: '16px', justifyContent: 'center' }}>
          {submitting ? <><span className="spinner" /> Processing...</> : '✅ Accept & Submit Application'}
        </button>
      </form>
    </div>
  )
}
