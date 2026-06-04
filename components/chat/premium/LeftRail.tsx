"use client";

import React from "react";

interface LeftRailProps {
  isExpanded?: boolean;
  onToggle?: () => void;
  items?: Array<{
    id: string;
    label: string;
    icon: React.ReactNode;
    isActive?: boolean;
    onClick?: () => void;
  }>;
  userAvatar?: string;
  onProfile?: () => void;
  onSettings?: () => void;
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
    <aside
      className={`flex flex-col border-r border-border/70 bg-card/95 shadow-sm backdrop-blur-xl transition-all duration-300 ${
        isExpanded ? "w-[220px]" : "w-[72px]"
      }`}
      aria-label="Chat navigation"
    >
      <div className="flex h-16 items-center justify-center border-b border-border/70 px-2">
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-center justify-center rounded-xl p-2 text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          title="Toggle sidebar"
          aria-label="Toggle chat sidebar"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={item.onClick}
            className={`flex w-full items-center gap-3 rounded-xl p-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              item.isActive
                ? "border border-primary/30 bg-primary/10 text-primary shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            title={item.label}
            aria-pressed={item.isActive}
          >
            <div className="h-5 w-5 flex-shrink-0">{item.icon}</div>
            {isExpanded && (
              <span className="truncate text-sm font-medium">{item.label}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="space-y-1 border-t border-border/70 p-2">
        {onSettings && (
          <button
            type="button"
            onClick={onSettings}
            className="flex w-full items-center gap-3 rounded-xl p-3 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            title="Settings"
          >
            <svg
              className="h-5 w-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
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
            type="button"
            onClick={onProfile}
            className="flex w-full items-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            title="Profile"
          >
            {userAvatar ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-cyan-500 text-xs font-semibold text-primary-foreground">
                {userAvatar.startsWith("http") ? (
                  <img
                    src={userAvatar}
                    alt="Profile"
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  userAvatar[0]
                )}
              </div>
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                U
              </div>
            )}
            {isExpanded && (
              <span className="text-sm text-muted-foreground">Profile</span>
            )}
          </button>
        )}
      </div>
    </aside>
  );
}
