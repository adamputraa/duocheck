/**
 * HistoryTimeline component for DuoCheck.
 * Timeline-style records grouped by date (Today, Yesterday, Older).
 * Each record shows status badge, timestamp, source, and accuracy.
 */

import { MapPin } from 'lucide-react'
import { formatRelativeTime, formatAbsoluteTime, groupByDate } from '@/lib/date'
import { formatAccuracy } from '@/lib/location'

interface HistoryRecord {
  status: string
  source: string
  accuracy: number | null
  created_at: string
  latitude: number
  longitude: number
}

interface HistoryTimelineProps {
  records: Array<HistoryRecord>
}

function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'home':
      return 'bg-green-100 text-green-800'
    case 'on the way':
      return 'bg-amber-100 text-amber-800'
    case 'sos':
      return 'bg-red-100 text-red-800'
    case 'leaving work':
      return 'bg-gray-100 text-gray-700'
    case 'check-in':
      return 'bg-primary-light text-primary-dark'
    default:
      return 'bg-primary-light text-primary-dark'
  }
}

function getSourceLabel(source: string): string {
  if (source === 'ios_shortcut') return 'Shortcut'
  return 'Web'
}

export default function HistoryTimeline({ records }: HistoryTimelineProps) {
  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary-light mb-3">
          <MapPin className="w-5 h-5 text-primary" />
        </div>
        <h3 className="text-sm font-semibold text-text-dark mb-1">No history yet</h3>
        <p className="text-xs text-text-muted">
          Check-ins will appear here once you start sharing your location.
        </p>
      </div>
    )
  }

  // Group records by date
  const groups: Record<string, Array<HistoryRecord>> = {}
  const groupOrder: string[] = []

  records.forEach((record) => {
    const group = groupByDate(record.created_at)
    if (!groups[group]) {
      groups[group] = []
      groupOrder.push(group)
    }
    groups[group].push(record)
  })

  return (
    <div className="space-y-6">
      {groupOrder.map((groupName) => (
        <div key={groupName}>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
            {groupName}
          </h3>

          <div className="relative pl-6 space-y-3">
            {/* Vertical timeline line */}
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border-light" />

            {groups[groupName].map((record, index) => (
              <div
                key={`${record.created_at}-${index}`}
                className="relative bg-white rounded-xl border border-border-light p-3 shadow-sm"
              >
                {/* Timeline dot */}
                <div className="absolute -left-6 top-4 flex items-center justify-center w-3.5 h-3.5 rounded-full bg-primary border-2 border-white" />

                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${getStatusColor(record.status)}`}
                    >
                      {record.status || 'Check-in'}
                    </span>
                    <div className="mt-1.5 space-y-0.5">
                      <p className="text-xs text-text-dark">
                        {formatAbsoluteTime(record.created_at)}
                      </p>
                      <p className="text-[10px] text-text-muted">
                        {formatRelativeTime(record.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-text-muted">
                      {getSourceLabel(record.source)}
                    </span>
                    {record.accuracy !== null && (
                      <span className="text-[10px] text-text-muted">
                        {formatAccuracy(record.accuracy)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
