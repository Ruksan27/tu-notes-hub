'use client'
// src/app/login/page.tsx
import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'react-toastify'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      localStorage.setItem('tu_user', JSON.stringify(data.user))
      toast.success(`Welcome back, ${data.user.name}! 👋`)
      router.push(data.user.role === 'ADMIN' ? '/admin' : '/')
    } catch (err: any) {
      toast.error('Network error. Is the server running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-center" style={{ minHeight: 'calc(100vh - 64px)', padding: '40px 16px' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '440px', padding: '48px 40px' }}>
        <div className="text-center" style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔐</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', marginBottom: '8px' }}>Welcome Back</h1>
          <p style={{ color: 'var(--clr-text-2)', fontSize: '14px' }}>Login to access your notes and dashboard</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', color: 'var(--clr-text-2)', fontSize: '13px', marginBottom: '6px' }}>Email</label>
            <input id="login-email" className="input-field" type="email" placeholder="hari@gmail.com" required
              value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <div className="flex-between" style={{ marginBottom: '6px' }}>
              <label style={{ color: 'var(--clr-text-2)', fontSize: '13px' }}>Password</label>
              <Link href="/forgot-password" style={{ color: 'var(--clr-primary-h)', fontSize: '12px' }}>Forgot Password?</Link>
            </div>
            <input id="login-password" className="input-field" type="password" placeholder="••••••••" required
              value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <button id="login-submit" type="submit" className="btn btn-primary" style={{ marginTop: '8px', justifyContent: 'center' }} disabled={loading}>
            {loading ? <><span className="spinner" /> Logging in...</> : '🚀 Login to TU Notes Hub'}
          </button>
          <p className="text-center" style={{ color: 'var(--clr-text-3)', fontSize: '13px' }}>
            New student? <Link href="/register" style={{ color: 'var(--clr-primary-h)' }}>Create free account</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
