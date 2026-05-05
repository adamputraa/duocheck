/**
 * AppHeader component for DuoCheck.
 * Orange gradient header with app name, sharing status badge, and settings button.
 */

import { Settings } from 'lucide-react'
import SharingStatusBadge from '@/components/SharingStatusBadge'

interface AppHeaderProps {
  sharingEnabled: boolean
  onSettingsClick?: () => void
}

export default function AppHeader({ sharingEnabled, onSettingsClick }: AppHeaderProps) {
  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between px-4 py-3"
      style={{
        background: 'linear-gradient(135deg, #D97756 0%, #B85C38 100%)',
      }}
    >
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-white tracking-tight">
          DuoCheck
        </h1>
        <SharingStatusBadge enabled={sharingEnabled} />
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
