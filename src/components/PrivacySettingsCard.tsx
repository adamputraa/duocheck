/**
 * PrivacySettingsCard component for DuoCheck.
 * Card explaining privacy and data handling with warm, reassuring tone.
 */

import { Shield } from 'lucide-react'

export default function PrivacySettingsCard() {
  return (
    <div className="bg-white rounded-xl border border-border-light p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary-light shrink-0">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <h3 className="text-sm font-semibold text-text-dark">
          Your Privacy Matters
        </h3>
      </div>

      <div className="space-y-3 text-xs text-text-muted leading-relaxed">
        <p>
          Data is stored in Supabase and encrypted at rest. Only your partner can
          see your location.
        </p>
        <p>
          No background tracking — you control when to share. Location is only
          shared when you actively check in.
        </p>
        <p>
          Location history is automatically deleted after the retention period set
          in your settings.
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-border-light">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-success" />
          <span className="text-[11px] font-medium text-success">
            End-to-end privacy by design
          </span>
        </div>
      </div>
    </div>
  )
}
