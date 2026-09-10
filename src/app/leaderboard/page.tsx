import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Trophy, Award, UploadCloud, Users, Gift, Star, ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Top Student Contributors & Leaderboard | TU Notes Hub',
  description: 'See top student contributors on TU Notes Hub. Earn reward points by sharing study notes, past question papers, and referring friends.',
}

export default async function LeaderboardPage() {
  let topContributors: Array<{
    id: string
    name: string
    avatarUrl: string | null
    rewardPoints: number
    college: string | null
    facultyName?: string
  }> = []

  try {
    const users = await prisma.user.findMany({
      orderBy: [
        { rewardPoints: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 10,
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        rewardPoints: true,
        college: true,
      },
    })
    topContributors = users
  } catch (error) {
    console.error('Failed to load leaderboard users:', error)
  }

  const top3 = topContributors.slice(0, 3)
  const remaining = topContributors.slice(3)

  return (
    <div style={{ minHeight: '100vh', padding: '60px 20px 100px', background: 'var(--clr-bg)' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Back Link */}
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--clr-text-2)',
            textDecoration: 'none',
            fontSize: '14px',
            marginBottom: '24px',
            fontWeight: 500,
          }}
        >
          <ArrowLeft style={{ width: '16px', height: '16px' }} />
          <span>Back to Home</span>
        </Link>

        {/* Page Title Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '999px',
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: '#f59e0b',
              fontSize: '13px',
              fontWeight: 700,
              marginBottom: '16px',
            }}
          >
            <Trophy style={{ width: '15px', height: '15px' }} />
            <span>Community Wall of Fame</span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(28px, 4vw, 44px)',
              fontWeight: 900,
              fontFamily: 'var(--font-display)',
              marginBottom: '12px',
              color: '#ffffff',
            }}
          >
            Top 10 Student <span className="text-gradient">Contributors</span>
          </h1>

          <p
            style={{
              color: 'var(--clr-text-2)',
              fontSize: 'clamp(14px, 2vw, 16px)',
              maxWidth: '620px',
              margin: '0 auto',
              lineHeight: 1.6,
            }}
          >
            Earn reward points by sharing handwritten notes, past question papers, and inviting friends. Redeem points for free Semester & Elite AI passes!
          </p>
        </div>

        {/* Podium / Top 3 Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '20px',
            marginBottom: '48px',
          }}
        >
          {top3.map((user, index) => {
            const isFirst = index === 0
            const isSecond = index === 1
            const isThird = index === 2

            const badgeColor = isFirst ? '#f59e0b' : isSecond ? '#94a3b8' : '#f97316'
            const borderColor = isFirst
              ? 'rgba(245, 158, 11, 0.4)'
              : isSecond
              ? 'rgba(148, 163, 184, 0.3)'
              : 'rgba(249, 115, 22, 0.3)'

            const bgGlow = isFirst
              ? 'radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)'
              : 'none'

            return (
              <div
                key={user.id}
                className="glass-card hover-lift"
                style={{
                  padding: '28px 24px',
                  borderRadius: '20px',
                  border: `1px solid ${borderColor}`,
                  position: 'relative',
                  overflow: 'hidden',
                  textAlign: 'center',
                  background: 'rgba(15, 23, 42, 0.7)',
                }}
              >
                {/* Glow for 1st place */}
                {isFirst && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: bgGlow,
                      pointerEvents: 'none',
                    }}
                  />
                )}

                {/* Rank Badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: badgeColor,
                    color: '#0f172a',
                    fontWeight: 900,
                    fontSize: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 4px 12px ${badgeColor}66`,
                  }}
                >
                  #{index + 1}
                </div>

                {/* Avatar */}
                <div style={{ marginBottom: '16px', position: 'relative', display: 'inline-block' }}>
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: `3px solid ${badgeColor}`,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                        border: `3px solid ${badgeColor}`,
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {user.name ? user.name[0].toUpperCase() : 'U'}
                    </div>
                  )}

                  {isFirst && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-12px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: '22px',
                      }}
                    >
                      👑
                    </span>
                  )}
                </div>

                {/* Name */}
                <h3
                  style={{
                    fontSize: '18px',
                    fontWeight: 800,
                    color: '#ffffff',
                    margin: '0 0 4px 0',
                  }}
                >
                  {user.name}
                </h3>

                {/* College / Info */}
                <p
                  style={{
                    fontSize: '12.5px',
                    color: 'var(--clr-text-3)',
                    margin: '0 0 16px 0',
                  }}
                >
                  {user.college || 'TU Student'}
                </p>

                {/* Points Pill */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 16px',
                    borderRadius: '999px',
                    background: 'rgba(250, 204, 21, 0.12)',
                    border: '1px solid rgba(250, 204, 21, 0.3)',
                    color: '#facc15',
                    fontWeight: 800,
                    fontSize: '15px',
                  }}
                >
                  <Star style={{ width: '15px', height: '15px', fill: '#facc15' }} />
                  <span>{user.rewardPoints.toLocaleString()} Points</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Full Contributors Table */}
        <div
          className="glass-card"
          style={{
            padding: '24px',
            borderRadius: '20px',
            marginBottom: '48px',
            overflowX: 'auto',
          }}
        >
          <h2
            style={{
              fontSize: '20px',
              fontWeight: 800,
              color: '#ffffff',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <Award style={{ width: '22px', height: '22px', color: '#60a5fa' }} />
            <span>Full Rankings</span>
          </h2>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--clr-text-3)', fontSize: '13px' }}>
                <th style={{ padding: '12px 16px', width: '80px' }}>Rank</th>
                <th style={{ padding: '12px 16px' }}>Student Contributor</th>
                <th style={{ padding: '12px 16px' }}>Campus / College</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Total Points</th>
              </tr>
            </thead>
            <tbody>
              {topContributors.map((user, idx) => (
                <tr
                  key={user.id}
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    transition: 'background 0.2s',
                  }}
                >
                  <td style={{ padding: '14px 16px', fontWeight: 800, color: idx < 3 ? '#f59e0b' : 'var(--clr-text-2)' }}>
                    #{idx + 1}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#1e3a8a', color: '#93c5fd', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>
                          {user.name ? user.name[0].toUpperCase() : 'U'}
                        </div>
                      )}
                      <span style={{ fontWeight: 600, color: '#ffffff' }}>{user.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--clr-text-2)', fontSize: '13.5px' }}>
                    {user.college || 'Tribhuvan University'}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 800, color: '#facc15' }}>
                    {user.rewardPoints.toLocaleString()} pts
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* How to Earn Points Section */}
        <div style={{ padding: '36px', borderRadius: '24px', background: 'linear-gradient(135deg, #0d213f 0%, #0b1a32 100%)', border: '1px solid rgba(56,189,248,0.2)' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>
              How You Can Earn <span className="text-gradient">Points & Rewards</span>
            </h2>
            <p style={{ color: 'var(--clr-text-2)', fontSize: '14px' }}>
              Contribute to the TU student community and unlock premium perks automatically!
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            <div className="glass-card" style={{ padding: '20px', borderRadius: '16px' }}>
              <UploadCloud style={{ width: '28px', height: '28px', color: '#67e8f9', marginBottom: '12px' }} />
              <h3 style={{ fontSize: '16px', color: '#fff', marginBottom: '6px', fontWeight: 700 }}>Upload Notes</h3>
              <p style={{ fontSize: '13px', color: 'var(--clr-text-2)', margin: 0 }}>
                Earn <strong style={{ color: '#facc15' }}>+50 points</strong> for every approved note or study guide you upload.
              </p>
            </div>

            <div className="glass-card" style={{ padding: '20px', borderRadius: '16px' }}>
              <Users style={{ width: '28px', height: '28px', color: '#a5b4fc', marginBottom: '12px' }} />
              <h3 style={{ fontSize: '16px', color: '#fff', marginBottom: '6px', fontWeight: 700 }}>Refer Classmates</h3>
              <p style={{ fontSize: '13px', color: 'var(--clr-text-2)', margin: 0 }}>
                Unlock <strong style={{ color: '#facc15' }}>Free Semester & Elite AI passes</strong> by referring 5 or 8 friends.
              </p>
            </div>

            <div className="glass-card" style={{ padding: '20px', borderRadius: '16px' }}>
              <Gift style={{ width: '28px', height: '28px', color: '#c4b5fd', marginBottom: '12px' }} />
              <h3 style={{ fontSize: '16px', color: '#fff', marginBottom: '6px', fontWeight: 700 }}>Redeem Passes</h3>
              <p style={{ fontSize: '13px', color: 'var(--clr-text-2)', margin: 0 }}>
                Redeem your points for <strong>Free Semester Pass</strong> or <strong>Elite AI access</strong>.
              </p>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <Link href="/dashboard/notes/upload" className="btn btn-primary btn-lg" style={{ borderRadius: '999px', padding: '12px 32px' }}>
              📤 Upload Notes & Start Earning
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
