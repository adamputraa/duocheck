/**
 * AppHeader component for DuoCare.
 * Modern solid header with clean typography.
 */

import { Settings } from 'lucide-react'

interface AppHeaderProps {
  subtitle?: string
  onSettingsClick?: () => void
}

export default function AppHeader({ subtitle, onSettingsClick }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-50 px-4 py-3 pristine-header">
      <div className="mx-auto max-w-lg flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-xl font-extrabold text-primary tracking-tight">
            DuoCare
          </h1>
          {subtitle && (
            <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider">{subtitle}</p>
          )}
        </div>

        {onSettingsClick && (
          <button
            onClick={onSettingsClick}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-50 active:bg-gray-100 transition-all tap-effect"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5 text-text-dark" />
          </button>
        )}
      </div>
    </header>
  )
}


