import { Settings } from 'lucide-react'

interface AppHeaderProps {
  subtitle?: string
  onSettingsClick?: () => void
}

export default function AppHeader({ subtitle, onSettingsClick }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-50 pristine-header">
      <div className="mx-auto max-w-[560px] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white font-black shadow-sm">
            D
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-black text-text-dark leading-tight tracking-tight">DuoCare</h1>
            {subtitle && (
              <p className="text-[11px] font-extrabold text-text-muted uppercase tracking-[0.12em] truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {onSettingsClick && (
          <button
            onClick={onSettingsClick}
            className="w-11 h-11 rounded-2xl border border-border-light bg-white flex items-center justify-center active:bg-cream"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5 text-text-dark" />
          </button>
        )}
      </div>
    </header>
  )
}
