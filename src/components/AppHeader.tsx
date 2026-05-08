/**
 * AppHeader component for DuoCare.
 * Warm orange gradient header with app name and settings button.
 */

import { Settings } from 'lucide-react'

interface AppHeaderProps {
  subtitle?: string
  onSettingsClick?: () => void
}

export default function AppHeader({ subtitle, onSettingsClick }: AppHeaderProps) {
  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between px-4 py-3"
      style={{
        background: 'linear-gradient(135deg, #D97756 0%, #B85C38 100%)',
      }}
    >
      <div className="flex flex-col">
        <h1 className="text-xl font-bold text-white tracking-tight">
          DuoCare
        </h1>
        {subtitle && (
          <p className="text-xs text-white/70">{subtitle}</p>
        )}
      </div>

      {onSettingsClick && (
        <button
          onClick={onSettingsClick}
          className="flex items-center justify-center w-11 h-11 rounded-full active:bg-white/20 transition-colors"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5 text-white" />
        </button>
      )}
    </header>
  )
}
