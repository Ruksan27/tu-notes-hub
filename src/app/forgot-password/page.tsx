'use client'
// src/app/forgot-password/page.tsx
import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { toast } from 'react-toastify'

const N = 6 // 6-digit OTP
const COOLDOWN = 60 // resend cooldown in seconds

type Step = 'EMAIL' | 'OTP' | 'RESET'
type OtpState = 'idle' | 'filling' | 'checking' | 'ok' | 'error'

/* ── tiny sound engine ── */
let ac: AudioContext | null = null
function getCtx() {
  if (!ac) {
    try { ac = new (window.AudioContext || (window as any).webkitAudioContext)() } catch { return null }
  }
  if (ac.state === 'suspended') ac.resume()
  return ac
}
function playTone(freq: number, dur: number, vol: number, type: OscillatorType = 'sine', delay = 0) {
  const c = getCtx(); if (!c) return
  const t = c.currentTime + delay
  const o = c.createOscillator(), g = c.createGain()
  o.type = type; o.frequency.setValueAtTime(freq, t)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.linearRampToValueAtTime(vol, t + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(c.destination)
  o.start(t); o.stop(t + dur + 0.02)
}
const sndOk  = () => { playTone(659, 0.11, 0.07); playTone(988, 0.2, 0.06, 'sine', 0.1) }
const sndErr = () => { playTone(196, 0.16, 0.08, 'sawtooth'); playTone(147, 0.22, 0.06, 'sawtooth', 0.09) }
const sndClick = () => playTone(1800, 0.04, 0.05, 'sine')

/* ─────────────────────────────────────────────────────── EMAIL STEP ── */
function EmailStep({ onSent }: { onSent: (email: string) => void }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        toast.success('OTP sent! Check your inbox.')
        onSent(email)
      } else {
        const d = await res.json()
        toast.error(d.error || 'Failed to send OTP')
      }
    } catch { toast.error('Network error') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ animation: 'fp-slide-in 0.45s cubic-bezier(0.22,1,0.36,1) both' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%', margin: '0 auto 20px',
          background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, rgba(99,102,241,0.05) 70%)',
          border: '1px solid rgba(99,102,241,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32,
        }}>📧</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, margin: '0 0 8px', color: 'var(--clr-text-1)' }}>
          Forgot Password?
        </h1>
        <p style={{ color: 'var(--clr-text-3)', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
          No worries. Enter your registered email and<br />we&apos;ll send you a 6-digit reset code.
        </p>
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text-2)', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Email address
          </label>
          <input
            id="fp-email"
            className="input-field"
            type="email"
            placeholder="hari@gmail.com"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          style={{ justifyContent: 'center', marginTop: 4, height: 48, fontSize: 15, fontWeight: 700 }}
          disabled={loading}
        >
          {loading ? <><span className="spinner" /> Sending OTP...</> : '📨 Send Reset Code'}
        </button>
        <p style={{ textAlign: 'center', color: 'var(--clr-text-3)', fontSize: 13, margin: 0 }}>
          Remember it? <Link href="/login" style={{ color: 'var(--clr-primary-h)', fontWeight: 600 }}>Back to Login</Link>
        </p>
      </form>
    </div>
  )
}

/* ─────────────────────────────────────────────────────── OTP STEP ── */
function OtpStep({ email, onVerified }: { email: string; onVerified: (code: string) => void }) {
  const [otp, setOtp] = useState<string[]>(Array(N).fill(''))
  const [otpState, setOtpState] = useState<OtpState>('idle')
  const [errMsg, setErrMsg] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const [loading, setLoading] = useState(false)
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])
  const coolRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const value = otp.join('')
  const isComplete = value.length === N && otp.every(d => d !== '')

  function focusSlot(i: number) {
    inputsRef.current[Math.max(0, Math.min(N - 1, i))]?.focus()
  }

  function updateDigit(i: number, ch: string) {
    sndClick()
    setOtp(prev => { const next = [...prev]; next[i] = ch; return next })
    setOtpState('filling')
    setErrMsg('')
  }

  function onInput(e: React.ChangeEvent<HTMLInputElement>, i: number) {
    const raw = e.target.value.replace(/\D/g, '')
    if (raw.length > 1) {
      // paste / autofill
      const chars = raw.slice(0, N).split('')
      const next = [...otp]
      chars.forEach((c, idx) => { if (i + idx < N) next[i + idx] = c })
      setOtp(next)
      setOtpState('filling')
      setErrMsg('')
      const last = Math.min(i + chars.length, N - 1)
      focusSlot(last)
      if (next.every(d => d !== '') && next.join('').length === N) triggerVerify(next.join(''))
      return
    }
    const ch = raw.slice(-1)
    updateDigit(i, ch)
    if (ch && i < N - 1) focusSlot(i + 1)
    if (ch && i === N - 1 && [...otp.slice(0, N - 1), ch].every(d => d !== '')) {
      triggerVerify([...otp.slice(0, N - 1), ch].join(''))
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>, i: number) {
    if (e.key === 'Backspace') {
      e.preventDefault()
      if (otp[i]) {
        updateDigit(i, '')
      } else if (i > 0) {
        updateDigit(i - 1, '')
        focusSlot(i - 1)
      }
    } else if (e.key === 'ArrowLeft') { e.preventDefault(); focusSlot(i - 1) }
    else if (e.key === 'ArrowRight') { e.preventDefault(); focusSlot(i + 1) }
  }

  function onPaste(e: React.ClipboardEvent, i: number) {
    const text = e.clipboardData.getData('text').replace(/\D/g, '')
    if (!text) return
    e.preventDefault()
    const chars = text.slice(0, N).split('')
    const next = [...otp]
    chars.forEach((c, idx) => { if (idx < N) next[idx] = c })
    setOtp(next)
    setOtpState('filling')
    focusSlot(Math.min(chars.length, N - 1))
    if (next.every(d => d !== '')) triggerVerify(next.join(''))
  }

  async function triggerVerify(code: string) {
    setLoading(true)
    setOtpState('checking')
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, type: 'FORGOT_PASSWORD' }),
      })
      if (res.ok) {
        setOtpState('ok')
        sndOk()
        setTimeout(() => onVerified(code), 1200)
      } else {
        const d = await res.json()
        setOtpState('error')
        setErrMsg(d.error || 'Invalid or expired code')
        sndErr()
        setTimeout(() => { setOtpState('filling'); setOtp(Array(N).fill('')); focusSlot(0) }, 1600)
      }
    } catch {
      setOtpState('error')
      setErrMsg('Network error. Try again.')
      sndErr()
      setTimeout(() => { setOtpState('filling'); setOtp(Array(N).fill('')); focusSlot(0) }, 1600)
    } finally {
      setLoading(false)
    }
  }

  async function resendOtp() {
    if (cooldown > 0) return
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        toast.success('New OTP sent!')
        setOtp(Array(N).fill(''))
        setOtpState('idle')
        setErrMsg('')
        setCooldown(COOLDOWN)
        coolRef.current = setInterval(() => {
          setCooldown(prev => {
            if (prev <= 1) { clearInterval(coolRef.current!); return 0 }
            return prev - 1
          })
        }, 1000)
      } else toast.error('Failed to resend OTP')
    } catch { toast.error('Network error') }
  }

  useEffect(() => () => { if (coolRef.current) clearInterval(coolRef.current) }, [])

  // colour helpers
  const boxBg = (i: number) => {
    if (otpState === 'ok') return '#0c2b21'
    if (otpState === 'error') return 'rgba(255,77,106,0.13)'
    if (otpState === 'checking') return '#232830'
    return otp[i] ? '#232830' : '#1c1f24'
  }
  const boxBorder = (i: number) => {
    if (otpState === 'ok') return '1.8px solid #2ee6a8'
    if (otpState === 'error') return '1.6px solid rgba(255,77,106,0.78)'
    if (otpState === 'checking') return '1.6px solid rgba(220,234,255,0.72)'
    return otp[i] ? '1.6px solid rgba(150,200,255,0.5)' : '1px solid rgba(238,242,247,0.10)'
  }
  const digitColor = () => {
    if (otpState === 'ok') return '#c6ffe9'
    if (otpState === 'error') return '#ffa3b2'
    return '#eef2f7'
  }

  return (
    <div style={{ animation: 'fp-slide-in 0.45s cubic-bezier(0.22,1,0.36,1) both' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%', margin: '0 auto 20px',
          background: otpState === 'ok'
            ? 'radial-gradient(circle, rgba(46,230,168,0.25) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, rgba(99,102,241,0.05) 70%)',
          border: otpState === 'ok' ? '1px solid rgba(46,230,168,0.5)' : '1px solid rgba(99,102,241,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32,
          transition: 'all 0.5s ease',
        }}>
          {otpState === 'ok' ? '✅' : otpState === 'checking' ? '⏳' : '🔢'}
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, margin: '0 0 8px', color: 'var(--clr-text-1)', transition: 'color 0.4s' }}>
          {otpState === 'ok' ? 'Code Verified!' : 'Enter Reset Code'}
        </h1>
        <p style={{ color: 'var(--clr-text-3)', fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>
          {otpState === 'ok'
            ? 'Taking you to set your new password…'
            : <>6-digit code sent to <strong style={{ color: 'var(--clr-text-2)' }}>{email}</strong></>}
        </p>
      </div>

      {/* OTP Boxes */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 12,
        animation: otpState === 'error' ? 'gyre-shake 0.44s cubic-bezier(0.36,0.07,0.19,0.97)' : 'none',
      }}>
        {Array.from({ length: N }, (_, i) => (
          <div
            key={i}
            style={{
              position: 'relative',
              width: 'clamp(42px, 12vw, 54px)',
              aspectRatio: '1',
              borderRadius: 14,
              background: boxBg(i),
              boxShadow: otpState === 'ok' ? '0 0 0 1.8px #2ee6a8, 0 8px 24px -8px rgba(46,230,168,0.3)' : 'none',
              border: boxBorder(i),
              transition: 'background 0.25s ease, border 0.25s ease, box-shadow 0.3s ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {/* the visible digit */}
            <span style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 'clamp(18px,5vw,22px)', fontWeight: 800, color: digitColor(),
              fontFamily: 'var(--font-display)', letterSpacing: 0,
              transition: 'color 0.3s ease',
              pointerEvents: 'none', userSelect: 'none',
            }}>
              {otp[i] || ''}
            </span>
            {/* the real input (transparent, takes inputs) */}
            <input
              ref={el => { inputsRef.current[i] = el }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]"
              maxLength={6}
              value={otp[i]}
              onChange={e => onInput(e, i)}
              onKeyDown={e => onKeyDown(e, i)}
              onPaste={e => onPaste(e, i)}
              onFocus={e => e.target.select()}
              disabled={otpState === 'checking' || otpState === 'ok'}
              autoComplete={i === 0 ? 'one-time-code' : 'off'}
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                opacity: 0, border: 0, outline: 'none', cursor: 'text',
                borderRadius: 'inherit', background: 'transparent',
              }}
            />
          </div>
        ))}
      </div>

      {/* Error message */}
      <div style={{
        minHeight: 20, textAlign: 'center', marginBottom: 16,
        color: '#ffa3b2', fontSize: 12.5, fontWeight: 500,
        opacity: (otpState === 'error' && errMsg) ? 1 : 0,
        transform: (otpState === 'error' && errMsg) ? 'none' : 'translateY(-4px)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
      }}>
        {errMsg || ' '}
      </div>

      {/* Resend + loading */}
      {otpState !== 'ok' && (
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          {loading && otpState === 'checking' ? (
            <p style={{ color: 'var(--clr-text-3)', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span className="spinner" style={{ width: 14, height: 14 }} /> Verifying…
            </p>
          ) : (
            <p style={{ color: 'var(--clr-text-3)', fontSize: 13, margin: 0 }}>
              Didn&apos;t receive it?{' '}
              <button
                onClick={resendOtp}
                disabled={cooldown > 0}
                style={{
                  background: 'none', border: 0, cursor: cooldown > 0 ? 'default' : 'pointer',
                  color: cooldown > 0 ? 'var(--clr-text-3)' : 'var(--clr-primary-h)',
                  fontWeight: 700, fontSize: 13, fontFamily: 'inherit', padding: 0,
                  transition: 'color 0.2s',
                }}
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
              </button>
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => window.history.back()}
        style={{
          display: 'block', width: '100%', textAlign: 'center', marginTop: 8,
          background: 'none', border: 0, cursor: 'pointer', color: 'var(--clr-text-3)',
          fontSize: 13, fontFamily: 'inherit', padding: '4px 0',
        }}
      >
        ← Change email
      </button>
    </div>
  )
}

/* ─────────────────────────────────────────────────────── RESET STEP ── */
function ResetStep({ email, code }: { email: string; code: string }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [showCf, setShowCf] = useState(false)
  const mismatch = confirm.length > 0 && password !== confirm

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (mismatch) { toast.error('Passwords do not match'); return }
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword: password }),
      })
      if (res.ok) {
        sndOk()
        toast.success('Password reset! Redirecting to login…')
        setTimeout(() => { window.location.href = '/login' }, 1500)
      } else {
        const d = await res.json()
        sndErr()
        toast.error(d.error || 'Reset failed')
      }
    } catch { sndErr(); toast.error('Network error') }
    finally { setLoading(false) }
  }

  const strength = password.length === 0 ? 0
    : password.length < 8 ? 1
    : /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^a-zA-Z0-9]/.test(password) ? 3
    : 2

  const strengthLabel = ['', 'Weak', 'Good', 'Strong']
  const strengthColor = ['', '#ff4d6a', '#f59e0b', '#2ee6a8']

  return (
    <div style={{ animation: 'fp-slide-in 0.45s cubic-bezier(0.22,1,0.36,1) both' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%', margin: '0 auto 20px',
          background: 'radial-gradient(circle, rgba(46,230,168,0.25) 0%, transparent 70%)',
          border: '1px solid rgba(46,230,168,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32,
        }}>🔐</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, margin: '0 0 8px', color: 'var(--clr-text-1)' }}>
          Set New Password
        </h1>
        <p style={{ color: 'var(--clr-text-3)', fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>
          Choose a strong password for <strong style={{ color: 'var(--clr-text-2)' }}>{email}</strong>
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* New password */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text-2)', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            New password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="fp-new-password"
              className="input-field"
              type={showPw ? 'text' : 'password'}
              placeholder="Min 8 characters"
              minLength={8}
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ paddingRight: 44 }}
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 0, cursor: 'pointer', color: 'var(--clr-text-3)', fontSize: 16, lineHeight: 1, padding: 0 }}
            >
              {showPw ? '🙈' : '👁️'}
            </button>
          </div>
          {/* Strength bar */}
          {password.length > 0 && (
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, display: 'flex', gap: 4 }}>
                {[1, 2, 3].map(lvl => (
                  <div key={lvl} style={{
                    flex: 1, height: 3, borderRadius: 99,
                    background: strength >= lvl ? strengthColor[strength] : 'rgba(255,255,255,0.1)',
                    transition: 'background 0.3s ease',
                  }} />
                ))}
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: strengthColor[strength], minWidth: 40 }}>
                {strengthLabel[strength]}
              </span>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text-2)', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Confirm password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="fp-confirm-password"
              className="input-field"
              type={showCf ? 'text' : 'password'}
              placeholder="Repeat password"
              required
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              style={{ paddingRight: 44, borderColor: mismatch ? '#ff4d6a' : undefined }}
            />
            <button
              type="button"
              onClick={() => setShowCf(v => !v)}
              style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 0, cursor: 'pointer', color: 'var(--clr-text-3)', fontSize: 16, lineHeight: 1, padding: 0 }}
            >
              {showCf ? '🙈' : '👁️'}
            </button>
          </div>
          {mismatch && (
            <p style={{ color: '#ff4d6a', fontSize: 12, margin: '6px 0 0', fontWeight: 500 }}>
              Passwords don&apos;t match
            </p>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ justifyContent: 'center', marginTop: 4, height: 48, fontSize: 15, fontWeight: 700 }}
          disabled={loading || mismatch || password.length < 8}
        >
          {loading ? <><span className="spinner" /> Resetting...</> : '🔐 Reset Password'}
        </button>
      </form>
    </div>
  )
}

/* ─────────────────────────────────────────────────────── MAIN PAGE ── */
export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('EMAIL')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')

  const stepIndex = { EMAIL: 0, OTP: 1, RESET: 2 }[step]
  const stepLabels = ['Email', 'Verify', 'Reset']

  return (
    <>
      <style>{`
        @keyframes fp-slide-in {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes gyre-shake {
          0%,100% { transform: translate3d(0,0,0) }
          16%  { transform: translate3d(-7px,0,0) }
          33%  { transform: translate3d(6px,0,0) }
          50%  { transform: translate3d(-4px,0,0) }
          68%  { transform: translate3d(3px,0,0) }
          84%  { transform: translate3d(-1.5px,0,0) }
        }
      `}</style>

      <div className="flex-center" style={{ minHeight: 'calc(100vh - 64px)', padding: '40px 16px' }}>
        <div
          className="glass-card"
          style={{ width: '100%', maxWidth: 460, padding: '40px 36px 36px', position: 'relative', overflow: 'hidden' }}
        >
          {/* Ambient glow top */}
          <div style={{
            position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
            width: 280, height: 2,
            background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.6), transparent)',
            borderRadius: '0 0 50% 50%',
          }} />

          {/* Step progress */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0, marginBottom: 32 }}>
            {stepLabels.map((label, i) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: stepIndex >= i
                      ? 'linear-gradient(135deg, var(--clr-primary), #06b6d4)'
                      : 'rgba(255,255,255,0.06)',
                    border: stepIndex === i
                      ? '2px solid rgba(99,102,241,0.8)'
                      : stepIndex > i ? '2px solid rgba(99,102,241,0.4)' : '2px solid rgba(255,255,255,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 800, color: stepIndex >= i ? '#fff' : 'var(--clr-text-3)',
                    transition: 'all 0.4s ease',
                    boxShadow: stepIndex === i ? '0 0 0 4px rgba(99,102,241,0.15)' : 'none',
                  }}>
                    {stepIndex > i ? '✓' : i + 1}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, color: stepIndex >= i ? 'var(--clr-text-2)' : 'var(--clr-text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', transition: 'color 0.3s' }}>
                    {label}
                  </span>
                </div>
                {i < 2 && (
                  <div style={{
                    width: 48, height: 2, margin: '0 4px', marginBottom: 18,
                    background: stepIndex > i
                      ? 'linear-gradient(90deg, var(--clr-primary), #06b6d4)'
                      : 'rgba(255,255,255,0.07)',
                    borderRadius: 99, transition: 'background 0.4s ease',
                  }} />
                )}
              </div>
            ))}
          </div>

          {/* Step content */}
          {step === 'EMAIL' && (
            <EmailStep onSent={em => { setEmail(em); setStep('OTP') }} />
          )}
          {step === 'OTP' && (
            <OtpStep email={email} onVerified={c => { setCode(c); setStep('RESET') }} />
          )}
          {step === 'RESET' && (
            <ResetStep email={email} code={code} />
          )}
        </div>
      </div>
    </>
  )
}
