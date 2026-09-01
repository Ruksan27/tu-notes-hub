'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const messages = [
  'one moment',
  'initializing viewer',
  'fetching document assets',
  'optimizing page stream',
  'almost ready',
]

interface DocLoadingProgressProps {
  speed?: 'slow' | 'medium' | 'fast'
  onComplete?: () => void
}

export default function DocLoadingProgress({
  speed = 'medium',
  onComplete,
}: DocLoadingProgressProps) {
  const [progress, setProgress] = useState(0)
  const [messageIndex, setMessageIndex] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)

  const config = useMemo(
    () =>
      ({
        slow: { divisor: 40, minDelay: 150, maxJitter: 250 },
        medium: { divisor: 20, minDelay: 80, maxJitter: 120 },
        fast: { divisor: 10, minDelay: 30, maxJitter: 60 },
      })[speed],
    [speed]
  )

  useEffect(() => {
    if (isCompleted) return

    let timer: NodeJS.Timeout

    const updateProgress = () => {
      setProgress((prev) => {
        if (prev >= 100) {
          setIsCompleted(true)
          if (onComplete) setTimeout(onComplete, 300)
          return 100
        }

        const remaining = 100 - prev
        const increment = Math.random() * (remaining / config.divisor) + 2.5
        return Math.min(prev + increment, 100)
      })

      const delay = Math.random() * config.maxJitter + config.minDelay
      timer = setTimeout(updateProgress, delay)
    }

    timer = setTimeout(updateProgress, 100)

    return () => clearTimeout(timer)
  }, [isCompleted, config, onComplete])

  useEffect(() => {
    if (isCompleted) return

    const messageTimer = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length)
    }, 550)

    return () => clearInterval(messageTimer)
  }, [isCompleted])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        minHeight: '700px',
        background: '#090d16',
        color: '#fff',
        gap: '20px',
        padding: '32px',
        borderRadius: '12px',
      }}
    >
      <div style={{ position: 'relative', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
        <AnimatePresence mode="wait">
          <motion.p
            key={isCompleted ? 'completed' : messageIndex}
            initial={{ opacity: 0, scale: 1.2, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 5 }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 20,
            }}
            style={{
              fontSize: '22px',
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: isCompleted ? '#38bdf8' : '#94a3b8',
              textTransform: 'lowercase',
              margin: 0,
            }}
          >
            {isCompleted ? 'complete' : messages[messageIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      <div style={{ width: '100%', maxWidth: '340px', position: 'relative', padding: '0 8px' }}>
        <div style={{ height: '8px', width: '100%', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden', position: 'relative' }}>
          <div
            style={{
              height: '100%',
              borderRadius: '999px',
              background: 'linear-gradient(90deg, #6366f1, #06b6d4)',
              width: `${progress}%`,
              transition: 'width 0.2s ease-out',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {!isCompleted && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
                  animation: 'shimmer 1.5s infinite',
                }}
              />
            )}
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: '-2px',
            left: 0,
            height: '4px',
            background: '#38bdf8',
            filter: 'blur(6px)',
            transition: 'all 0.5s ease',
            opacity: isCompleted ? 0 : 0.6,
            width: `${progress}%`,
          }}
        />
      </div>

      <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  )
}
