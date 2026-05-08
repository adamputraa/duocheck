/**
 * History page for DuoCare.
 * Shows pregnancy check-in history grouped by day.
 */

import { useEffect } from 'react'
import { usePregnancy } from '@/hooks/usePregnancy'
import { useCouple } from '@/hooks/useCouple'
import { FEELING_OPTIONS, MOOD_OPTIONS, ENERGY_OPTIONS, NEEDS_OPTIONS } from '@/lib/pregnancy'
import AppHeader from '@/components/AppHeader'
import BottomNav from '@/components/BottomNav'
import { useNavigate } from 'react-router-dom'

function getLabel(options: readonly { value: string; label: string; emoji: string }[], value: string | null) {
  if (!value) return null
  const opt = options.find(o => o.value === value)
  return opt ? `${opt.emoji} ${opt.label}` : value
}

function groupByDay(items: any[]) {
  const today = new Date(); today.setHours(0,0,0,0)
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)

  const groups: { label: string; items: any[] }[] = [
    { label: 'Today', items: [] },
    { label: 'Yesterday', items: [] },
    { label: 'Older', items: [] },
  ]

  items.forEach(item => {
    const d = new Date(item.created_at); d.setHours(0,0,0,0)
    if (d.getTime() === today.getTime()) groups[0].items.push(item)
    else if (d.getTime() === yesterday.getTime()) groups[1].items.push(item)
    else groups[2].items.push(item)
  })

  return groups.filter(g => g.items.length > 0)
}

export default function HistoryPage() {
  const { checkinHistory, fetchHistory, loading } = usePregnancy()
  const { userRole } = useCouple()
  const navigate = useNavigate()

  useEffect(() => { fetchHistory(50) }, [fetchHistory])

  const groups = groupByDay(checkinHistory)

  return (
    <div className="min-h-dvh bg-cream pb-24">
      <AppHeader subtitle="Check-In History" onSettingsClick={() => navigate('/settings')} />
      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {loading && (
          <div className="text-center py-12 text-text-muted animate-pulse">Loading history…</div>
        )}

        {!loading && checkinHistory.length === 0 && (
          <div className="bg-card rounded-2xl border border-border-light p-6 shadow-sm text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-base font-semibold text-text-dark mb-1">No check-ins yet</p>
            <p className="text-sm text-text-muted">
              {userRole === 'wife' ? 'Submit your first pregnancy check-in.' : 'Your wife has not submitted a check-in yet.'}
            </p>
          </div>
        )}

        {groups.map(group => (
          <div key={group.label}>
            <h2 className="text-sm font-semibold text-text-muted mb-2">{group.label}</h2>
            <div className="space-y-2">
              {group.items.map((ci: any) => {
                const time = new Date(ci.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
                return (
                  <div key={ci.id} className="bg-card rounded-2xl border border-border-light p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-text-dark">
                          {getLabel(FEELING_OPTIONS, ci.overall_feeling)}
                        </span>
                        {ci.is_urgent && (
                          <span className="text-[10px] bg-emergency/10 text-emergency px-2 py-0.5 rounded-full font-semibold">Urgent</span>
                        )}
                      </div>
                      <span className="text-xs text-text-muted">{time}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 text-xs">
                      {ci.mood && <span className="bg-cream px-2 py-1 rounded-lg text-text-dark">{getLabel(MOOD_OPTIONS, ci.mood)}</span>}
                      {ci.energy_level && <span className="bg-cream px-2 py-1 rounded-lg text-text-dark">{getLabel(ENERGY_OPTIONS, ci.energy_level)}</span>}
                      {ci.needs_from_husband && ci.needs_from_husband !== 'none' && (
                        <span className="bg-primary-light px-2 py-1 rounded-lg text-primary-dark font-medium">
                          Need: {getLabel(NEEDS_OPTIONS, ci.needs_from_husband)}
                        </span>
                      )}
                    </div>
                    {ci.note && <p className="text-xs text-text-muted mt-2 italic">"{ci.note}"</p>}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </main>
      <BottomNav activeRoute="/dashboard" />
    </div>
  )
}
