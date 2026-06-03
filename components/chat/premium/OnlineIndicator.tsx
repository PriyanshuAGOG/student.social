'use client'

import React from 'react'

interface OnlineIndicatorProps {
  isOnline?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function OnlineIndicator({ isOnline = false, size = 'md', className = '' }: OnlineIndicatorProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  }

  if (!isOnline) return null

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-green-500 border-2 border-black animate-pulse ${className}`}
    />
  )
}
