'use client'

import React from 'react'

interface ShinyTextProps {
  text: string
  className?: string
  disabled?: boolean
}

export function ShinyText({ text, className = '', disabled = false }: ShinyTextProps) {
  if (disabled) {
    return <span className={className}>{text}</span>
  }

  return (
    <span
      className={`inline-block bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-400 to-gray-900 bg-[length:200%_auto] animate-shiny ${className}`}
      style={{
        animation: 'shiny 3s linear infinite',
      }}
    >
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shiny {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}} />
      {text}
    </span>
  )
}
