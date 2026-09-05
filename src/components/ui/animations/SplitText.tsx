'use client'

import { motion, Variants } from 'framer-motion'

interface SplitTextProps {
  text: string
  className?: string
  delay?: number
}

export function SplitText({ text, className = '', delay = 0 }: SplitTextProps) {
  // Split text into characters
  const characters = text.split('')

  const container: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: delay },
    },
  }

  const child: Variants = {
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        damping: 12,
        stiffness: 200,
      },
    },
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.8,
    },
  }

  return (
    <motion.div
      className={`inline-block ${className}`}
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {characters.map((char, index) => (
        <motion.span
          key={index}
          variants={child}
          className="inline-block"
          style={{ whiteSpace: 'pre' }}
        >
          {char}
        </motion.span>
      ))}
    </motion.div>
  )
}
