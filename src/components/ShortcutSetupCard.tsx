/**
 * ShortcutSetupCard component for DuoCheck.
 * Card showing shortcut setup info with masked token, reveal toggle,
 * privacy warning, and regenerate button.
 */

import { useState } from 'react'
import { Key, Eye, EyeOff, RefreshCw, AlertTriangle } from 'lucide-react'

interface ShortcutSetupCardProps {
  token: string | null
  onRegenerate: () => void
}

export default function ShortcutSetupCard({ token, onRegenerate }: ShortcutSetupCardProps) {
  const [revealed, setRevealed] = useState(false)
  const [confirmRegenerate, setConfirmRegenerate] = useState(false)

  const maskedToken = token ? '\u2022'.repeat(Math.min(token.length, 16)) : 'Not available'

  return (
    <div className="bg-white rounded-xl border border-border-light p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary-light shrink-0">
          <Key className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-text-dark">
            iOS Shortcut Token
          </h3>
          <p className="text-[11px] text-text-muted">
            Use this token to update your location from iOS Shortcuts
          </p>
        </div>
      </div>

      {/* Token display */}
      <div className="bg-cream rounded-lg p-3 mb-3">
        <div className="flex items-center justify-between gap-2">
          <code className="text-xs text-text-dark font-mono break-all flex-1">
            {revealed && token ? token : maskedToken}
          </code>
          <button
            onClick={() => setRevealed(!revealed)}
            className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-border-light/50 transition-colors shrink-0"
            aria-label={revealed ? 'Hide token' : 'Reveal token'}
            disabled={!token}
          >
            {revealed ? (
              <EyeOff className="w-4 h-4 text-text-muted" />
            ) : (
              <Eye className="w-4 h-4 text-text-muted" />
            )}
          </button>
        </div>
      </div>

      {/* Privacy warning */}
      <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 mb-3">
        <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-800 leading-relaxed">
          Keep this token private. Anyone with this token can update your
          location.
        </p>
      </div>

      {/* Regenerate button */}
      {!confirmRegenerate ? (
        <button
          onClick={() => setConfirmRegenerate(true)}
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg border border-border-light text-xs font-medium text-text-muted active:bg-gray-50 transition-colors min-h-[44px]"
          disabled={!token}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Regenerate Token
        </button>
      ) : (
        <div className="space-y-2">
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-50">
            <AlertTriangle className="w-4 h-4 text-emergency shrink-0 mt-0.5" />
            <p className="text-[11px] text-red-800 leading-relaxed">
              Regenerating will invalidate your current token. Any shortcuts
              using it will stop working. Are you sure?
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmRegenerate(false)}
              className="flex-1 px-4 py-2.5 rounded-lg border border-border-light text-xs font-medium text-text-muted active:bg-gray-50 transition-colors min-h-[44px]"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onRegenerate()
                setConfirmRegenerate(false)
                setRevealed(false)
              }}
              className="flex-1 px-4 py-2.5 rounded-lg bg-emergency text-white text-xs font-medium active:bg-red-600 transition-colors min-h-[44px]"
            >
              Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
