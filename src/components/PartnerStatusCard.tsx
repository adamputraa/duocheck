/**
 * PartnerStatusCard component for DuoCheck.
 * Card showing partner's last shared location, status, and accuracy.
 * Shows stale warning and sharing-off warning as needed.
 */

import { MapPin, AlertTriangle } from 'lucide-react'
import { formatRelativeTime } from '@/lib/date'
import { formatAccuracy } from '@/lib/location'
import { isStale } from '@/lib/date'

interface PartnerStatusCardProps {
  partner: { display_name: string | null; id: string }
  partnerLocation: {
    latitude: number
    longitude: number
    accuracy: number | null
    status: string
    created_at: string
  } | null
  partnerSettings: { sharing_enabled: boolean } | null
  staleThresholdHours: number
  onViewMap: () => void
}

export default function PartnerStatusCard({
  partner,
  partnerLocation,
  partnerSettings,
  staleThresholdHours,
  onViewMap,
}: PartnerStatusCardProps) {
  const displayName = partner.display_name || 'Partner'
  const initial = displayName.charAt(0).toUpperCase()
  const sharingOff = partnerSettings && !partnerSettings.sharing_enabled
  const isLocationStale =
    partnerLocation && isStale(partnerLocation.created_at, staleThresholdHours)

  return (
    <div className="bg-white rounded-xl border border-border-light p-4 shadow-sm">
      {/* Partner header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-light text-primary font-bold text-sm shrink-0">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-text-dark truncate">
            {displayName}
          </h3>
          {partnerLocation ? (
            <p className="text-xs text-text-muted">
              {partnerLocation.status || 'Location updated'}
            </p>
          ) : (
            <p className="text-xs text-text-muted">No location shared yet</p>
          )}
        </div>
      </div>

      {/* Sharing OFF warning */}
      {sharingOff && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 mb-3">
          <MapPin className="w-4 h-4 text-text-muted shrink-0" />
          <span className="text-xs text-text-muted">
            Partner has sharing turned off
          </span>
        </div>
      )}

      {/* Location details */}
      {partnerLocation && !sharingOff && (
        <>
          <div className="flex items-center justify-between text-xs text-text-muted mb-2">
            <span>
              Last updated {formatRelativeTime(partnerLocation.created_at)}
            </span>
            {partnerLocation.accuracy !== null && (
              <span>{formatAccuracy(partnerLocation.accuracy)}</span>
            )}
          </div>

          {/* Stale warning */}
          {isLocationStale && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 mb-3">
              <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
              <span className="text-xs text-amber-800">
                Location may be outdated
              </span>
            </div>
          )}

          {/* View on map link */}
          <button
            onClick={onViewMap}
            className="flex items-center gap-1 text-xs font-medium text-primary active:text-primary-dark transition-colors min-h-[44px]"
          >
            <MapPin className="w-3.5 h-3.5" />
            View on map
          </button>
        </>
      )}
    </div>
  )
}
