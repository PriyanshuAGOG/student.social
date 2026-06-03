'use client'

import React, { useState } from 'react'

interface LeftRailProps {
  isExpanded?: boolean
  onToggle?: () => void
  items?: Array<{
    id: string
    label: string
    icon: React.ReactNode
    isActive?: boolean
    onClick?: () => void
  }>
  userAvatar?: string
  onProfile?: () => void
  onSettings?: () => void
}

export function LeftRail({
  isExpanded = false,
  onToggle,
  items = [],
  userAvatar,
  onProfile,
  onSettings,
}: LeftRailProps) {
  return (
    <div
      className={`bg-black border-r border-white/5 backdrop-blur-xl flex flex-col transition-all duration-300 ${
        isExpanded ? 'w-[220px]' : 'w-[72px]'
      }`}
    >
      {/* Logo / Toggle */}
      <div className="h-16 flex items-center justify-center px-2 border-b border-white/5">
        <button
          onClick={onToggle}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors w-full flex items-center justify-center"
          title="Toggle sidebar"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={item.onClick}
            className={`w-full p-3 rounded-lg transition-colors flex items-center gap-3 ${
              item.isActive
                ? 'bg-white/10 border border-white/20 text-white'
                : 'hover:bg-white/5 text-slate-400 hover:text-white'
            }`}
            title={item.label}
          >
            <div className="flex-shrink-0 w-5 h-5">{item.icon}</div>
            {isExpanded && <span className="text-sm font-medium truncate">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-white/5 p-2 space-y-1">
        {onSettings && (
          <button
            onClick={onSettings}
            className="w-full p-3 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-3 text-slate-400 hover:text-white"
            title="Settings"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            {isExpanded && <span className="text-sm">Settings</span>}
          </button>
        )}

        {onProfile && (
          <button
            onClick={onProfile}
            className="w-full p-2 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-3"
            title="Profile"
          >
            {userAvatar ? (
              <img
                src={userAvatar}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-xs font-semibold text-white">
                U
              </div>
            )}
            {isExpanded && <span className="text-sm text-slate-400">Profile</span>}
          </button>
        )}
      </div>
    </div>
  )
}
