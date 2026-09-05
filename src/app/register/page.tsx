'use client'
// src/app/register/page.tsx
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'react-toastify'

type Step = 'FORM' | 'OTP'

interface Semester {
  id: string
  visibleOld: boolean
  visibleNew: boolean
}

interface Faculty {
  id: string
  name: string
  systemType: 'SEMESTER' | 'YEARLY'
  semCount: number
  semesters: Semester[]
}

// ─── Custom Dropdown (mobile-safe) ───────────────────────────────────────────
interface DropdownOption {
  value: string
  label: string
  sublabel?: string
}

function CustomDropdown({
  id,
  label,
  placeholder,
  options,
  value,
  onChange,
  disabled,
}: {
  id: string
  label: string
  placeholder: string
  options: DropdownOption[]
  value: string
  onChange: (v: string) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find((o) => o.value === value)

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Close on scroll/resize
  useEffect(() => {
    if (open) {
      const close = () => setOpen(false)
      window.addEventListener('resize', close)
      return () => window.removeEventListener('resize', close)
    }
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <label style={{ display: 'block', color: 'var(--clr-text-2)', fontSize: '13px', marginBottom: '6px' }}>
        {label}
      </label>
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => !disabled && setOpen((p) => !p)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          padding: '12px 14px',
          borderRadius: '10px',
          background: 'var(--clr-bg-700)',
          border: `1px solid ${open ? 'rgba(99,102,241,0.6)' : 'var(--clr-border)'}`,
          color: selected ? 'var(--clr-text-1)' : 'var(--clr-text-3)',
          fontSize: '14px',
          fontWeight: selected ? 600 : 400,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          transition: 'border-color 0.2s',
          textAlign: 'left',
          minHeight: '44px',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {selected ? (
            <>
              <span style={{ fontWeight: 700, color: 'var(--clr-primary-h)' }}>{selected.sublabel ?? ''}</span>
              {selected.sublabel && ' '}
              {selected.label}
            </>
          ) : placeholder}
        </span>
        <span style={{
          fontSize: '12px',
          color: 'var(--clr-text-3)',
          transform: open ? 'rotate(180deg)' : 'none',
          transition: 'transform 0.2s',
          flexShrink: 0,
        }}>▼</span>
      </button>

      {/* Dropdown panel */}
      {open && (
        <>
          {/* Mobile: full-screen overlay */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9998,
              background: 'rgba(0,0,0,0.5)',
            }}
            onClick={() => setOpen(false)}
          />
          {/* On mobile: bottom sheet; on desktop: inline popover */}
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            background: 'var(--clr-bg-800, #1a1b2e)',
            borderRadius: '20px 20px 0 0',
            border: '1px solid rgba(255,255,255,0.1)',
            borderBottom: 'none',
            maxHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 -8px 40px rgba(0,0,0,0.6)',
          }}>
            {/* Handle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--clr-text-1)' }}>{label}</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', color: 'var(--clr-text-2)', fontSize: '14px' }}
              >✕</button>
            </div>
            {/* Options list */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '8px 0', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
              {options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value)
                    setOpen(false)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    padding: '13px 20px',
                    background: opt.value === value ? 'rgba(99,102,241,0.12)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s',
                    borderLeft: opt.value === value ? '3px solid #6366f1' : '3px solid transparent',
                  }}
                >
                  {opt.sublabel && (
                    <span style={{
                      background: 'rgba(99,102,241,0.2)',
                      color: '#818cf8',
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '2px 7px',
                      borderRadius: '5px',
                      flexShrink: 0,
                      letterSpacing: '0.3px',
                    }}>{opt.sublabel}</span>
                  )}
                  <span style={{ fontSize: '14px', color: opt.value === value ? 'var(--clr-text-1)' : 'var(--clr-text-2)', fontWeight: opt.value === value ? 700 : 400, lineHeight: 1.3 }}>
                    {opt.label}
                  </span>
                  {opt.value === value && (
                    <span style={{ marginLeft: 'auto', color: '#6366f1', fontSize: '16px' }}>✓</span>
                  )}
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
    name: '',
    email: '',
    password: '',
    facultyId: '',
    semesterOrder: '',
    courseType: 'NEW' as 'NEW' | 'OLD', // New course by default
  })
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [agreePrivacy, setAgreePrivacy] = useState(false)
  const [faculties, setFaculties] = useState<Faculty[]>([])
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data && data.authenticated && data.user) {
          window.location.href = data.user.role === 'ADMIN' ? '/admin' : '/dashboard'
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/api/admin/faculties')
      .then((res) => res.json())
      .then((data) => setFaculties(data.faculties || []))
      .catch(() => toast.error('Failed to load faculties'))
  }, [])

  const selectedFaculty = faculties.find((f) => f.id === formData.facultyId)

  // Check if this faculty has BOTH old and new course versions
  // Currently, only BCA has two courses (Old and New)
  const hasOldNewCourse = selectedFaculty
    ? selectedFaculty.id.toUpperCase() === 'BCA'
    : false

  const facultyOptions: DropdownOption[] = faculties.map((f) => ({
    value: f.id,
    label: f.name,
    sublabel: f.id.toUpperCase(),
  }))

  const semesterOptions: DropdownOption[] = []
  if (selectedFaculty) {
    const isYearly = selectedFaculty.systemType === 'YEARLY'
    const lbl = isYearly ? 'Year' : 'Semester'
    for (let i = 1; i <= (selectedFaculty.semCount || 8); i++) {
      const suffix = i === 1 ? 'st' : i === 2 ? 'nd' : i === 3 ? 'rd' : 'th'
      semesterOptions.push({ value: String(i), label: `${i}${suffix} ${lbl}` })
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.facultyId || !formData.semesterOrder) {
      toast.error('Please select your faculty and semester/year')
      return
    }
    if (!agreeTerms || !agreePrivacy) {
      toast.error('You must agree to the Terms of Service and Privacy Policy.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success('OTP sent to your email!')
      setStep('OTP')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, code: otp, type: 'REGISTER' }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      localStorage.setItem('tu_user', JSON.stringify(data.user))
      toast.success('Account verified! Welcome to TU Notes Hub 🎉')
      window.location.href = '/'
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-center" style={{ minHeight: 'calc(100vh - 68px)', padding: '40px 16px' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '480px', padding: 'clamp(28px, 6vw, 48px) clamp(20px, 6vw, 40px)' }}>
        {/* Header */}
        <div className="text-center" style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
            <Image src="/logo.png" alt="TU Notes Hub" width={68} height={68} priority style={{ objectFit: 'contain' }} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px, 5vw, 28px)', marginBottom: '6px' }}>
            {step === 'FORM' ? 'Create Account' : 'Verify Email'}
          </h1>
          <p style={{ color: 'var(--clr-text-2)', fontSize: '14px' }}>
            {step === 'FORM' ? 'Join thousands of TU students' : `OTP sent to ${formData.email}`}
          </p>
        </div>

        {step === 'FORM' ? (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', color: 'var(--clr-text-2)', fontSize: '13px', marginBottom: '6px' }}>Full Name</label>
              <input id="reg-name" className="input-field" placeholder="Hari Prasad Sharma" required
                value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>

            <div>
              <label style={{ display: 'block', color: 'var(--clr-text-2)', fontSize: '13px', marginBottom: '6px' }}>Email Address</label>
              <input id="reg-email" className="input-field" type="email" placeholder="hari@gmail.com" required
                value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>

            <div>
              <label style={{ display: 'block', color: 'var(--clr-text-2)', fontSize: '13px', marginBottom: '6px' }}>Password</label>
              <input id="reg-password" className="input-field" type="password" placeholder="At least 8 characters" required minLength={8}
                value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
            </div>

            {/* 1. Faculty */}
            <CustomDropdown
              id="reg-faculty"
              label="Faculty"
              placeholder="Select Faculty"
              options={facultyOptions}
              value={formData.facultyId}
              onChange={(v) => setFormData({ ...formData, facultyId: v, semesterOrder: '', courseType: 'NEW' })}
            />

            {/* 2. Course Type — only for faculties that have both old & new courses in DB */}
            {formData.facultyId && hasOldNewCourse && (
              <div>
                <label style={{ display: 'block', color: 'var(--clr-text-2)', fontSize: '13px', marginBottom: '10px' }}>
                  Course Type
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {[
                    { value: 'NEW', title: 'New Course', color: '#6366f1' },
                    { value: 'OLD', title: 'Old Course', color: '#f59e0b' },
                  ].map((opt) => {
                    const isActive = formData.courseType === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, courseType: opt.value as 'NEW' | 'OLD', semesterOrder: '' })}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          gap: '4px', padding: '16px 10px', borderRadius: '12px',
                          border: `2px solid ${isActive ? opt.color : 'rgba(255,255,255,0.1)'}`,
                          background: isActive ? `${opt.color}15` : 'rgba(255,255,255,0.02)',
                          cursor: 'pointer', transition: 'all 0.2s', position: 'relative',
                          minHeight: '60px',
                        }}
                      >
                        {isActive && (
                          <span style={{ position: 'absolute', top: '6px', right: '8px', fontSize: '13px', color: opt.color, fontWeight: 900 }}>✓</span>
                        )}
                        <span style={{ fontSize: '14px', fontWeight: 800, color: isActive ? opt.color : 'var(--clr-text-1)' }}>
                          {opt.title}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* 3. Semester / Year */}
            <CustomDropdown
              id="reg-semester"
              label="Semester / Year"
              placeholder={formData.facultyId ? 'Select Period' : 'Select faculty first'}
              options={semesterOptions}
              value={formData.semesterOrder}
              onChange={(v) => setFormData({ ...formData, semesterOrder: v })}
              disabled={!formData.facultyId}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '4px 0' }}>
              <label style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer', fontSize: '13px', color: 'var(--clr-text-2)' }}>
                <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} required style={{ cursor: 'pointer', width: '16px', height: '16px' }} />
                <span>I Agree to the <Link href="/terms" target="_blank" style={{ color: 'var(--clr-primary-h)', textDecoration: 'underline' }}>Terms of Service</Link></span>
              </label>
              <label style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer', fontSize: '13px', color: 'var(--clr-text-2)' }}>
                <input type="checkbox" checked={agreePrivacy} onChange={(e) => setAgreePrivacy(e.target.checked)} required style={{ cursor: 'pointer', width: '16px', height: '16px' }} />
                <span>I Agree to the <Link href="/privacy" target="_blank" style={{ color: 'var(--clr-primary-h)', textDecoration: 'underline' }}>Privacy Policy</Link></span>
              </label>
            </div>

            <button id="reg-submit" type="submit" className="btn btn-primary" style={{ marginTop: '4px', justifyContent: 'center' }} disabled={loading}>
              {loading ? <><span className="spinner" /> Sending OTP...</> : '📧 Create Account & Send OTP'}
            </button>

            <p className="text-center" style={{ color: 'var(--clr-text-3)', fontSize: '13px' }}>
              Already have an account? <Link href="/login" style={{ color: 'var(--clr-primary-h)' }}>Login</Link>
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', color: 'var(--clr-text-2)', fontSize: '13px', marginBottom: '6px' }}>6-Digit OTP</label>
              <input id="otp-input" className="input-field" placeholder="123456" maxLength={6} required
                style={{ textAlign: 'center', fontSize: '28px', letterSpacing: '12px', fontFamily: 'var(--font-display)' }}
                value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} />
            </div>
            <button id="otp-submit" type="submit" className="btn btn-primary" style={{ marginTop: '8px', justifyContent: 'center' }} disabled={loading || otp.length < 6}>
              {loading ? <><span className="spinner" /> Verifying...</> : '✅ Verify & Activate Account'}
            </button>
            <button type="button" className="btn btn-outline" style={{ justifyContent: 'center' }} onClick={() => setStep('FORM')}>
              ← Back
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
