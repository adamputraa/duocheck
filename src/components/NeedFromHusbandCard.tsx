/**
 * NeedFromHusbandCard for DuoCare dashboard.
 */

import { NEEDS_OPTIONS } from '@/lib/pregnancy'

interface NeedFromHusbandCardProps {
  need: string | null
}

export default function NeedFromHusbandCard({ need }: NeedFromHusbandCardProps) {
  const opt = NEEDS_OPTIONS.find(o => o.value === need)

  return (
    <div className="bg-card rounded-2xl border border-border-light p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-text-dark mb-2">Need from Husband</h3>
      {!need || need === 'none' ? (
        <p className="text-sm text-text-muted">Nothing requested right now. ✅</p>
      ) : (
        <div className="flex items-center gap-3 bg-primary-light rounded-xl px-4 py-3">
          <span className="text-2xl">{opt?.emoji || '📝'}</span>
          <div>
            <p className="text-base font-semibold text-primary-dark">{opt?.label || need}</p>
            <p className="text-xs text-text-muted">Your wife needs this</p>
          </div>
        </div>
      )}
    </div>
  )
}
