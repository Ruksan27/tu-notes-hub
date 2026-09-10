'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trophy } from 'lucide-react';

interface Contributor {
  id: string;
  name: string;
  avatarUrl: string | null;
  rewardPoints: number;
}

export default function TopContributorsWidget({ limit = 3 }: { limit?: number }) {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchTop() {
      try {
        setLoading(true);
        const res = await fetch('/api/leaderboard/top');
        const data = await res.json();
        if (data.success && Array.isArray(data.contributors) && data.contributors.length > 0) {
          setContributors(data.contributors.slice(0, limit));
        }
      } catch (err) {
        console.error('Failed to load top contributors widget:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchTop();
  }, [limit]);

  const getInitials = (name: string) => {
    if (!name) return 'ST';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getRankColor = (index: number) => {
    if (index === 0) return '#f59e0b'; // Gold
    if (index === 1) return '#94a3b8'; // Silver
    if (index === 2) return '#f97316'; // Bronze
    return '#64748b';
  };

  const formatName = (name: string) => {
    if (!name) return 'Student';
    if (name.length > 11) return `${name.substring(0, 9)}...`;
    return name;
  };

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '300px',
        marginLeft: 'auto',
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '16px',
        padding: '14px 18px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
      }}
      className="top-contributors-widget"
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Trophy style={{ width: '18px', height: '18px', color: '#f59e0b' }} />
          <h3
            style={{
              fontSize: '14.5px',
              fontWeight: 700,
              color: '#ffffff',
              margin: 0,
              fontFamily: 'var(--font-display)',
            }}
          >
            Top Contributors
          </h3>
        </div>
        <Link
          href="/leaderboard"
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: '#60a5fa',
            textDecoration: 'none',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#93c5fd')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#60a5fa')}
        >
          View all →
        </Link>
      </div>

      {/* Contributors List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {loading ? (
          [1, 2, 3].map((n) => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '14px', height: '14px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }} />
              <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
              <div style={{ width: '80px', height: '14px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }} />
              <div style={{ width: '50px', height: '14px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginLeft: 'auto' }} />
            </div>
          ))
        ) : contributors.length === 0 ? (
          <div style={{ fontSize: '13px', color: 'var(--clr-text-3)', textAlign: 'center', padding: '10px 0' }}>
            No contributors yet. Upload notes to rank #1!
          </div>
        ) : (
          contributors.slice(0, limit).map((user, idx) => {
            const rankColor = getRankColor(idx);
            const initials = getInitials(user.name);

            return (
              <div
                key={user.id || idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                }}
              >
                {/* Rank Number */}
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 800,
                    color: rankColor,
                    width: '14px',
                    textAlign: 'center',
                    flexShrink: 0,
                  }}
                >
                  {idx + 1}
                </span>

                {/* Avatar Wrapper with Crown for Rank #1 */}
                <div style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
                  {idx === 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-10px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: '13px',
                        lineHeight: 1,
                        zIndex: 10,
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))',
                        userSelect: 'none',
                        pointerEvents: 'none',
                      }}
                    >
                      👑
                    </span>
                  )}

                  {/* Avatar Photo OR First+Last Initials Circle */}
                  {user.avatarUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={user.avatarUrl}
                      alt={user.name || 'User avatar'}
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: `2px solid ${rankColor}`,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                        border: `2px solid ${rankColor}`,
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: '12.5px',
                        letterSpacing: '0.5px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                      }}
                    >
                      {initials}
                    </div>
                  )}
                </div>

                {/* Name */}
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#f1f5f9',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '120px',
                  }}
                  title={user.name}
                >
                  {formatName(user.name)}
                </span>

                {/* Points */}
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#facc15', // Yellow/Gold
                    whiteSpace: 'nowrap',
                  }}
                >
                  {user.rewardPoints.toLocaleString()} pts
                </span>
              </div>
            );
          }))}
      </div>
    </div>
  );
}
