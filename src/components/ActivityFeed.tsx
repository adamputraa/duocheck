/**
 * ActivityFeed component for DuoCheck.
 * Recent activity list showing the last 5 entries with icons,
 * status text, timestamps, and source badges.
 */

import { MapPin, ChevronRight } from 'lucide-react'
import { formatRelativeTime } from '@/lib/date'

interface Activity {
  user_id: string
  status: string
  source: string
  created_at: string
}

interface ActivityFeedProps {
  activities: Array<Activity>
  currentUserId: string
  partnerName: string
  onViewAll: () => void
}

function getStatusIcon() {
  return <MapPin className="w-4 h-4 text-primary" />
}

function getSourceBadge(source: string) {
  if (source === 'ios_shortcut') {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary-light text-primary">
        Shortcut
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-text-muted">
      Web
    </span>
  )
}

export default function ActivityFeed({
  activities,
  currentUserId,
  partnerName,
  onViewAll,
}: ActivityFeedProps) {
  const recentActivities = activities.slice(0, 5)

  if (recentActivities.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-xl border border-border-light shadow-sm">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h3 className="text-sm font-semibold text-text-dark">Recent Activity</h3>
        <button
          onClick={onViewAll}
          className="flex items-center gap-0.5 text-xs font-medium text-primary active:text-primary-dark transition-colors min-h-[44px]"
        >
          View all
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="divide-y divide-border-light">
        {recentActivities.map((activity, index) => {
          const isPartner = activity.user_id !== currentUserId
          const actorName = isPartner ? partnerName : 'You'

          return (
            <div
              key={`${activity.created_at}-${index}`}
              className="flex items-center gap-3 px-4 py-3"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-light shrink-0">
                {getStatusIcon()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-text-dark truncate">
                  <span className="font-medium">{actorName}</span>
                  {' — '}
                  {activity.status || 'Location updated'}
                </p>
                <p className="text-[10px] text-text-muted mt-0.5">
                  {formatRelativeTime(activity.created_at)}
                </p>
              </div>
              <div className="shrink-0">{getSourceBadge(activity.source)}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
