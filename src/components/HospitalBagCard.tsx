/**
 * HospitalBagCard for DuoCare dashboard.
 */

import { Briefcase } from 'lucide-react'

interface HospitalBagCardProps {
  completionPercent: number
  checkedItems: number
  totalItems: number
  onView: () => void
}

export default function HospitalBagCard({ completionPercent, checkedItems, totalItems, onView }: HospitalBagCardProps) {
  return (
    <div className="bg-card rounded-2xl border border-border-light p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text-dark flex items-center gap-1.5">
          <Briefcase className="w-4 h-4 text-primary" />
          Hospital Bag
        </h3>
        <button onClick={onView} className="text-xs text-primary font-medium min-h-[44px] flex items-center">
          View
        </button>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="w-full bg-cream rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>
        <span className="text-sm font-semibold text-text-dark whitespace-nowrap">
          {checkedItems}/{totalItems}
        </span>
      </div>
      <p className="text-xs text-text-muted mt-1">{completionPercent}% packed</p>
    </div>
  )
}
