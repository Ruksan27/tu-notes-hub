'use client'
// src/app/register/page.tsx
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'react-toastify'

type Step = 'FORM' | 'OTP'

interface Semester { id: string; visibleOld: boolean; visibleNew: boolean }
interface Faculty { id: string; name: string; systemType: 'SEMESTER' | 'YEARLY'; semCount: number; semesters: Semester[] }
interface DropdownOption { value: string; label: string; sublabel?: string }

// ── Custom Dropdown (Standard Absolute Dropdown) ───────────────────────────
function CustomDropdown({ id, label, placeholder, options, value, onChange, disabled }: {
  id: string; label: string; placeholder: string; options: DropdownOption[]
  value: string; onChange: (v: string) => void; disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [mounted, setMounted] = useState(false)
  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    setMounted(true)
  }, [])

  const filteredOptions = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase()) ||
    (o.sublabel && o.sublabel.toLowerCase().includes(search.toLowerCase()))
  )

  const handleSelect = (val: string) => {
    onChange(val)
    setOpen(false)
    setSearch('')
  }

  return (
    <div className="relative">
      <label style={{ display: 'block', color: 'var(--clr-text-2)', fontSize: '13px', marginBottom: '6px' }}>{label}</label>
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => !disabled && setOpen(p => !p)}
        className="input-field"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
          cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
          borderColor: open ? 'var(--clr-primary)' : undefined,
          boxShadow: open ? '0 0 0 3px rgba(99,102,241,0.15)' : undefined
        }}
      >
        <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? (
            <>
              {selected.sublabel && <span style={{ fontWeight: 800, color: 'var(--clr-primary-h)', marginRight: '6px' }}>[{selected.sublabel}]</span>}
              <span style={{ color: 'var(--clr-text-1)', fontWeight: 600 }}>{selected.label}</span>
            </>
          ) : (
            <span style={{ color: 'var(--clr-text-3)' }}>{placeholder}</span>
          )}
        </span>
        <span style={{ color: 'var(--clr-text-3)', fontSize: '12px', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none', flexShrink: 0 }}>▼</span>
      </button>

      {open && mounted && (
        <>
          {/* Invisible backdrop to detect clicks outside */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => { setOpen(false); setSearch('') }} 
          />
          
          {/* Dropdown Menu Content */}
          <div 
            className="absolute z-50 left-0 right-0 mt-2 bg-[#0d0f17] rounded-xl border border-slate-700 shadow-[0_15px_50px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden"
            style={{ maxHeight: '320px', top: '100%' }}
          >
            {/* Live Search Input */}
            {options.length > 4 && (
              <div className="px-3 pt-3 pb-2 shrink-0 bg-[#0d0f17] border-b border-slate-800">
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{ position: 'absolute', left: '10px', color: '#94a3b8', fontSize: '12px', pointerEvents: 'none' }}>🔍</span>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={`Search...`}
                    style={{
                      width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155',
                      borderRadius: '6px', padding: '8px 24px 8px 30px', fontSize: '12px',
                      color: '#ffffff', outline: 'none'
                    }}
                    autoFocus
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      style={{
                        position: 'absolute', right: '8px', color: '#94a3b8', background: '#334155',
                        border: 'none', borderRadius: '50%', width: '14px', height: '14px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', cursor: 'pointer'
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Options List */}
            <div className="overflow-y-auto flex-1 p-2 custom-scrollbar" style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
              {filteredOptions.length === 0 ? (
                <div className="py-6 text-center text-slate-500 text-xs">
                  No matches found
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {filteredOptions.map((opt) => {
                    const isSelected = opt.value === value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleSelect(opt.value)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          padding: '8px 12px', borderRadius: '8px',
                          background: isSelected ? 'rgba(99,102,241,0.18)' : 'transparent',
                          border: `1px solid ${isSelected ? 'var(--clr-primary)' : 'transparent'}`,
                          cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.1s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = 'transparent'
                          }
                        }}
                      >
                        {opt.sublabel && (
                          <span style={{
                            background: isSelected ? 'var(--clr-primary)' : 'rgba(99,102,241,0.12)',
                            color: isSelected ? '#fff' : '#a5b4fc',
                            fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px',
                            border: '1px solid rgba(99,102,241,0.2)', flexShrink: 0, letterSpacing: '0.04em'
                          }}>
                            {opt.sublabel}
                          </span>
                        )}
                        <span style={{ flex: 1, fontSize: '13px', fontWeight: isSelected ? 700 : 500, color: isSelected ? '#ffffff' : '#cbd5e1', lineHeight: 1.3 }}>
                          {opt.label}
                        </span>
                        {isSelected && <span style={{ color: '#10b981', fontWeight: 800, fontSize: '13px', flexShrink: 0 }}>✓</span>}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
// ─────────────────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const [step, setStep] = useState<Step>('FORM')
  const [formData, setFormData] = useState({
    name: '', email: '', password: '',
    facultyId: '', semesterOrder: '',
    college: '', phone: '', gender: ''
  })
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [agreePrivacy, setAgreePrivacy] = useState(false)
  const [faculties, setFaculties] = useState<Faculty[]>([])
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [redirectPath, setRedirectPath] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const redir = params.get('redirect')
      if (redir) setRedirectPath(redir)
    }

    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(data => {
      if (data?.authenticated && data?.user) {
        const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
        const redir = params?.get('redirect')
        window.location.href = redir || (data.user.role === 'ADMIN' ? '/admin' : '/dashboard')
      }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/api/admin/faculties').then(r => r.json()).then(d => setFaculties(d.faculties || [])).catch(() => toast.error('Failed to load faculties'))
  }, [])

  const selectedFaculty = faculties.find(f => f.id === formData.facultyId)

  const facultyOptions: DropdownOption[] = faculties.map(f => ({ value: f.id, label: f.name, sublabel: f.id.toUpperCase() }))
  const semesterOptions: DropdownOption[] = []
  if (selectedFaculty) {
    const lbl = selectedFaculty.systemType === 'YEARLY' ? 'Year' : 'Semester'
    for (let i = 1; i <= (selectedFaculty.semCount || 8); i++) {
      const sfx = i === 1 ? 'st' : i === 2 ? 'nd' : i === 3 ? 'rd' : 'th'
      semesterOptions.push({ value: String(i), label: `${i}${sfx} ${lbl}` })
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.college || !formData.phone || !formData.gender) { toast.error('Please fill in all required fields (College, Phone, Gender).'); return }
    if (!formData.facultyId || !formData.semesterOrder) { toast.error('Please select your faculty and semester/year'); return }
    if (!agreeTerms || !agreePrivacy) { toast.error('You must agree to the Terms and Privacy Policy.'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success('OTP sent to your email!')
      setStep('OTP')
    } finally { setLoading(false) }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, code: otp, type: 'REGISTER' }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      localStorage.setItem('tu_user', JSON.stringify(data.user))
      toast.success('Account verified! Welcome to TU Notes Hub 🎉')
      const targetUrl = redirectPath || '/'
      window.location.href = targetUrl
    } finally { setLoading(false) }
  }

  return (
    <div className="flex-center" style={{ minHeight: 'calc(100vh - 64px)', padding: '40px 16px' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '600px', padding: '44px 36px' }}>
        
        {/* Header */}
        <div className="text-center" style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎓</div>
          {step === 'FORM' ? (
            <>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', marginBottom: '8px' }}>Create Account</h1>
              <p style={{ color: 'var(--clr-text-2)', fontSize: '14px' }}>Join thousands of TU students 🎓</p>
            </>
          ) : (
            <>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', marginBottom: '8px' }}>Verify Email</h1>
              <p style={{ color: 'var(--clr-text-2)', fontSize: '14px' }}>OTP sent to <span style={{ color: 'var(--clr-primary-h)', fontWeight: 600 }}>{formData.email}</span></p>
            </>
          )}
        </div>

        {/* ── FORM STEP ── */}
        {step === 'FORM' ? (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label style={{ display: 'block', color: 'var(--clr-text-2)', fontSize: '13px', marginBottom: '6px' }}>Full Name</label>
                <input id="reg-name" className="input-field" placeholder="Hari Prasad Sharma" required
                  value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>

              {/* Email */}
              <div>
                <label style={{ display: 'block', color: 'var(--clr-text-2)', fontSize: '13px', marginBottom: '6px' }}>Email Address</label>
                <input id="reg-email" className="input-field" type="email" placeholder="hari@gmail.com" required
                  value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* College */}
              <div>
                <label style={{ display: 'block', color: 'var(--clr-text-2)', fontSize: '13px', marginBottom: '6px' }}>College Name</label>
                <input id="reg-college" className="input-field" placeholder="e.g. Patan Multiple Campus" required
                  value={formData.college} onChange={e => setFormData({ ...formData, college: e.target.value })} />
              </div>

              {/* Phone */}
              <div>
                <label style={{ display: 'block', color: 'var(--clr-text-2)', fontSize: '13px', marginBottom: '6px' }}>Phone Number</label>
                <input id="reg-phone" className="input-field" type="tel" placeholder="98XXXXXXXX" required
                  value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
              </div>
            </div>

            {/* Gender */}
            <div>
              <label style={{ display: 'block', color: 'var(--clr-text-2)', fontSize: '13px', marginBottom: '6px' }}>Gender</label>
              <div className="flex gap-2">
                {['MALE', 'FEMALE', 'OTHER'].map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setFormData({ ...formData, gender: g })}
                    className="flex-1 py-2 text-sm font-semibold rounded-lg border transition-all"
                    style={{
                      background: formData.gender === g ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.03)',
                      borderColor: formData.gender === g ? 'var(--clr-primary)' : 'rgba(255,255,255,0.1)',
                      color: formData.gender === g ? '#fff' : 'var(--clr-text-2)'
                    }}
                  >
                    {g.charAt(0) + g.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', color: 'var(--clr-text-2)', fontSize: '13px', marginBottom: '6px' }}>Password</label>
              <div className="relative">
                <input id="reg-password" className="input-field" type={showPassword ? 'text' : 'password'} placeholder="At least 8 characters" required minLength={8}
                  style={{ paddingRight: '44px' }}
                  value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                <button type="button" tabIndex={-1} onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-sm transition-colors select-none">
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Faculty */}
              <div className="w-full">
                <CustomDropdown id="reg-faculty" label="Faculty" placeholder="Select Faculty"
                  options={facultyOptions} value={formData.facultyId}
                  onChange={v => setFormData({ ...formData, facultyId: v, semesterOrder: '' })} />
              </div>

              {/* Semester */}
              <div className="w-full">
                <CustomDropdown id="reg-semester" label="Semester / Year"
                  placeholder={formData.facultyId ? 'Select Semester' : 'Faculty first'}
                  options={semesterOptions} value={formData.semesterOrder}
                  onChange={v => setFormData({ ...formData, semesterOrder: v })}
                  disabled={!formData.facultyId} />
              </div>
            </div>

            {/* Terms */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
              {[
                { id: 'chk-terms', checked: agreeTerms, set: setAgreeTerms, href: '/terms', label: 'Terms of Service' },
                { id: 'chk-privacy', checked: agreePrivacy, set: setAgreePrivacy, href: '/privacy', label: 'Privacy Policy' },
              ].map(item => (
                <label key={item.id} htmlFor={item.id} className="flex items-center gap-3 cursor-pointer group select-none">
                  <input id={item.id} type="checkbox" className="w-4 h-4 cursor-pointer accent-indigo-500" checked={item.checked} onChange={e => item.set(e.target.checked)} required />
                  <span className="text-xs text-slate-300">
                    I agree to the{' '}
                    <Link href={item.href} target="_blank" className="font-bold text-blue-400 underline underline-offset-4 decoration-blue-400 hover:text-blue-300 transition-colors">{item.label}</Link>
                  </span>
                </label>
              ))}
            </div>

            {/* Submit */}
            <button id="reg-submit" type="submit" className="btn btn-primary" style={{ marginTop: '8px', justifyContent: 'center', width: '100%' }} disabled={loading}>
              {loading ? (
                <><span className="spinner" /> Sending OTP…</>
              ) : (
                '📧 Create Account & Send OTP'
              )}
            </button>

            <p className="text-center" style={{ color: 'var(--clr-text-3)', fontSize: '13px', marginTop: '4px' }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: 'var(--clr-primary-h)', fontWeight: 700 }}>Sign in</Link>
            </p>

            <p className="text-center" style={{ color: 'var(--clr-text-3)', fontSize: '12px', marginTop: '4px' }}>
              🔒 Your data is secure and never shared with third parties.
            </p>
          </form>

        ) : (
          /* ── OTP STEP ── */
          <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 'var(--radius-sm)', padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📬</div>
              <p style={{ fontSize: '13px', color: 'var(--clr-text-2)', lineHeight: 1.6 }}>
                We sent a <strong style={{ color: '#fff' }}>6-digit OTP</strong> to<br />
                <span style={{ color: 'var(--clr-primary-h)', fontWeight: 600 }}>{formData.email}</span><br />
                Check your inbox (and spam folder)
              </p>
            </div>

            <div>
              <label style={{ display: 'block', color: 'var(--clr-text-2)', fontSize: '13px', marginBottom: '6px' }}>Enter OTP Code</label>
              <input
                id="otp-input"
                className="input-field"
                style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '10px', fontWeight: 800, padding: '14px' }}
                placeholder="••••••"
                maxLength={6}
                required
                inputMode="numeric"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
            </div>

            <button id="otp-submit" type="submit" className="btn btn-primary" style={{ justifyContent: 'center', width: '100%' }} disabled={loading || otp.length < 6}>
              {loading ? (
                <><span className="spinner" /> Verifying…</>
              ) : (
                '✅ Verify & Activate Account'
              )}
            </button>

            <button type="button" onClick={() => setStep('FORM')} className="btn btn-outline" style={{ justifyContent: 'center', width: '100%' }}>
              ← Back to Register
            </button>
          </form>
        )}

      </div>
    </div>
  )
}
