/**
 * ActionIconButton component for DuoCheck.
 * Reusable action button: white rounded card with colored icon, label below.
 * Minimum 100px height, touch-friendly (44px+ touch target).
 */

import { Loader2 } from 'lucide-react'

interface ActionIconButtonProps {
  icon: React.ReactNode
  label: string
  color: string
  onClick: () => void
  loading?: boolean
  disabled?: boolean
}

export default function ActionIconButton({
  icon,
  label,
  color,
  onClick,
  loading = false,
  disabled = false,
}: ActionIconButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="flex flex-col items-center justify-center min-h-[100px] bg-white rounded-xl border border-border-light p-3 gap-2 transition-all active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none shadow-sm"
      aria-label={label}
    >
      <div
        className="flex items-center justify-center w-11 h-11 rounded-full"
        style={{ backgroundColor: color }}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 text-white animate-spin" />
        ) : (
          <span className="text-white">{icon}</span>
        )}
      </div>
      <span className="text-xs font-medium text-text-dark text-center leading-tight">
        {label}
      </span>
    </button>
  )
}
