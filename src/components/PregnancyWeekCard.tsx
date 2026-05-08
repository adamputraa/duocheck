/**
 * PregnancyWeekCard for DuoCare dashboard.
 * Shows current pregnancy week, trimester, days until due date.
 */

import type { PregnancyInfo } from '@/lib/pregnancy'
import { Baby } from 'lucide-react'

interface PregnancyWeekCardProps {
  info: PregnancyInfo
  dueDate: string
}

export default function PregnancyWeekCard({ info, dueDate }: PregnancyWeekCardProps) {
  const formattedDue = new Date(dueDate).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <div className="bg-card rounded-2xl border border-border-light p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary-light">
          <Baby className="w-6 h-6 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold text-text-dark">Week {info.currentWeek}</p>
          <p className="text-xs text-text-muted">{info.trimester}</p>
        </div>
      </div>
      <div className="flex items-center justify-between text-sm">
        <div>
          <p className="text-text-muted">Due date</p>
          <p className="font-medium text-text-dark">{formattedDue}</p>
        </div>
        <div className="text-right">
          <p className="text-text-muted">Days to go</p>
          <p className="font-bold text-primary text-lg">{info.daysUntilDue}</p>
        </div>
      </div>
    </div>
  )
}
