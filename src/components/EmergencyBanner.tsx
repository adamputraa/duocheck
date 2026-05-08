/**
 * EmergencyBanner component for DuoCare.
 * Red banner for active emergencies with "I'm Safe" button.
 */

import { Phone } from 'lucide-react'

interface EmergencyBannerProps {
  senderName: string
  isSender: boolean
  onResolve: () => void
  onCall?: () => void
}

export default function EmergencyBanner({ senderName, isSender, onResolve, onCall }: EmergencyBannerProps) {
  return (
    <div className="bg-emergency/10 border border-emergency/30 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg" role="img" aria-label="warning">🚨</span>
        <p className="text-sm font-bold text-emergency">
          Emergency Active — {senderName} needs help.
        </p>
      </div>

      <div className="flex gap-2">
        {onCall && (
          <button
            onClick={onCall}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border border-emergency/30 text-emergency text-xs font-semibold active:bg-emergency/10 transition-colors min-h-[44px]"
          >
            <Phone className="w-4 h-4" />
            Call
          </button>
        )}

        {isSender && (
          <button
            onClick={onResolve}
            className="flex-1 px-3 py-2.5 rounded-lg bg-success text-white text-xs font-bold active:bg-green-600 transition-colors min-h-[44px]"
          >
            I&apos;m Safe
          </button>
        )}
      </div>
    </div>
  )
}
