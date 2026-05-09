/**
 * AppHeader component for DuoCare.
 * Modern floating glass header.
 */

import { Settings } from 'lucide-react'

interface AppHeaderProps {
  subtitle?: string
  onSettingsClick?: () => void
}

export default function AppHeader({ subtitle, onSettingsClick }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-50 px-4 pt-4 pb-2 bg-transparent pointer-events-none">
      <div className="glass mx-auto max-w-lg rounded-[24px] px-5 py-3 flex items-center justify-between shadow-lg shadow-primary/5 pointer-events-auto">
        <div className="flex flex-col">
          <h1 className="text-lg font-extrabold text-primary tracking-tight leading-tight">
            DuoCare
          </h1>
          {subtitle && (
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{subtitle}</p>
          )}
        </div>

        {onSettingsClick && (
          <button
            onClick={onSettingsClick}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 active:bg-primary/20 transition-all tap-effect"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5 text-primary" />
          </button>
        )}
      </div>
    </header>
  )
}

