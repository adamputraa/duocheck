/**
 * SOSButton component for DuoCheck.
 * Prominent red SOS button with confirmation dialog.
 * Requires confirmation before triggering emergency alert.
 */

import { useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'

interface SOSButtonProps {
  partnerName: string
  onConfirm: () => void
  loading?: boolean
}

export default function SOSButton({ partnerName, onConfirm, loading = false }: SOSButtonProps) {
  const [showConfirmation, setShowConfirmation] = useState(false)

  return (
    <>
      {/* Main SOS button */}
      <button
        onClick={() => setShowConfirmation(true)}
        disabled={loading}
        className="flex items-center justify-center gap-2 w-full px-6 py-4 rounded-xl bg-emergency text-white font-bold text-base active:bg-red-600 transition-all disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-red-200 min-h-[44px]"
        aria-label="Send SOS alert"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <AlertTriangle className="w-5 h-5" />
        )}
        SOS
      </button>

      {/* Confirmation dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-100 mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-emergency" />
            </div>

            <h3 className="text-lg font-bold text-text-dark text-center mb-2">
              Send Emergency Alert?
            </h3>

            <p className="text-sm text-text-muted text-center leading-relaxed mb-6">
              Send emergency alert to {partnerName}? This will share your
              location and notify them immediately.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 px-4 py-3 rounded-xl border border-border-light text-sm font-medium text-text-muted active:bg-gray-50 transition-colors min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onConfirm()
                  setShowConfirmation(false)
                }}
                className="flex-1 px-4 py-3 rounded-xl bg-emergency text-white text-sm font-bold active:bg-red-600 transition-colors min-h-[44px]"
              >
                Send SOS
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
