import React from 'react'
import { Badge } from './ui/Badge'

export function DifficultyBadge({ level }: { level: number }) {
  let color: 'success' | 'warning' | 'danger' | 'default' = 'default'
  let label = `Level ${level}`

  if (level <= 2) color = 'success'
  else if (level === 3) color = 'warning'
  else color = 'danger'

  return <Badge variant={color} className="text-sm px-3 py-1">{label}</Badge>
}
