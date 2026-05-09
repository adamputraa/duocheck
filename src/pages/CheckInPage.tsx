import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCouple } from '@/hooks/useCouple'
import { useKicks } from '@/hooks/useKicks'
import AppHeader from '@/components/AppHeader'
import BottomNav from '@/components/BottomNav'
import { format, subDays, subHours, startOfHour, startOfDay, isAfter } from 'date-fns'

export default function CheckInPage() {
  const { userRole, isInCouple } = useCouple()
  const { kicks, loading, addKick } = useKicks()
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  const handleKick = async () => {
    setSaving(true)
    await addKick()
    setSaving(false)
  }

  // Calculate Daily Trend (Last 7 Days)
  const dailyData = useMemo(() => {
    const today = startOfDay(new Date())
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(today, 6 - i)
      return { date: d, count: 0, label: format(d, 'EEE') }
    })

    kicks.forEach(kick => {
      const kickDate = new Date(kick.created_at)
      if (isAfter(kickDate, subDays(today, 7))) {
        const dayMatch = days.find(d => startOfDay(kickDate).getTime() === d.date.getTime())
        if (dayMatch) dayMatch.count++
      }
    })
    return days
  }, [kicks])

  // Calculate Hourly Trend (Last 24 Hours)
  const hourlyData = useMemo(() => {
    const now = startOfHour(new Date())
    const hours = Array.from({ length: 24 }, (_, i) => {
      const h = subHours(now, 23 - i)
      return { date: h, count: 0, label: format(h, 'HH:mm') }
    })

    kicks.forEach(kick => {
      const kickDate = new Date(kick.created_at)
      if (isAfter(kickDate, subHours(now, 24))) {
        const hourMatch = hours.find(h => startOfHour(kickDate).getTime() === h.date.getTime())
        if (hourMatch) hourMatch.count++
      }
    })
    return hours
  }, [kicks])

  const maxDaily = Math.max(...dailyData.map(d => d.count), 1)
  const maxHourly = Math.max(...hourlyData.map(h => h.count), 1)
  
  // Total kicks today
  const todayCount = dailyData[dailyData.length - 1]?.count || 0

  if (!isInCouple) {
    return (
      <div className="min-h-dvh bg-cream pb-24">
        <AppHeader subtitle="Kick Record" onSettingsClick={() => navigate('/settings')} />
        <main className="max-w-lg mx-auto px-4 py-6 text-center">
          <p className="text-text-muted">You need to join a couple to track kicks.</p>
        </main>
        <BottomNav activeRoute="/check-in" />
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-cream pb-24">
      <AppHeader subtitle="Kick Record" onSettingsClick={() => navigate('/settings')} />
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        
        {/* Today's Summary */}
        <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white p-6 shadow-md shadow-primary/5 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-primary/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-24 h-24 bg-primary/5 rounded-full blur-xl"></div>
          <h2 className="relative z-10 text-xs font-bold text-text-muted uppercase tracking-widest mb-1">Kicks Today</h2>
          <p className="relative z-10 text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-primary to-primary-dark mb-1">{todayCount}</p>
          <p className="relative z-10 text-xs font-medium text-text-muted/80">Since midnight</p>
        </div>

        {/* Kick Button (Wife Only) */}
        {userRole === 'wife' && (
          <div className="flex justify-center my-10">
            <button
              onClick={handleKick}
              disabled={saving}
              className="relative group w-56 h-56 rounded-full bg-gradient-to-br from-primary-light via-primary to-primary-dark shadow-[0_10px_40px_-10px_rgba(217,119,86,0.6)] flex items-center justify-center transform transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100"
            >
              <div className="absolute inset-0 rounded-full bg-white/30 blur-md group-active:blur-sm transition-all duration-300 group-hover:bg-white/40 group-active:bg-white/10" />
              <div className="absolute -inset-2 rounded-full bg-primary/20 animate-pulse -z-10" />
              <div className="relative flex flex-col items-center">
                <span className="text-6xl mb-2 drop-shadow-sm">👶</span>
                <span className="text-white font-extrabold tracking-widest text-xl drop-shadow-md">
                  {saving ? 'SAVING' : 'KICK!'}
                </span>
              </div>
            </button>
          </div>
        )}

        {/* Hourly Trend (Last 24h) */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white p-5 shadow-md shadow-primary/5">
          <h3 className="font-bold text-text-dark mb-4 text-sm tracking-wide">Hourly Trend (Last 24h)</h3>
          {loading ? (
            <p className="text-sm text-text-muted text-center py-4">Loading...</p>
          ) : (
            <div className="flex items-end h-32 gap-1 mt-4 overflow-x-auto pb-2 scrollbar-hide">
              {hourlyData.map((h, i) => {
                const height = `${(h.count / maxHourly) * 100}%`
                return (
                  <div key={i} className="flex-1 flex flex-col justify-end items-center min-w-[20px] group relative">
                    <div className="w-full bg-primary/20 rounded-t-sm transition-all group-hover:bg-primary/40" 
                         style={{ height: h.count > 0 ? height : '2px' }}>
                    </div>
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 bg-gray-800 text-white text-[10px] px-1.5 py-0.5 rounded pointer-events-none transition">
                      {h.count}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          <div className="flex justify-between mt-2 text-[10px] text-text-muted font-medium">
            <span>{hourlyData[0]?.label}</span>
            <span>{hourlyData[11]?.label}</span>
            <span>{hourlyData[23]?.label}</span>
          </div>
        </div>

        {/* Daily Trend (Last 7 Days) */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white p-5 shadow-md shadow-primary/5">
          <h3 className="font-bold text-text-dark mb-4 text-sm tracking-wide">Daily Trend (Last 7 Days)</h3>
          {loading ? (
            <p className="text-sm text-text-muted text-center py-4">Loading...</p>
          ) : (
            <div className="flex items-end h-40 gap-2 mt-4">
              {dailyData.map((d, i) => {
                const height = `${(d.count / maxDaily) * 100}%`
                const isToday = i === dailyData.length - 1
                return (
                  <div key={i} className="flex-1 flex flex-col justify-end items-center group relative">
                    <div className={`w-full rounded-t-md transition-all ${isToday ? 'bg-primary' : 'bg-primary/40 group-hover:bg-primary/60'}`} 
                         style={{ height: d.count > 0 ? height : '4px' }}>
                    </div>
                    {/* Count above bar */}
                    <span className="text-[10px] font-bold text-text-dark mt-1 absolute bottom-full mb-1">
                      {d.count > 0 ? d.count : ''}
                    </span>
                    <span className={`text-xs mt-2 font-medium ${isToday ? 'text-primary' : 'text-text-muted'}`}>
                      {d.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </main>
      <BottomNav activeRoute="/check-in" />
    </div>
  )
}
