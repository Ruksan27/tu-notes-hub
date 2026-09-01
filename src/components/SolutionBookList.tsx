'use client'

import { useState } from 'react'
import Link from 'next/link'

import { toSeoSlug } from '@/lib/utils'

interface SolutionBook {
  id: string
  title: string
  description?: string | null
  cloudinaryUrl: string
  fileSize?: string | null
  isPremium: boolean
  author?: string | null
  semester?: {
    facultyId: string
    order: number
  }
}

interface Props {
  books: SolutionBook[]
  facultyId?: string
  semesterOrder?: number
}

export default function SolutionBookList({ books, facultyId, semesterOrder }: Props) {
  const [selectedBook, setSelectedBook] = useState<SolutionBook | null>(null)

  if (!books || books.length === 0) return null

  const getBookHref = (book: SolutionBook) => {
    const fId = book.semester?.facultyId || facultyId || 'bca'
    const order = book.semester?.order || semesterOrder || 1
    const ord = order === 1 ? '1st' : order === 2 ? '2nd' : order === 3 ? '3rd' : `${order}th`
    const semSlug = `${ord.toLowerCase()}-semester`
    const slug = toSeoSlug(book.title) || book.id
    return `/faculty/${fId.toLowerCase()}/${semSlug}/solution-book/${slug}`
  }

  return (
    <div style={{ marginTop: '24px', marginBottom: '32px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>📘</span> Solution Books & Full Semester Guides ({books.length})
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {books.map((book) => (
          <div
            key={book.id}
            className="glass-card"
            style={{
              padding: '20px',
              borderRadius: '14px',
              border: '1px solid rgba(99,102,241,0.25)',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(6,182,212,0.08) 100%)',
              display: 'flex',
              flexDirection: 'column',
              justify: 'space-between',
              gap: '14px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span className="badge badge-primary" style={{ fontSize: '11px' }}>📘 SOLUTION BOOK</span>
                {book.isPremium ? (
                  <span className="badge badge-elite" style={{ fontSize: '11px' }}>⚡ ELITE / PREMIER</span>
                ) : (
                  <span className="badge badge-free" style={{ fontSize: '11px' }}>FREE</span>
                )}
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: '0 0 6px 0' }}>
                {book.title}
              </h3>
              {book.description && (
                <p style={{ color: 'var(--clr-text-2)', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
                  {book.description}
                </p>
              )}
              {book.author && (
                <div style={{ fontSize: '12px', color: 'var(--clr-text-3)', marginTop: '6px' }}>
                  Author / Credit: <strong>{book.author}</strong>
                </div>
              )}
            </div>

            <div style={{ marginTop: '4px' }}>
              <Link
                href={getBookHref(book)}
                className="btn btn-primary btn-sm"
                style={{ width: '100%', textAlign: 'center', textDecoration: 'none', fontWeight: 700, padding: '10px' }}
              >
                📖 Read Solution Book
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
