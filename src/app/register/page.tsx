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
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">{label}</label>
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => !disabled && setOpen(p => !p)}
        className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl text-sm transition-all outline-none border ${
          open ? 'border-indigo-500/60 bg-indigo-500/5' : 'border-white/10 bg-white/[0.04]'
        } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:border-white/20'}`}
      >
        <span className="flex-1 text-left leading-snug">
          {selected ? (
            <>
              {selected.sublabel && <span className="font-extrabold text-indigo-400 mr-1.5">{selected.sublabel}</span>}
              <span className="text-white font-semibold">{selected.label}</span>
            </>
          ) : (
            <span className="text-slate-500">{placeholder}</span>
          )}
        </span>
        <span className={`text-slate-500 text-xs transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          {/* Bottom Sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-[#12131f] rounded-t-3xl border-t border-white/10 shadow-[0_-20px_60px_rgba(0,0,0,0.7)] max-h-[75vh] flex flex-col">
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-white/20 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
              <span className="text-base font-extrabold text-white">{label}</span>
              <button type="button" onClick={() => setOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/8 text-slate-300 hover:bg-white/15 transition-all text-sm">✕</button>
            </div>
            <div className="overflow-y-auto flex-1 py-2" style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
              {options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false) }}
                  className={`w-full flex items-center gap-3 px-5 py-4 text-left transition-all border-l-[3px] ${
                    opt.value === value
                      ? 'bg-indigo-500/12 border-indigo-500 text-white'
                      : 'border-transparent hover:bg-white/5 text-slate-300'
                  }`}
                >
                  {opt.sublabel && (
                    <span className="shrink-0 text-[11px] font-extrabold px-2 py-1 rounded-lg bg-indigo-500/15 text-indigo-300">{opt.sublabel}</span>
                  )}
                  <span className={`text-sm font-${opt.value === value ? 'bold' : 'medium'} leading-snug flex-1`}>{opt.label}</span>
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

const LABEL_CLS = 'block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2'
const INPUT_CLS = 'w-full bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white outline-none focus:border-indigo-500/60 focus:bg-indigo-500/5 transition-all placeholder:text-slate-600'

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
    <div className="min-h-[calc(100vh-68px)] flex items-start sm:items-center justify-center bg-[#0a0c10] px-4 py-10 sm:py-16">
      {/* Background glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[80vw] max-w-xl h-64 bg-indigo-500/15 blur-[100px] pointer-events-none rounded-full" />

      <div className="relative z-10 w-full max-w-[440px]">

        {/* Card */}
        <div className="bg-slate-900/80 border border-white/8 rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl overflow-hidden">

          {/* Top gradient accent */}
          <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-500" />

          <div className="p-6 sm:p-8">

            {/* Header */}
            <div className="flex flex-col items-center text-center mb-7">
              <div className="mb-4 relative">
                <div className="absolute inset-0 bg-indigo-500/30 blur-xl rounded-full scale-150" />
                <Image src="/logo.png" alt="TU Notes Hub" width={60} height={60} priority className="relative z-10 object-contain drop-shadow-lg" />
              </div>

              {step === 'FORM' ? (
                <>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-1.5">Create Account</h1>
                  <p className="text-sm text-slate-400">Join thousands of TU students 🎓</p>
                </>
              ) : (
                <>
                  <h1 className="text-2xl font-extrabold text-white tracking-tight mb-1.5">Verify Email</h1>
                  <p className="text-sm text-slate-400">OTP sent to <span className="text-indigo-400 font-semibold">{formData.email}</span></p>
                </>
              )}
            </div>

            {/* ── FORM STEP ── */}
            {step === 'FORM' ? (
              <form onSubmit={handleRegister} className="flex flex-col gap-4">

                {/* Name */}
                <div>
                  <label className={LABEL_CLS} htmlFor="reg-name">Full Name</label>
                  <input id="reg-name" className={INPUT_CLS} placeholder="Hari Prasad Sharma" required
                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>

                {/* Email */}
                <div>
                  <label className={LABEL_CLS} htmlFor="reg-email">Email Address</label>
                  <input id="reg-email" className={INPUT_CLS} type="email" placeholder="hari@gmail.com" required
                    value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                </div>

                {/* Password */}
                <div>
                  <label className={LABEL_CLS} htmlFor="reg-password">Password</label>
                  <div className="relative">
                    <input id="reg-password" className={INPUT_CLS + ' pr-12'} type={showPassword ? 'text' : 'password'} placeholder="At least 8 characters" required minLength={8}
                      value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                    <button type="button" tabIndex={-1} onClick={() => setShowPassword(p => !p)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-sm transition-colors select-none">
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
                    <label className={LABEL_CLS}>Course Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: 'NEW', title: '✨ New Course', desc: '2080+', color: 'indigo' },
                        { value: 'OLD', title: '📖 Old Course', desc: 'Before 2080', color: 'amber' },
                      ].map(opt => {
                        const active = formData.courseType === opt.value
                        return (
                          <button key={opt.value} type="button"
                            onClick={() => setFormData({ ...formData, courseType: opt.value as 'NEW' | 'OLD', semesterOrder: '' })}
                            className={`relative flex flex-col items-center gap-1 py-4 px-3 rounded-2xl border-2 transition-all font-bold text-sm ${
                              active
                                ? opt.color === 'indigo'
                                  ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                                  : 'border-amber-500 bg-amber-500/10 text-amber-300'
                                : 'border-white/10 bg-white/[0.02] text-slate-400 hover:border-white/20'
                            }`}
                          >
                            {active && <span className={`absolute top-2 right-2.5 text-xs font-black ${opt.color === 'indigo' ? 'text-indigo-400' : 'text-amber-400'}`}>✓</span>}
                            <span>{opt.title}</span>
                            <span className="text-[10px] font-normal opacity-60">{opt.desc}</span>
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
                <div className="flex flex-col gap-2.5 p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                  {[
                    { id: 'chk-terms', checked: agreeTerms, set: setAgreeTerms, href: '/terms', label: 'Terms of Service' },
                    { id: 'chk-privacy', checked: agreePrivacy, set: setAgreePrivacy, href: '/privacy', label: 'Privacy Policy' },
                  ].map(item => (
                    <label key={item.id} htmlFor={item.id} className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                        item.checked ? 'bg-indigo-500 border-indigo-500' : 'border-white/20 group-hover:border-white/40'
                      }`}>
                        {item.checked && <span className="text-white text-xs font-black">✓</span>}
                      </div>
                      <input id={item.id} type="checkbox" className="sr-only" checked={item.checked} onChange={e => item.set(e.target.checked)} required />
                      <span className="text-xs text-slate-400">
                        I agree to the{' '}
                        <Link href={item.href} target="_blank" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 font-semibold">{item.label}</Link>
                      </span>
                    </label>
                  ))}
                </div>

                {/* Submit */}
                <button id="reg-submit" type="submit" disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-500 to-cyan-400 text-white font-extrabold py-4 rounded-2xl text-sm hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-60 disabled:translate-y-0 flex items-center justify-center gap-2 mt-1"
                >
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending OTP…</>
                  ) : (
                    '📧 Create Account & Send OTP'
                  )}
                </button>

                <p className="text-center text-xs text-slate-500 mt-1">
                  Already have an account?{' '}
                  <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors">Sign in</Link>
                </p>
              </form>

            ) : (
              /* ── OTP STEP ── */
              <form onSubmit={handleVerify} className="flex flex-col gap-4">

                {/* OTP Info box */}
                <div className="bg-indigo-500/8 border border-indigo-500/20 rounded-2xl p-4 text-center">
                  <div className="text-3xl mb-2">📬</div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    We sent a <span className="text-white font-bold">6-digit OTP</span> to<br />
                    <span className="text-indigo-400 font-semibold">{formData.email}</span><br />
                    Check your inbox (and spam folder)
                  </p>
                </div>

                {/* OTP Input */}
                <div>
                  <label className={LABEL_CLS} htmlFor="otp-input">Enter OTP</label>
                  <input
                    id="otp-input"
                    className="w-full bg-white/[0.04] border-2 border-white/10 focus:border-indigo-500 rounded-2xl px-4 py-5 text-center text-4xl font-black text-white tracking-[16px] outline-none transition-all font-mono placeholder:text-slate-700 placeholder:tracking-widest"
                    placeholder="••••••"
                    maxLength={6}
                    required
                    inputMode="numeric"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  />
                  {/* Progress dots */}
                  <div className="flex justify-center gap-2 mt-3">
                    {[0,1,2,3,4,5].map(i => (
                      <div key={i} className={`w-2 h-2 rounded-full transition-all duration-200 ${
                        i < otp.length ? 'bg-indigo-500 scale-110' : 'bg-white/10'
                      }`} />
                    ))}
                  </div>
                </div>

                <button id="otp-submit" type="submit" disabled={loading || otp.length < 6}
                  className="w-full bg-gradient-to-r from-emerald-500 to-cyan-400 text-white font-extrabold py-4 rounded-2xl text-sm hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-40 disabled:translate-y-0 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Verifying…</>
                  ) : (
                    '✅ Verify & Activate Account'
                  )}
                </button>

                <button type="button" onClick={() => setStep('FORM')}
                  className="w-full py-3 rounded-2xl border border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/8 hover:text-white text-sm font-semibold transition-all">
                  ← Back to Register
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom note */}
        <p className="text-center text-xs text-slate-600 mt-5">
          🔒 Your data is secure and never shared with third parties.
        </p>
      </div>
    </div>
  )
}
