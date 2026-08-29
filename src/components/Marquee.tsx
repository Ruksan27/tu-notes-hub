'use client'

import { useEffect, useRef, useState, ReactNode } from 'react'

interface MarqueeProps {
  children: ReactNode
  direction?: 'left' | 'right'
  speed?: 'fast' | 'normal' | 'slow'
  pauseOnHover?: boolean
  className?: string
}

export function Marquee({
  children,
  direction = 'left',
  speed = 'normal',
  pauseOnHover = true,
  className = '',
}: MarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)

  const [start, setStart] = useState(false)

  useEffect(() => {
    addAnimation()
  }, [])

  function addAnimation() {
    if (containerRef.current && scrollerRef.current) {
      const scrollerContent = Array.from(scrollerRef.current.children)
      
      // Clone children for infinite scroll
      scrollerContent.forEach((item) => {
        const duplicatedItem = item.cloneNode(true)
        scrollerRef.current?.appendChild(duplicatedItem)
      })

      getDirection()
      getSpeed()
      setStart(true)
    }
  }

  const getDirection = () => {
    if (containerRef.current) {
      containerRef.current.style.setProperty(
        '--animation-direction',
        direction === 'left' ? 'forwards' : 'reverse'
      )
    }
  }

  const getSpeed = () => {
    if (containerRef.current) {
      let duration = '40s'
      if (speed === 'fast') duration = '20s'
      if (speed === 'slow') duration = '60s'
      containerRef.current.style.setProperty('--animation-duration', duration)
    }
  }

  return (
    <div
      ref={containerRef}
      className={`marquee-container ${className}`}
      style={{
        position: 'relative',
        zIndex: 10,
        overflow: 'hidden',
        maskImage: 'linear-gradient(to right, transparent, white 10%, white 90%, transparent)',
        WebkitMaskImage: 'linear-gradient(to right, transparent, white 10%, white 90%, transparent)',
      }}
    >
      <div
        ref={scrollerRef}
        className={`marquee-scroller ${start ? 'animate-marquee' : ''} ${pauseOnHover ? 'hover:pause-animation' : ''}`}
        style={{
          display: 'flex',
          minWidth: '100%',
          gap: '24px',
          width: 'max-content',
        }}
      >
        {children}
      </div>

      <style>{`
        .animate-marquee {
          animation: marquee var(--animation-duration, 40s) linear infinite;
          animation-direction: var(--animation-direction, forwards);
        }
        .hover\\:pause-animation:hover {
          animation-play-state: paused;
        }
        @keyframes marquee {
          to {
            transform: translate(calc(-50% - 12px));
          }
        }
      `}</style>
    </div>
  )
}
