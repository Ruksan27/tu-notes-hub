'use client';

import React, { useEffect, useState, useRef } from 'react';

interface AnimatedCounterProps {
  value: string;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function AnimatedCounter({
  value,
  duration = 1400,
  className,
  style,
}: AnimatedCounterProps) {
  const [displayCount, setDisplayCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const elementRef = useRef<HTMLSpanElement>(null);

  // Extract numeric part and any string suffix (e.g. "6+" -> 6 and "+")
  const match = value.match(/(\d+)/);
  const targetNumber = match ? parseInt(match[0], 10) : 0;
  const suffix = value.replace(/\d+/g, '');

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);

          let startTimestamp: number | null = null;
          const animateStep = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            
            // Ease out cubic function for smooth deceleration
            const easeOutProgress = 1 - Math.pow(1 - progress, 3);
            setDisplayCount(Math.floor(easeOutProgress * targetNumber));

            if (progress < 1) {
              window.requestAnimationFrame(animateStep);
            } else {
              setDisplayCount(targetNumber);
            }
          };

          window.requestAnimationFrame(animateStep);
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, [targetNumber, duration, hasAnimated]);

  return (
    <span ref={elementRef} className={className} style={style}>
      {displayCount}
      {suffix}
    </span>
  );
}
