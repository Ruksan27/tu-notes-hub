'use client'
// src/app/register/page.tsx
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { toast } from 'react-toastify'
import { useRouter } from 'next/navigation'

type Step = 'FORM' | 'OTP'

interface Faculty {
  id: string
  name: string
  systemType: 'SEMESTER' | 'YEARLY'
  semCount: number
}

export default function RegisterPage() {
  const [step, setStep] = useState<Step>('FORM')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    facultyId: '',
    semesterOrder: '',
  })
  const [faculties, setFaculties] = useState<Faculty[]>([])
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Fetch faculties list from API for registration dropdown
    fetch('/api/admin/faculties')
      .then((res) => res.json())
      .then((data) => {
        setFaculties(data.faculties || [])
      })
      .catch(() => toast.error('Failed to load faculties'))
  }, [])

  const selectedFaculty = faculties.find((f) => f.id === formData.facultyId)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.facultyId || !formData.semesterOrder) {
      toast.error('Please select your faculty and semester/year')
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
      if (!res.ok) {
        toast.error(data.error)
        return
      }
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
      if (!res.ok) {
        toast.error(data.error)
        return
      }
      localStorage.setItem('tu_user', JSON.stringify(data.user))
      toast.success('Account verified! Welcome to TU Notes Hub 🎉')
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  // Generate semester options based on selected faculty semCount
  const semesterOptions = []
  if (selectedFaculty) {
    const isYearly = selectedFaculty.systemType === 'YEARLY'
    const label = isYearly ? 'Year' : 'Semester'
    for (let i = 1; i <= (selectedFaculty.semCount || 8); i++) {
      const suffix = i === 1 ? 'st' : i === 2 ? 'nd' : i === 3 ? 'rd' : 'th'
      semesterOptions.push({
        value: i,
        label: `${i}${suffix} ${label}`,
      })
    }
  }

  return (
    <div className="flex-center" style={{ minHeight: 'calc(100vh - 68px)', padding: '40px 16px' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '480px', padding: '48px 40px' }}>
        {/* Header */}
        <div className="text-center" style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📚</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', marginBottom: '8px' }}>
            {step === 'FORM' ? 'Create Account' : 'Verify Email'}
          </h1>
          <p style={{ color: 'var(--clr-text-2)', fontSize: '14px' }}>
            {step === 'FORM' ? 'Join thousands of TU students' : `OTP sent to ${formData.email}`}
          </p>
        </div>

        {step === 'FORM' ? (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', color: 'var(--clr-text-2)', fontSize: '13px', marginBottom: '6px' }}>Faculty</label>
                <select
                  className="input-field"
                  value={formData.facultyId}
                  onChange={(e) => setFormData({ ...formData, facultyId: e.target.value, semesterOrder: '' })}
                  required
                  style={{ cursor: 'pointer' }}
                >
                  <option value="">Select Faculty</option>
                  {faculties.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.id.toUpperCase()} — {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', color: 'var(--clr-text-2)', fontSize: '13px', marginBottom: '6px' }}>Semester / Year</label>
                <select
                  className="input-field"
                  value={formData.semesterOrder}
                  onChange={(e) => setFormData({ ...formData, semesterOrder: e.target.value })}
                  required
                  disabled={!formData.facultyId}
                  style={{ cursor: formData.facultyId ? 'pointer' : 'not-allowed' }}
                >
                  <option value="">Select Period</option>
                  {semesterOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button id="reg-submit" type="submit" className="btn btn-primary" style={{ marginTop: '8px', justifyContent: 'center' }} disabled={loading}>
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
