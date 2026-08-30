'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingSection } from '@/components/TrendingSection'

interface SeoData {
  stats: {
    totalProjects: number
    activeProjectsCount: number
    totalViews: number
    totalOrganicViews: number
    totalSearchClicks: number
    approvedOrdersCount: number
    totalRevenue: number
    organicRatio: number
    conversionRate: number
    indexedPages: number
    averageCtr: number
    averagePosition: number
  }
  weeklyTrend: { day: string; dateStr: string; views: number; organicViews: number; sales: number }[]
  categoryStats: { category: string; count: number; views: number; organicViews: number }[]
  topProjects: {
    id: string
    title: string
    category: string
    views: number
    organicViews: number
    searchClicks: number
    sales: number
    conversionRate: number
  }[]
}

export default function AdminSeoTab() {
  const [data, setData] = useState<SeoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [activeChartTab, setActiveChartTab] = useState<'VIEWS' | 'ORGANIC' | 'SALES'>('VIEWS')
  const [hoveredTrendPoint, setHoveredTrendPoint] = useState<number | null>(null)

  const fetchSeoData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true)
      const res = await fetch('/api/admin/seo-stats')
      if (res.ok) {
        const json = await res.json()
        if (json.stats) {
          setData(json)
        }
      }
    } catch (e) {
      console.error('Error fetching SEO analytics:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSeoData()
  }, [fetchSeoData])

  // Auto-refresh interval if enabled
  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(() => {
      fetchSeoData(true)
    }, 5000)
    return () => clearInterval(interval)
  }, [autoRefresh, fetchSeoData])

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: '16px' }}>
        <div className="spinner" style={{ width: '40px', height: '40px' }} />
        <p style={{ color: 'var(--clr-text-2)', fontSize: '14px', fontWeight: 500 }}>Connecting to Database & Generating Real-time Analytics...</p>
      </div>
    )
  }

  const { stats, weeklyTrend, categoryStats, topProjects } = data || {
    stats: { totalProjects: 0, activeProjectsCount: 0, totalViews: 0, totalOrganicViews: 0, totalSearchClicks: 0, approvedOrdersCount: 0, totalRevenue: 0, organicRatio: 0, conversionRate: 0, indexedPages: 0, averageCtr: 0, averagePosition: 0 },
    weeklyTrend: [],
    categoryStats: [],
    topProjects: []
  }

  // SVG Area Chart calculations
  const chartHeight = 240
  const chartWidth = 750
  const metricKey = activeChartTab === 'VIEWS' ? 'views' : activeChartTab === 'ORGANIC' ? 'organicViews' : 'sales'
  const maxTrendValue = Math.max(...weeklyTrend.map(t => t[metricKey]), 5)
  
  const getX = (idx: number) => (idx / Math.max(weeklyTrend.length - 1, 1)) * (chartWidth - 60) + 30
  const getY = (val: number) => chartHeight - (val / maxTrendValue) * (chartHeight - 60) - 30

  const pointsString = weeklyTrend.map((t, i) => `${getX(i)},${getY(t[metricKey])}`).join(' ')
  const areaString = `30,${chartHeight - 30} ${pointsString} ${chartWidth - 30},${chartHeight - 30}`

  const chartColor = activeChartTab === 'VIEWS' ? '#6366f1' : activeChartTab === 'ORGANIC' ? '#06b6d4' : '#10b981'
  const gradId = `chartGrad_${activeChartTab}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* ── Header Banner ── */}
      <div className="glass-card" style={{ padding: '28px', borderRadius: '16px', borderLeft: '4px solid var(--clr-primary-h)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
                📈 Real-time Analytics & SEO Dashboard
              </h2>
              <span className="badge badge-strong" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                DATABASE LIVE
              </span>
            </div>
            <p style={{ color: 'var(--clr-text-2)', fontSize: '14px' }}>
              Calculated dynamically from real database records (Orders, Registrations, Project Views).
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Auto Refresh Toggle */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`btn btn-sm ${autoRefresh ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '8px' }}
            >
              {autoRefresh ? '⚡ Auto-Sync ON (5s)' : '⏸ Auto-Sync OFF'}
            </button>

            <button onClick={() => fetchSeoData()} className="btn btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🔄</span> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Metric Cards (Real DB Aggregates) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        <div className="glass-card" style={{ padding: '20px', borderRadius: '14px' }}>
          <p style={{ color: 'var(--clr-text-3)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.5px' }}>TOTAL PROJECT VIEWS</p>
          <h3 style={{ fontSize: '32px', fontWeight: 800, margin: '6px 0', color: 'var(--clr-text-1)' }}>
            {stats.totalViews.toLocaleString()}
          </h3>
          <p style={{ fontSize: '12px', color: '#06b6d4', fontWeight: 600 }}>
            🌐 {stats.totalOrganicViews.toLocaleString()} Organic ({stats.organicRatio}%)
          </p>
        </div>

        <div className="glass-card" style={{ padding: '20px', borderRadius: '14px' }}>
          <p style={{ color: 'var(--clr-text-3)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.5px' }}>SEARCH CLICKS</p>
          <h3 style={{ fontSize: '32px', fontWeight: 800, margin: '6px 0', color: '#6366f1' }}>
            {stats.totalSearchClicks.toLocaleString()}
          </h3>
          <p style={{ fontSize: '12px', color: '#818cf8', fontWeight: 600 }}>
            🎯 Avg CTR: {stats.averageCtr}%
          </p>
        </div>

        <div className="glass-card" style={{ padding: '20px', borderRadius: '14px' }}>
          <p style={{ color: 'var(--clr-text-3)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.5px' }}>APPROVED SALES</p>
          <h3 style={{ fontSize: '32px', fontWeight: 800, margin: '6px 0', color: '#10b981' }}>
            {stats.approvedOrdersCount}
          </h3>
          <p style={{ fontSize: '12px', color: '#6ee7b7', fontWeight: 600 }}>
            💰 Rs. {stats.totalRevenue.toLocaleString()} Revenue
          </p>
        </div>

        <div className="glass-card" style={{ padding: '20px', borderRadius: '14px' }}>
          <p style={{ color: 'var(--clr-text-3)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.5px' }}>CONVERSION RATE</p>
          <h3 style={{ fontSize: '32px', fontWeight: 800, margin: '6px 0', color: '#f59e0b' }}>
            {stats.conversionRate}%
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--clr-text-2)' }}>
            Sales / Total View Ratio
          </p>
        </div>

        <div className="glass-card" style={{ padding: '20px', borderRadius: '14px' }}>
          <p style={{ color: 'var(--clr-text-3)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.5px' }}>INDEXED PAGES</p>
          <h3 style={{ fontSize: '32px', fontWeight: 800, margin: '6px 0', color: '#ec4899' }}>
            {stats.indexedPages}
          </h3>
          <p style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>
            ✓ Avg Search Rank #{stats.averagePosition}
          </p>
        </div>
      </div>

      {/* ── Dynamic Graphical Chart Section (Timestamped DB Trends) ── */}
      <div className="glass-card" style={{ padding: '28px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--clr-text-1)' }}>
              📊 Graphical Traffic & Conversion Curves (Last 7 Days)
            </h3>
            <p style={{ color: 'var(--clr-text-3)', fontSize: '13px', marginTop: '2px' }}>
              Dynamic curves generated directly from real database order & view timestamps.
            </p>
          </div>

          {/* Metric Switcher Tabs */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', padding: '4px', borderRadius: '10px', border: '1px solid var(--clr-border)' }}>
            {(['VIEWS', 'ORGANIC', 'SALES'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveChartTab(tab)}
                style={{
                  padding: '6px 16px',
                  borderRadius: '7px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: activeChartTab === tab ? chartColor : 'transparent',
                  color: activeChartTab === tab ? '#fff' : 'var(--clr-text-2)',
                  transition: 'all 0.2s ease',
                }}
              >
                {tab === 'VIEWS' ? '👁 Total Views' : tab === 'ORGANIC' ? '🌐 Organic Views' : '🛒 Sales'}
              </button>
            ))}
          </div>
        </div>

        {/* SVG Interactive Dynamic Curve Chart */}
        <div style={{ width: '100%', overflowX: 'auto', position: 'relative' }}>
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', height: 'auto', minWidth: '600px' }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartColor} stopOpacity="0.45" />
                <stop offset="100%" stopColor={chartColor} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {[0.2, 0.4, 0.6, 0.8].map(ratio => (
              <line
                key={ratio}
                x1="30"
                y1={chartHeight - ratio * (chartHeight - 60) - 30}
                x2={chartWidth - 30}
                y2={chartHeight - ratio * (chartHeight - 60) - 30}
                stroke="rgba(255,255,255,0.06)"
                strokeDasharray="4 4"
              />
            ))}

            {/* Filled Area */}
            {pointsString && <polygon points={areaString} fill={`url(#${gradId})`} />}

            {/* Main Polyline */}
            {pointsString && (
              <polyline
                fill="none"
                stroke={chartColor}
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={pointsString}
              />
            )}

            {/* Data Dots & Hover Labels */}
            {weeklyTrend.map((t, i) => {
              const val = t[metricKey]
              const cx = getX(i)
              const cy = getY(val)
              const isHovered = hoveredTrendPoint === i

              return (
                <g key={i} onMouseEnter={() => setHoveredTrendPoint(i)} onMouseLeave={() => setHoveredTrendPoint(null)} style={{ cursor: 'pointer' }}>
                  {/* Vertical guide line on hover */}
                  {isHovered && (
                    <line x1={cx} y1="20" x2={cx} y2={chartHeight - 30} stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3" />
                  )}

                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? '8' : '5'}
                    fill={chartColor}
                    stroke="#0b0c18"
                    strokeWidth="2.5"
                    style={{ transition: 'all 0.15s ease' }}
                  />

                  {/* Day & Date Label */}
                  <text x={cx} y={chartHeight - 10} fill={t.day === 'Today' ? '#10b981' : 'var(--clr-text-3)'} fontSize="11" textAnchor="middle" fontWeight={t.day === 'Today' ? '800' : '600'}>
                    {t.day}
                  </text>

                  {/* Value Label above dot */}
                  <text x={cx} y={cy - 12} fill="var(--clr-text-1)" fontSize="12" textAnchor="middle" fontWeight="800">
                    {val}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      </div>

      {/* ── Category Breakdown & Traffic Acquisition ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
        {/* Category Views Breakdown Bar Chart */}
        <div className="glass-card" style={{ padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '16px' }}>
            🏷️ Real Faculty / Category Traffic Distribution
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {categoryStats.length === 0 ? (
              <p style={{ color: 'var(--clr-text-3)', fontSize: '13px' }}>No category data in database yet.</p>
            ) : (
              categoryStats.map(cat => {
                const maxCatViews = Math.max(...categoryStats.map(c => c.views), 1)
                const pct = Math.round((cat.views / maxCatViews) * 100)
                return (
                  <div key={cat.category}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 700, color: 'var(--clr-text-1)' }}>{cat.category} ({cat.count} items)</span>
                      <span style={{ color: 'var(--clr-text-2)' }}>{cat.views} views ({cat.organicViews} organic)</span>
                    </div>
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8 }}
                        style={{ height: '100%', background: 'linear-gradient(90deg, #6366f1, #06b6d4)', borderRadius: '4px' }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Traffic Channels Donut / Progress Visualizer */}
        <div className="glass-card" style={{ padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '16px' }}>
            🌐 Traffic Acquisition Channels
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600, color: '#06b6d4' }}>🔍 Organic Search (Google / Bing)</span>
                <span style={{ fontWeight: 700 }}>{stats.organicRatio}%</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${stats.organicRatio}%` }} transition={{ duration: 0.8 }} style={{ height: '100%', background: '#06b6d4', borderRadius: '4px' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600, color: '#6366f1' }}>🔗 Direct & Social Referrals</span>
                <span style={{ fontWeight: 700 }}>{(100 - stats.organicRatio).toFixed(1)}%</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${100 - stats.organicRatio}%` }} transition={{ duration: 0.8 }} style={{ height: '100%', background: '#6366f1', borderRadius: '4px' }} />
              </div>
            </div>

            <div style={{ marginTop: '12px', padding: '14px', background: 'rgba(99,102,241,0.08)', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.2)', fontSize: '13px', color: 'var(--clr-text-2)', lineHeight: 1.5 }}>
              💡 <strong>Live Insight:</strong> Currently tracking {stats.activeProjectsCount} active projects & {stats.approvedOrdersCount} approved orders in your live database.
            </div>
          </div>
        </div>
      </div>

      {/* ── Top Projects Performance Table ── */}
      <div className="glass-card" style={{ padding: '24px', borderRadius: '16px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px' }}>
          📦 Live Database Projects — Organic Traffic & Sales
        </h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--clr-text-3)', fontSize: '12px', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 10px' }}>Project Name</th>
                <th style={{ padding: '12px 10px' }}>Category</th>
                <th style={{ padding: '12px 10px' }}>Total Views</th>
                <th style={{ padding: '12px 10px' }}>Organic Views</th>
                <th style={{ padding: '12px 10px' }}>Sales</th>
                <th style={{ padding: '12px 10px' }}>Conversion Rate</th>
              </tr>
            </thead>
            <tbody>
              {topProjects.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--clr-text-3)' }}>
                    No projects found in database yet.
                  </td>
                </tr>
              ) : (
                topProjects.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '12px 10px', fontWeight: 700, color: 'var(--clr-text-1)' }}>
                      {p.title}
                    </td>
                    <td style={{ padding: '12px 10px' }}>
                      <span className="badge badge-free" style={{ fontSize: '10px' }}>{p.category}</span>
                    </td>
                    <td style={{ padding: '12px 10px', fontWeight: 600, color: 'var(--clr-text-1)' }}>{p.views}</td>
                    <td style={{ padding: '12px 10px', color: '#06b6d4', fontWeight: 700 }}>{p.organicViews}</td>
                    <td style={{ padding: '12px 10px', color: '#10b981', fontWeight: 700 }}>{p.sales}</td>
                    <td style={{ padding: '12px 10px' }}>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 800,
                        background: 'rgba(99, 102, 241, 0.15)',
                        color: '#818cf8',
                        border: '1px solid rgba(99, 102, 241, 0.3)'
                      }}>
                        {p.conversionRate}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Trending Content (Real User Analytics) ── */}
      <TrendingSection />
    </div>
  )
}
