import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { Trophy, Award, UploadCloud, Users, Gift, Star, ArrowLeft } from 'lucide-react'

export const revalidate = 300 // Update leaderboard every 5 mins instead of every request

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

  const getInitials = (name: string) => {
    if (!name) return 'ST'
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const top3 = topContributors.slice(0, 3)
  const remaining = topContributors.slice(3)

  // Reorder top 3 into Olympic Podium order: [Rank 2 (Silver), Rank 1 (Gold), Rank 3 (Bronze)]
  let podiumOrder: Array<{ user: typeof topContributors[0]; rank: number }> = []
  if (top3.length === 3) {
    podiumOrder = [
      { user: top3[1], rank: 2 },
      { user: top3[0], rank: 1 },
      { user: top3[2], rank: 3 },
    ]
  } else if (top3.length === 2) {
    podiumOrder = [
      { user: top3[1], rank: 2 },
      { user: top3[0], rank: 1 },
    ]
  } else if (top3.length === 1) {
    podiumOrder = [
      { user: top3[0], rank: 1 },
    ]
  }

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
            gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
            gap: '24px',
            alignItems: 'end',
            marginBottom: '56px',
            marginTop: '20px',
          }}
        >
          {podiumOrder.map(({ user, rank }) => {
            const isRank1 = rank === 1
            const isRank2 = rank === 2

            const initials = getInitials(user.name)

            const badgeTitle = isRank1 ? '🥇 #1 Champion' : isRank2 ? '🥈 #2 Runner-Up' : '🥉 #3 Contributor'
            const badgeBg = isRank1
              ? 'linear-gradient(135deg, #f59e0b, #d97706)'
              : isRank2
              ? 'linear-gradient(135deg, #94a3b8, #64748b)'
              : 'linear-gradient(135deg, #f97316, #c2410c)'

            const borderColor = isRank1
              ? 'rgba(245, 158, 11, 0.6)'
              : isRank2
              ? 'rgba(148, 163, 184, 0.4)'
              : 'rgba(249, 115, 22, 0.4)'

            const cardBg = isRank1
              ? 'linear-gradient(180deg, rgba(245, 158, 11, 0.16) 0%, rgba(15, 23, 42, 0.95) 100%)'
              : isRank2
              ? 'linear-gradient(180deg, rgba(148, 163, 184, 0.1) 0%, rgba(15, 23, 42, 0.9) 100%)'
              : 'linear-gradient(180deg, rgba(249, 115, 22, 0.1) 0%, rgba(15, 23, 42, 0.9) 100%)'

            const glowShadow = isRank1
              ? '0 20px 50px rgba(245, 158, 11, 0.25), 0 0 0 1.5px rgba(245, 158, 11, 0.5)'
              : isRank2
              ? '0 12px 32px rgba(148, 163, 184, 0.15), 0 0 0 1px rgba(148, 163, 184, 0.3)'
              : '0 12px 32px rgba(249, 115, 22, 0.15), 0 0 0 1px rgba(249, 115, 22, 0.3)'

            const avatarSize = isRank1 ? '84px' : '72px'
            const avatarBorderColor = isRank1 ? '#f59e0b' : isRank2 ? '#94a3b8' : '#f97316'
            const initialsBg = isRank1
              ? 'linear-gradient(135deg, #b45309 0%, #f59e0b 100%)'
              : isRank2
              ? 'linear-gradient(135deg, #334155 0%, #64748b 100%)'
              : 'linear-gradient(135deg, #7c2d12 0%, #ea580c 100%)'

            return (
              <div
                key={user.id}
                className="glass-card hover-lift"
                style={{
                  padding: isRank1 ? '38px 24px 30px' : '28px 20px',
                  borderRadius: '24px',
                  border: `1.5px solid ${borderColor}`,
                  position: 'relative',
                  overflow: 'hidden',
                  textAlign: 'center',
                  background: cardBg,
                  boxShadow: glowShadow,
                  transform: isRank1 ? 'translateY(-14px)' : 'none',
                  zIndex: isRank1 ? 2 : 1,
                }}
              >
                {/* Glow & Animated Background for Rank 1 */}
                {isRank1 && (
                  <>
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'radial-gradient(circle at 50% 0%, rgba(245,158,11,0.22) 0%, transparent 75%)',
                        pointerEvents: 'none',
                        zIndex: 0,
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        opacity: 0.35, // Increased opacity so it is clearly visible
                        pointerEvents: 'none',
                        zIndex: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mixBlendMode: 'screen', // makes it blend nicely with the dark background
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src="/Successful%20target.svg" 
                        alt="Champion Background" 
                        style={{ 
                          width: '140%', 
                          height: '140%', 
                          objectFit: 'cover',
                          transform: 'translateY(5px)'
                        }} 
                      />
                    </div>
                  </>
                )}

                {/* Rank Badge Header */}
                <div
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    padding: '4px 12px',
                    borderRadius: '999px',
                    background: badgeBg,
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: isRank1 ? '13px' : '12px',
                    boxShadow: `0 4px 14px ${avatarBorderColor}55`,
                    letterSpacing: '0.3px',
                    zIndex: 10, // Bring to front
                  }}
                >
                  {badgeTitle}
                </div>

                {/* Avatar with Crown for #1 */}
                <div style={{ marginBottom: '16px', marginTop: isRank1 ? '8px' : '12px', position: 'relative', display: 'inline-block', zIndex: 10 }}>
                  {isRank1 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-16px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: '28px',
                        lineHeight: 1,
                        zIndex: 10,
                        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.8))',
                        userSelect: 'none',
                      }}
                    >
                      👑
                    </span>
                  )}

                  {user.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt={user.name}
                      width={84}
                      height={84}
                      style={{
                        width: avatarSize,
                        height: avatarSize,
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: `3px solid ${avatarBorderColor}`,
                        boxShadow: `0 0 20px ${avatarBorderColor}66`,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: avatarSize,
                        height: avatarSize,
                        borderRadius: '50%',
                        background: initialsBg,
                        border: `3px solid ${avatarBorderColor}`,
                        color: '#ffffff',
                        fontWeight: 900,
                        fontSize: isRank1 ? '30px' : '25px',
                        letterSpacing: '1px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: `0 0 20px ${avatarBorderColor}66`,
                      }}
                    >
                      {initials}
                    </div>
                  )}
                </div>

                {/* Name */}
                <h3
                  style={{
                    position: 'relative',
                    zIndex: 10,
                    fontSize: isRank1 ? '20px' : '17px',
                    fontWeight: 900,
                    color: '#ffffff',
                    margin: '0 0 4px 0',
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  {user.name}
                </h3>

                {/* College / Campus */}
                <p
                  style={{
                    position: 'relative',
                    zIndex: 10,
                    fontSize: '12.5px',
                    color: isRank1 ? '#fde68a' : 'var(--clr-text-3)',
                    margin: '0 0 18px 0',
                    fontWeight: 500,
                  }}
                >
                  {user.college || 'TU Student'}
                </p>

                {/* Points Pill */}
                <div
                  style={{
                    position: 'relative',
                    zIndex: 10,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: isRank1 ? '8px 20px' : '6px 16px',
                    borderRadius: '999px',
                    background: isRank1 ? 'rgba(250, 204, 21, 0.2)' : isRank2 ? 'rgba(148, 163, 184, 0.15)' : 'rgba(249, 115, 22, 0.15)',
                    border: `1.5px solid ${borderColor}`,
                    color: isRank1 ? '#fef08a' : isRank2 ? '#e2e8f0' : '#ffedd5',
                    fontWeight: 900,
                    fontSize: isRank1 ? '15px' : '14px',
                    boxShadow: isRank1 ? '0 4px 14px rgba(245,158,11,0.25)' : 'none',
                  }}
                >
                  <Star style={{ width: '15px', height: '15px', fill: isRank1 ? '#facc15' : isRank2 ? '#cbd5e1' : '#fb923c', color: 'transparent' }} />
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
                        <Image src={user.avatarUrl} alt={user.name} width={34} height={34} style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)', color: '#ffffff', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', border: `1.5px solid ${idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : idx === 2 ? '#f97316' : 'rgba(255,255,255,0.1)'}` }}>
                          {getInitials(user.name)}
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
