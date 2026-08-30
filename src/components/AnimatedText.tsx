'use client'

import { motion } from 'motion/react'

interface AnimatedTextProps {
  text: string
  className?: string
  delay?: number
}

export function AnimatedText({ text, className = "", delay = 0 }: AnimatedTextProps) {
  // Split text into words then letters to preserve word breaking
  const words = text.split(" ")

  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: delay || 0.2 * i },
    }),
  }

  const child = {
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
    hidden: {
      opacity: 0,
      y: 20,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
  }

  return (
    <motion.span
      style={{ display: "inline-block", overflow: "hidden" }}
      variants={container}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {words.map((word, index) => (
        <span key={index} style={{ display: "inline-block", whiteSpace: "nowrap" }}>
          {Array.from(word).map((letter, letterIdx) => (
            <motion.span
              key={letterIdx}
              variants={child as any}
              style={{ display: "inline-block" }}
            >
              {letter}
            </motion.span>
          ))}
          {/* Add space after each word except the last one */}
          {index < words.length - 1 && (
            <span style={{ display: "inline-block" }}>&nbsp;</span>
          )}
        </span>
      ))}
    </motion.span>
  )
}
