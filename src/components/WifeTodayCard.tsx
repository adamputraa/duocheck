/**
 * WifeTodayCard for DuoCare dashboard.
 * Shows the latest check-in summary for the husband to see.
 */

import type { PregnancyCheckin } from '@/lib/pregnancy'
import { FEELING_OPTIONS, MOOD_OPTIONS, ENERGY_OPTIONS, PAIN_OPTIONS, BABY_MOVEMENT_OPTIONS } from '@/lib/pregnancy'

interface WifeTodayCardProps {
  checkin: PregnancyCheckin | null
  sharingEnabled: boolean
}

function getLabel(options: readonly { value: string; label: string; emoji: string }[], value: string | null) {
  if (!value) return null
  const opt = options.find(o => o.value === value)
  return opt ? `${opt.emoji} ${opt.label}` : value
}

export default function WifeTodayCard({ checkin, sharingEnabled }: WifeTodayCardProps) {
  if (!sharingEnabled) {
    return (
      <div className="bg-card rounded-2xl border border-border-light p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-text-dark mb-2">Wife Today</h3>
        <p className="text-sm text-text-muted">Status sharing is turned off.</p>
      </div>
    )
  }

  if (!checkin) {
    return (
      <div className="bg-card rounded-2xl border border-border-light p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-text-dark mb-2">Wife Today</h3>
        <p className="text-sm text-text-muted">No check-in yet today.</p>
      </div>
    )
  }

  const time = new Date(checkin.created_at).toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="bg-card rounded-2xl border border-border-light p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text-dark">Wife Today</h3>
        <span className="text-xs text-text-muted">{time}</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-cream rounded-lg px-3 py-2">
          <p className="text-[10px] text-text-muted uppercase">Feeling</p>
          <p className="text-sm font-medium text-text-dark">
            {getLabel(FEELING_OPTIONS, checkin.overall_feeling)}
          </p>
        </div>
        <div className="bg-cream rounded-lg px-3 py-2">
          <p className="text-[10px] text-text-muted uppercase">Mood</p>
          <p className="text-sm font-medium text-text-dark">
            {getLabel(MOOD_OPTIONS, checkin.mood)}
          </p>
        </div>
        <div className="bg-cream rounded-lg px-3 py-2">
          <p className="text-[10px] text-text-muted uppercase">Energy</p>
          <p className="text-sm font-medium text-text-dark">
            {getLabel(ENERGY_OPTIONS, checkin.energy_level)}
          </p>
        </div>
        <div className="bg-cream rounded-lg px-3 py-2">
          <p className="text-[10px] text-text-muted uppercase">Pain</p>
          <p className="text-sm font-medium text-text-dark">
            {getLabel(PAIN_OPTIONS, checkin.pain_type)}
          </p>
        </div>
      </div>

      {checkin.baby_movement && checkin.baby_movement !== 'not_applicable' && (
        <div className="mt-2 bg-cream rounded-lg px-3 py-2">
          <p className="text-[10px] text-text-muted uppercase">Baby Movement</p>
          <p className="text-sm font-medium text-text-dark">
            {getLabel(BABY_MOVEMENT_OPTIONS, checkin.baby_movement)}
          </p>
        </div>
      )}

      {checkin.is_urgent && (
        <div className="mt-2 bg-emergency/10 rounded-lg px-3 py-2">
          <p className="text-xs font-semibold text-emergency">⚠️ Marked as urgent</p>
        </div>
      )}
    </div>
  )
}
