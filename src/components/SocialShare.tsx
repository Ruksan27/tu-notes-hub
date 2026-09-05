'use client'

import { useEffect, useState } from 'react'

export default function SocialShare({ title, text, slug }: { title: string, text: string, slug: string }) {
  const [url, setUrl] = useState('')

  useEffect(() => {
    setUrl(window.location.href)
  }, [])

  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)
  const encodedText = encodeURIComponent(text)

  const fbShare = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
  const twShare = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`
  const waShare = `https://api.whatsapp.com/send?text=${encodedTitle}%0A${encodedUrl}`

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '32px', padding: '16px 0', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--clr-text-2)' }}>Share this article:</span>
      
      <a href={fbShare} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%', background: '#1877F2', color: '#fff', textDecoration: 'none', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
        f
      </a>
      
      <a href={twShare} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%', background: '#1DA1F2', color: '#fff', textDecoration: 'none', transition: 'transform 0.2s', fontWeight: 800 }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
        𝕏
      </a>

      <a href={waShare} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%', background: '#25D366', color: '#fff', textDecoration: 'none', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
        💬
      </a>
    </div>
  )
}
