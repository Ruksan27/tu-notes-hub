'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'react-toastify'
import { useRouter } from 'next/navigation'
import { CheckCircle2, ShieldCheck, UserCheck, Sparkles, Upload, Check, AlertCircle } from 'lucide-react'

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
    "I have read and agree to the TU Notes Seller Rules & Regulations",
    "I agree to the platform Terms of Service & Privacy Policy"
  ]

  const [acceptedTerms, setAcceptedTerms] = useState<boolean[]>([false, false])
  const [submitting, setSubmitting] = useState(false)

  const acceptedCount = acceptedTerms.filter(Boolean).length
  const allTermsAccepted = acceptedCount === termsList.length

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
    <div className="glass-card p-6 sm:p-10 space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 pb-6 border-b border-[var(--clr-border)]">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-2xl shrink-0">
          🛍️
        </div>
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-[var(--clr-text-1)] tracking-tight">Become a Verified Seller</h3>
          <p className="text-xs sm:text-sm text-[var(--clr-text-2)] mt-1">
            Sell your projects, source code, and study materials on TU Notes Hub.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Section 1: Professional Profile */}
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 text-xs font-black flex items-center justify-center border border-indigo-500/30">
              1
            </span>
            <h4 className="text-base font-bold text-[var(--clr-text-1)]">Professional Profile</h4>
          </div>
          
          {/* Avatar Upload */}
          <div>
            <label className="block text-xs font-bold text-[var(--clr-text-3)] mb-2 uppercase tracking-wider">Profile Picture / Avatar</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-[var(--clr-border)] flex items-center justify-center overflow-hidden shrink-0">
                {picPreview ? (
                  <img src={picPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="w-6 h-6 text-[var(--clr-text-3)]" />
                )}
              </div>
              <label className="btn btn-outline cursor-pointer text-xs">
                <span>Choose Photo</span>
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[var(--clr-text-3)] mb-2 uppercase tracking-wider">College / University *</label>
              <input
                required
                className="input-field"
                placeholder="e.g. Tribhuvan University"
                value={formData.college}
                onChange={e => setFormData({...formData, college: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-[var(--clr-text-3)] mb-2 uppercase tracking-wider">Years of Experience *</label>
              <input
                required
                className="input-field"
                placeholder="e.g. 2 Years"
                value={formData.experience}
                onChange={e => setFormData({...formData, experience: e.target.value})}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[var(--clr-text-3)] mb-2 uppercase tracking-wider">Skills & Frameworks (comma separated) *</label>
              <input
                required
                className="input-field"
                placeholder="e.g. Next.js, React, PHP, MySQL, Python"
                value={formData.skills}
                onChange={e => setFormData({...formData, skills: e.target.value})}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[var(--clr-text-3)] mb-2 uppercase tracking-wider">Short Bio / About You *</label>
              <textarea
                required
                rows={3}
                className="input-field resize-none"
                placeholder="Tell buyers a bit about yourself and your expertise..."
                value={formData.bio}
                onChange={e => setFormData({...formData, bio: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Social Links */}
        <div className="space-y-4 pt-6 border-t border-[var(--clr-border)]">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 text-xs font-black flex items-center justify-center border border-indigo-500/30">
              2
            </span>
            <h4 className="text-base font-bold text-[var(--clr-text-1)]">Social Links (Optional)</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div>
               <label className="block text-xs font-bold text-[var(--clr-text-3)] mb-2 uppercase tracking-wider">GitHub Profile</label>
               <input className="input-field" placeholder="https://github.com/..." value={formData.github} onChange={e => setFormData({...formData, github: e.target.value})} />
             </div>
             <div>
               <label className="block text-xs font-bold text-[var(--clr-text-3)] mb-2 uppercase tracking-wider">LinkedIn Profile</label>
               <input className="input-field" placeholder="https://linkedin.com/in/..." value={formData.linkedin} onChange={e => setFormData({...formData, linkedin: e.target.value})} />
             </div>
             <div>
               <label className="block text-xs font-bold text-[var(--clr-text-3)] mb-2 uppercase tracking-wider">YouTube Channel</label>
               <input className="input-field" placeholder="https://youtube.com/..." value={formData.youtube} onChange={e => setFormData({...formData, youtube: e.target.value})} />
             </div>
             <div>
               <label className="block text-xs font-bold text-[var(--clr-text-3)] mb-2 uppercase tracking-wider">Instagram</label>
               <input className="input-field" placeholder="https://instagram.com/..." value={formData.instagram} onChange={e => setFormData({...formData, instagram: e.target.value})} />
             </div>
          </div>
        </div>

        {/* Section 3: Rules & Regulations */}
        <div className="space-y-4 pt-6 border-t border-[var(--clr-border)]">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-black flex items-center justify-center border border-amber-500/30">
              3
            </span>
            <div>
              <h4 className="text-base font-bold text-[var(--clr-text-1)]">Mandatory Rules & Regulations</h4>
              <p className="text-xs text-[var(--clr-text-2)]">Review and accept platform agreements to activate seller registration.</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div
              onClick={() => toggleTerm(0)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 active:scale-[0.99] ${
                acceptedTerms[0]
                  ? 'bg-indigo-500/10 border-indigo-500/40 text-[var(--clr-text-1)]'
                  : 'bg-white/[0.02] border-[var(--clr-border)] text-[var(--clr-text-2)] hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                  acceptedTerms[0] ? 'bg-indigo-500 border-indigo-400 text-white' : 'border-white/30 bg-white/5'
                }`}>
                  {acceptedTerms[0] && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span className="text-xs sm:text-sm font-medium">
                  I have read and agree to the <a href="/seller-policy" target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="font-bold text-blue-400 underline underline-offset-4 decoration-blue-400 hover:text-blue-300 transition-colors">TU Notes Seller Rules & Regulations</a>
                </span>
              </div>
            </div>

            <div
              onClick={() => toggleTerm(1)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 active:scale-[0.99] ${
                acceptedTerms[1]
                  ? 'bg-indigo-500/10 border-indigo-500/40 text-[var(--clr-text-1)]'
                  : 'bg-white/[0.02] border-[var(--clr-border)] text-[var(--clr-text-2)] hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                  acceptedTerms[1] ? 'bg-indigo-500 border-indigo-400 text-white' : 'border-white/30 bg-white/5'
                }`}>
                  {acceptedTerms[1] && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span className="text-xs sm:text-sm font-medium">
                  I agree to the platform <a href="/terms" target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="font-bold text-blue-400 underline underline-offset-4 decoration-blue-400 hover:text-blue-300 transition-colors">Terms of Service</a> & <a href="/privacy" target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="font-bold text-blue-400 underline underline-offset-4 decoration-blue-400 hover:text-blue-300 transition-colors">Privacy Policy</a>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!allTermsAccepted || submitting}
          className={`w-full btn btn-lg btn-primary justify-center text-sm font-bold ${
            !allTermsAccepted ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {submitting ? (
            <><div className="spinner" style={{ width: '16px', height: '16px' }} /> Processing Application…</>
          ) : allTermsAccepted ? (
            <><CheckCircle2 className="w-5 h-5" /> Accept & Submit Seller Application</>
          ) : (
            <><AlertCircle className="w-4 h-4 text-amber-400" /> Accept all terms above to submit</>
          )}
        </button>

      </form>
    </div>
  )
}
