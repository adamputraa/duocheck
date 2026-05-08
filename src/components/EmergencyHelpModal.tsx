/**
 * EmergencyHelpModal for DuoCare.
 * Confirmation modal for sending emergency alert with optional message and location.
 */

import { useState } from 'react'
import { AlertTriangle, Loader2, MapPin } from 'lucide-react'

interface EmergencyHelpModalProps {
  partnerName: string
  onConfirm: (opts: { message?: string; includeLocation?: boolean }) => Promise<void>
  onClose: () => void
  loading?: boolean
}

export default function EmergencyHelpModal({ partnerName, onConfirm, onClose, loading = false }: EmergencyHelpModalProps) {
  const [message, setMessage] = useState('')
  const [includeLocation, setIncludeLocation] = useState(false)

  const handleConfirm = async () => {
    await onConfirm({ message: message.trim() || undefined, includeLocation })
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-100 mx-auto mb-4">
          <AlertTriangle className="w-7 h-7 text-emergency" />
        </div>

        <h3 className="text-lg font-bold text-text-dark text-center mb-2">
          Send Emergency Alert?
        </h3>

        <p className="text-sm text-text-muted text-center leading-relaxed mb-4">
          Send emergency alert to {partnerName}?
        </p>

        {/* Message field */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-text-dark mb-1">
            What happened? <span className="text-text-muted font-normal">(optional)</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe what happened..."
            rows={2}
            className="w-full px-3 py-2 bg-cream border border-border-light rounded-xl text-text-dark text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
          />
        </div>

        {/* Location toggle */}
        <button
          type="button"
          onClick={() => setIncludeLocation(!includeLocation)}
          className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl border border-border-light mb-4 min-h-[44px] transition-colors"
        >
          <MapPin className={`w-4 h-4 ${includeLocation ? 'text-primary' : 'text-text-muted'}`} />
          <span className="text-sm text-text-dark flex-1 text-left">Include my current location</span>
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
            includeLocation ? 'bg-primary border-primary' : 'border-border-light'
          }`}>
            {includeLocation && <span className="text-white text-xs">✓</span>}
          </div>
        </button>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-xl border border-border-light text-sm font-medium text-text-muted active:bg-gray-50 transition-colors min-h-[44px]"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-xl bg-emergency text-white text-sm font-bold active:bg-red-600 transition-colors min-h-[44px] flex items-center justify-center gap-1.5"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Send Alert
          </button>
        </div>
      </div>
    </div>
  )
}
