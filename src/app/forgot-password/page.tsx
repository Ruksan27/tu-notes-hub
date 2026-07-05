'use client'
// src/app/forgot-password/page.tsx
import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'react-toastify'

type Step = 'EMAIL' | 'OTP' | 'RESET'

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('EMAIL')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setLoading(false)
    if (res.ok) { toast.success('OTP sent to your email!'); setStep('OTP') }
    else { const d = await res.json(); toast.error(d.error) }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, type: 'RESET' }),
    })
    setLoading(false)
    if (res.ok) { toast.success('OTP verified!'); setStep('RESET') }
    else { const d = await res.json(); toast.error(d.error) }
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { toast.error('Passwords do not match!'); return }
    setLoading(true)
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, password }),
    })
    setLoading(false)
    if (res.ok) { toast.success('Password reset! Please login.'); window.location.href = '/login' }
    else { const d = await res.json(); toast.error(d.error) }
  }

  const steps = ['EMAIL', 'OTP', 'RESET']
  const stepTitles = ['Enter Email', 'Verify OTP', 'New Password']

  return (
    <div className="flex-center" style={{ minHeight: 'calc(100vh - 68px)', padding: '40px 16px' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '440px', padding: '48px 40px' }}>
        {/* Steps indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '32px' }}>
          {steps.map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '28px', height: '28px',
                borderRadius: '50%',
                background: steps.indexOf(step) >= i ? 'var(--grad-brand)' : 'rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: 700, color: '#fff',
                transition: 'all 0.3s',
              }}>{i + 1}</div>
              {i < 2 && <div style={{ width: '32px', height: '2px', background: steps.indexOf(step) > i ? 'var(--clr-primary)' : 'rgba(255,255,255,0.1)', borderRadius: '2px', transition: 'all 0.3s' }} />}
            </div>
          ))}
        </div>

        <div className="text-center" style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>
            {step === 'EMAIL' ? '📧' : step === 'OTP' ? '🔢' : '🔐'}
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', marginBottom: '6px' }}>
            {stepTitles[steps.indexOf(step)]}
          </h1>
          <p style={{ color: 'var(--clr-text-3)', fontSize: '13px' }}>
            {step === 'EMAIL' ? 'Enter your registered email address' :
             step === 'OTP' ? `6-digit OTP sent to ${email}` : 'Choose a strong new password'}
          </p>
        </div>

        {step === 'EMAIL' && (
          <form onSubmit={sendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input className="input-field" type="email" placeholder="your.email@gmail.com" required
              value={email} onChange={(e) => setEmail(e.target.value)} />
            <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }} disabled={loading}>
              {loading ? <><span className="spinner" /> Sending...</> : '📧 Send OTP'}
            </button>
            <p className="text-center" style={{ color: 'var(--clr-text-3)', fontSize: '13px' }}>
              Remember it? <Link href="/login" style={{ color: 'var(--clr-primary-h)' }}>Login</Link>
            </p>
          </form>
        )}

        {step === 'OTP' && (
          <form onSubmit={verifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input className="input-field" placeholder="6-digit code" maxLength={6} required
              style={{ textAlign: 'center', fontSize: '28px', letterSpacing: '12px', fontFamily: 'var(--font-display)' }}
              value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} />
            <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }} disabled={loading || code.length < 6}>
              {loading ? <><span className="spinner" /> Verifying...</> : '✅ Verify OTP'}
            </button>
            <button type="button" className="btn btn-outline" style={{ justifyContent: 'center' }} onClick={() => setStep('EMAIL')}>← Back</button>
          </form>
        )}

        {step === 'RESET' && (
          <form onSubmit={resetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input className="input-field" type="password" placeholder="New password (min 8 chars)" minLength={8} required
              value={password} onChange={(e) => setPassword(e.target.value)} />
            <input className="input-field" type="password" placeholder="Confirm new password" required
              value={confirm} onChange={(e) => setConfirm(e.target.value)}
              style={{ borderColor: confirm && password !== confirm ? 'var(--clr-danger)' : undefined }} />
            {confirm && password !== confirm && (
              <p style={{ color: 'var(--clr-danger)', fontSize: '12px', marginTop: '-8px' }}>Passwords don&apos;t match</p>
            )}
            <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }} disabled={loading || password !== confirm}>
              {loading ? <><span className="spinner" /> Resetting...</> : '🔐 Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
