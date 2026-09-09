'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface TrendingTag {
  id: string
  tag: string
  label: string
  category: string
  volume: string
  isHot: boolean
  targetKeyword: string
}

export default function TrendingTagsBar() {
  const [tags, setTags] = useState<TrendingTag[]>([])
  const router = useRouter()

  useEffect(() => {
    fetch('/api/admin/seo-intelligence?action=trending_tags')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.tags && data.tags.length > 0) {
          setTags(data.tags)
        }
      })
      .catch(() => { })
  }, [])

  const handleTagClick = (tag: TrendingTag) => {
    if (tag.category === 'Project') {
      router.push(`/projects?q=${encodeURIComponent(tag.targetKeyword)}`)
    } else {
      router.push(`/faculties?q=${encodeURIComponent(tag.targetKeyword)}`)
    }
  }

  if (tags.length === 0) return null

  return (
    <div style={{
      maxWidth: '1280px',
      margin: '0 auto 24px auto',
      padding: '0 24px',
    }}>
      <div style={{
        background: 'rgba(15, 23, 42, 0.65)',
        border: '1px solid rgba(6, 182, 212, 0.25)',
        backdropFilter: 'blur(16px)',
        borderRadius: '14px',
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        overflowX: 'auto',
        boxShadow: '0 4px 20px rgba(6, 182, 212, 0.08)',
      }}>
        {/* LABEL */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          whiteSpace: 'nowrap',
          fontSize: '12px',
          fontWeight: 800,
          color: '#67e8f9',
          background: 'rgba(6, 182, 212, 0.12)',
          padding: '6px 12px',
          borderRadius: '8px',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: '14px' }}>🔥</span> Popular Searches Right Now in TU:
        </div>

        {/* TAG CHIPS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {tags.map((t) => (
            <button
              key={t.id}
              onClick={() => handleTagClick(t)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#e2e8f0',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.5)'
                e.currentTarget.style.background = 'rgba(6, 182, 212, 0.12)'
                e.currentTarget.style.color = '#fff'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'
                e.currentTarget.style.color = '#e2e8f0'
              }}
            >
              <span style={{ color: '#06b6d4', fontWeight: 700 }}>{t.tag}</span>
              <span style={{ fontSize: '10px', color: 'var(--clr-text-3)' }}>({t.volume})</span>
              {t.isHot && (
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
