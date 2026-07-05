'use client'
// src/components/SkeletonLoader.tsx
export function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header skeleton */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
        <div className="space-y-3">
          <div className="h-3 w-28 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <div className="h-8 w-64 rounded-lg" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <div className="h-4 w-48 rounded" style={{ background: 'rgba(255,255,255,0.05)' }} />
        </div>
        <div className="h-8 w-32 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
      </div>

      {/* Stats row skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="p-6 rounded-xl border"
            style={{
              background: 'rgba(255,255,255,0.03)',
              borderColor: 'rgba(255,255,255,0.06)',
            }}
          >
            <div className="h-3 w-24 rounded mb-4" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <div className="h-9 w-16 rounded-lg" style={{ background: 'rgba(255,255,255,0.08)' }} />
          </div>
        ))}
      </div>

      {/* Subject cards skeleton */}
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl border overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.02)',
              borderColor: 'rgba(255,255,255,0.06)',
            }}
          >
            {/* Subject header */}
            <div
              className="px-6 py-4 flex items-center justify-between border-b"
              style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}
            >
              <div className="flex items-center gap-3">
                <div className="h-5 w-16 rounded-md" style={{ background: 'rgba(6,182,212,0.15)' }} />
                <div className="h-5 w-44 rounded" style={{ background: 'rgba(255,255,255,0.07)' }} />
              </div>
              <div className="h-4 w-28 rounded" style={{ background: 'rgba(255,255,255,0.05)' }} />
            </div>
            {/* Content area */}
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {[...Array(3)].map((_, j) => (
                <div
                  key={j}
                  className="h-16 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.04)', animationDelay: `${j * 0.1}s` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AdminSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-xl border"
            style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <div className="h-3 w-20 rounded mb-3" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <div className="h-8 w-12 rounded" style={{ background: 'rgba(255,255,255,0.08)' }} />
          </div>
        ))}
      </div>
      <div className="h-40 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }} />
    </div>
  )
}
