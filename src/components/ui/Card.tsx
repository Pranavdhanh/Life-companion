import React from 'react'
import { cn } from './Button'

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn("bg-white rounded-2xl shadow-sm border border-gray-100 p-6", className)} 
      {...props} 
    />
  )
}
