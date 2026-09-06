'use client'
// src/app/register/page.tsx
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'react-toastify'

type Step = 'FORM' | 'OTP'

interface Semester { id: string; visibleOld: boolean; visibleNew: boolean }
interface Faculty { id: string; name: string; systemType: 'SEMESTER' | 'YEARLY'; semCount: number; semesters: Semester[] }
interface DropdownOption { value: string; label: string; sublabel?: string }

// ── Custom Dropdown (mobile bottom-sheet) ────────────────────────────────────
function CustomDropdown({ id, label, placeholder, options, value, onChange, disabled }: {
  id: string; label: string; placeholder: string; options: DropdownOption[]
  value: string; onChange: (v: string) => void; disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    window.addEventListener('resize', close)
    return () => window.removeEventListener('resize', close)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <label style={{ display: 'block', color: 'var(--clr-text-2)', fontSize: '13px', marginBottom: '6px' }}>{label}</label>
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => !disabled && setOpen(p => !p)}
        className="input-field"
        style={{
          display: 'flex', alignItems: 'center', justifyBetween: 'space-between', width: '100%',
          cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
          borderColor: open ? 'var(--clr-primary)' : undefined,
          boxShadow: open ? '0 0 0 3px rgba(99,102,241,0.15)' : undefined
        }}
      >
        <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? (
            <>
              {selected.sublabel && <span style={{ fontWeight: 800, color: 'var(--clr-primary-h)', marginRight: '6px' }}>{selected.sublabel}</span>}
              <span style={{ color: 'var(--clr-text-1)', fontWeight: 600 }}>{selected.label}</span>
            </>
          ) : (
            <span style={{ color: 'var(--clr-text-3)' }}>{placeholder}</span>
          )}
        </span>
        <span style={{ color: 'var(--clr-text-3)', fontSize: '12px', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none', flexShrink: 0 }}>▼</span>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          {/* Bottom Sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-[#0d0f17] rounded-t-3xl border-t border-[var(--clr-border)] shadow-[0_-20px_60px_rgba(0,0,0,0.8)] max-h-[75vh] flex flex-col">
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-white/20 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--clr-border)]">
              <span className="text-base font-extrabold text-[var(--clr-text-1)]">{label}</span>
              <button type="button" onClick={() => setOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/8 text-slate-300 hover:bg-white/15 transition-all text-sm">✕</button>
            </div>
            <div className="overflow-y-auto flex-1 py-2" style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
              {options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false) }}
                  className={`w-full flex items-center gap-3 px-5 py-3.5 text-left transition-all border-l-[3px] ${
                    opt.value === value
                      ? 'bg-indigo-500/12 border-indigo-500 text-white font-bold'
                      : 'border-transparent hover:bg-white/5 text-slate-300 font-medium'
                  }`}
                >
                  {opt.sublabel && (
                    <span className="shrink-0 text-[11px] font-extrabold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">{opt.sublabel}</span>
                  )}
                  <span className="text-sm leading-snug flex-1">{opt.label}</span>
                  {opt.value === value && <span className="text-indigo-400 text-base shrink-0">✓</span>}
                </button>
              ))}
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
    courseType: 'NEW' as 'NEW' | 'OLD',
  })
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [agreePrivacy, setAgreePrivacy] = useState(false)
  const [faculties, setFaculties] = useState<Faculty[]>([])
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(data => {
      if (data?.authenticated && data?.user)
        window.location.href = data.user.role === 'ADMIN' ? '/admin' : '/dashboard'
    }).catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/api/admin/faculties').then(r => r.json()).then(d => setFaculties(d.faculties || [])).catch(() => toast.error('Failed to load faculties'))
  }, [])

  const selectedFaculty = faculties.find(f => f.id === formData.facultyId)
  const hasOldNewCourse = selectedFaculty?.id.toUpperCase() === 'BCA'

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
      window.location.href = '/'
    } finally { setLoading(false) }
  }

  return (
    <div className="flex-center" style={{ minHeight: 'calc(100vh - 64px)', padding: '40px 16px' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '460px', padding: '44px 36px' }}>
        
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

            {/* Faculty */}
            <CustomDropdown id="reg-faculty" label="Faculty" placeholder="Select your Faculty"
              options={facultyOptions} value={formData.facultyId}
              onChange={v => setFormData({ ...formData, facultyId: v, semesterOrder: '', courseType: 'NEW' })} />

            {/* Course Type (BCA only) */}
            {formData.facultyId && hasOldNewCourse && (
              <div>
                <label style={{ display: 'block', color: 'var(--clr-text-2)', fontSize: '13px', marginBottom: '6px' }}>Course Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'NEW', title: '✨ New Course', desc: '2080+' },
                    { value: 'OLD', title: '📖 Old Course', desc: 'Before 2080' },
                  ].map(opt => {
                    const active = formData.courseType === opt.value
                    return (
                      <button key={opt.value} type="button"
                        onClick={() => setFormData({ ...formData, courseType: opt.value as 'NEW' | 'OLD', semesterOrder: '' })}
                        style={{
                          padding: '12px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--clr-border)',
                          background: active ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.03)',
                          borderColor: active ? 'var(--clr-primary)' : 'var(--clr-border)',
                          color: active ? 'var(--clr-primary-h)' : 'var(--clr-text-2)',
                          fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px'
                        }}
                      >
                        <span>{opt.title}</span>
                        <span style={{ fontSize: '11px', opacity: 0.6, fontWeight: 400 }}>{opt.desc}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Semester */}
            <CustomDropdown id="reg-semester" label="Semester / Year"
              placeholder={formData.facultyId ? 'Select your Semester' : 'Select Faculty first'}
              options={semesterOptions} value={formData.semesterOrder}
              onChange={v => setFormData({ ...formData, semesterOrder: v })}
              disabled={!formData.facultyId} />

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
