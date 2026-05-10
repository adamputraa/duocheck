import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCouple } from '@/hooks/useCouple'
import { useKicks } from '@/hooks/useKicks'
import AppHeader from '@/components/AppHeader'
import BottomNav from '@/components/BottomNav'
import { format, subDays, subHours, startOfHour, startOfDay } from 'date-fns'

interface TrendPoint {
  date: Date
  key: string
  count: number
  label: string
}

const dayKey = (date: Date) => format(date, 'yyyy-MM-dd')
const hourKey = (date: Date) => format(startOfHour(date), 'yyyy-MM-dd-HH')

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
    const days: TrendPoint[] = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(today, 6 - i)
      return { date: d, key: dayKey(d), count: 0, label: format(d, 'EEE') }
    })

    kicks.forEach(kick => {
      const dayMatch = days.find(d => dayKey(new Date(kick.created_at)) === d.key)
      if (dayMatch) dayMatch.count++
    })
    return days
  }, [kicks])

  // Calculate Hourly Trend (Last 12 Hours)
  const hourlyData = useMemo(() => {
    const now = startOfHour(new Date())
    const hours: TrendPoint[] = Array.from({ length: 12 }, (_, i) => {
      const h = subHours(now, 11 - i)
      return { date: h, key: hourKey(h), count: 0, label: format(h, 'HH:mm') }
    })

    kicks.forEach(kick => {
      const hourMatch = hours.find(h => hourKey(new Date(kick.created_at)) === h.key)
      if (hourMatch) hourMatch.count++
    })
    return hours
  }, [kicks])

  const maxDaily = Math.max(...dailyData.map(d => d.count), 1)
  const maxHourly = Math.max(...hourlyData.map(h => h.count), 1)
  
  // Total kicks today
  const todayCount = dailyData[dailyData.length - 1]?.count || 0

  if (!isInCouple) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-6 text-center">
        <AppHeader subtitle="Kick Record" onSettingsClick={() => navigate('/settings')} />
        <div className="glass rounded-[32px] p-8 max-w-sm">
          <p className="text-text-muted font-bold">You need to join a couple to track kicks.</p>
        </div>
        <BottomNav activeRoute="/check-in" />
      </div>
    )
  }

  return (
    <div className="min-h-dvh pb-32">
      <AppHeader subtitle="Kick Record" onSettingsClick={() => navigate('/settings')} />
      
      <main className="max-w-lg mx-auto px-4 py-6 space-y-8">
        
        {/* Today's Counter */}
        <div className="pristine-card p-10 text-center">
          <h2 className="text-[11px] font-extrabold text-text-muted uppercase tracking-[0.2em] mb-4">Total Kicks Today</h2>
          <p className="text-7xl font-black text-primary tracking-tighter">{todayCount}</p>
          <div className="mt-6 inline-flex items-center gap-2 px-3 py-1 bg-primary/5 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Live Tracker</span>
          </div>
        </div>

        {/* Kick Button (Wife Only) */}
        {userRole === 'wife' && (
          <div className="flex justify-center">
            <button
              onClick={handleKick}
              disabled={saving}
              className="group relative w-64 h-64 flex items-center justify-center tap-effect"
            >
              <div className="absolute inset-0 rounded-full bg-primary/5 group-active:scale-95 transition-transform"></div>
              <div className="absolute inset-4 rounded-full border-2 border-dashed border-primary/20 animate-[spin_20s_linear_infinite]"></div>
              <div className="w-48 h-48 rounded-full bg-primary shadow-[0_20px_40px_-10px_rgba(217,119,86,0.5)] flex flex-col items-center justify-center transition-all group-active:scale-90">
                <div className="text-5xl mb-2 drop-shadow-md transform group-hover:scale-110 transition-transform">👶</div>
                <span className="text-white font-black tracking-[0.15em] text-lg">
                  {saving ? 'RECORDING' : 'KICK!'}
                </span>
              </div>
            </button>
          </div>
        )}

        {/* Trends Container */}
        <div className="grid grid-cols-1 gap-6">
          {/* Hourly Trend */}
          <div className="pristine-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-extrabold text-text-dark text-xs uppercase tracking-widest">Hourly Activity</h3>
              <span className="text-[10px] font-bold text-text-muted">Kick Count - Last 12 Hours</span>
            </div>
            
            {loading ? (
              <div className="h-32 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-gray-100 border-t-primary rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="grid grid-cols-[42px_1fr] gap-3">
                <div className="h-32 flex flex-col justify-between text-[10px] font-bold text-text-muted">
                  <span>{maxHourly}</span>
                  <span className="-rotate-90 whitespace-nowrap self-center uppercase tracking-tighter">Kick Count</span>
                  <span>0</span>
                </div>
                <div className="flex items-end h-32 gap-1 overflow-x-auto pb-2 scrollbar-hide">
                  {hourlyData.map(h => {
                    const height = `${Math.max((h.count / maxHourly) * 100, 5)}%`
                    return (
                      <div key={h.key} className="flex-1 h-full flex flex-col justify-end items-center min-w-[12px] group relative">
                        <div
                          title={`${h.label}: ${h.count} kick${h.count === 1 ? '' : 's'}`}
                          className={`w-full rounded-full transition-all ${h.count > 0 ? 'bg-primary shadow-[0_2px_8px_rgba(217,119,86,0.3)]' : 'bg-gray-100'}`}
                          style={{ height: h.count > 0 ? height : '4px' }}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            <div className="ml-[54px] flex justify-between mt-3 text-[10px] font-bold text-text-muted uppercase tracking-tighter opacity-60">
              <span>12h Ago</span>
              <span>Now</span>
            </div>
          </div>

          {/* Daily Trend */}
          <div className="pristine-card p-6">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-extrabold text-text-dark text-xs uppercase tracking-widest">Weekly Progress</h3>
              <span className="text-[10px] font-bold text-text-muted">Kick Count - Last 7 Days</span>
            </div>

            {loading ? (
              <div className="h-40 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-gray-100 border-t-primary rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="grid grid-cols-[42px_1fr] gap-3">
                <div className="h-40 flex flex-col justify-between text-[10px] font-bold text-text-muted">
                  <span>{maxDaily}</span>
                  <span className="-rotate-90 whitespace-nowrap self-center uppercase tracking-tighter">Kick Count</span>
                  <span>0</span>
                </div>
                <div>
                  <div className="flex items-end h-40 gap-3 px-2">
                    {dailyData.map((d, i) => {
                      const height = `${Math.max((d.count / maxDaily) * 100, 8)}%`
                      const isToday = i === dailyData.length - 1
                      return (
                        <div key={d.key} className="flex-1 h-full grid grid-rows-[20px_1fr] items-end group relative">
                          <span className={`mb-2 text-[10px] font-black ${d.count > 0 ? 'text-primary' : 'text-text-muted opacity-50'}`}>
                            {d.count}
                          </span>
                          <div className="h-full flex items-end">
                            <div
                              title={`${d.label}: ${d.count} kick${d.count === 1 ? '' : 's'}`}
                              className={`w-full rounded-full transition-all ${isToday ? 'bg-primary shadow-[0_4px_12px_rgba(217,119,86,0.4)]' : (d.count > 0 ? 'bg-primary/30' : 'bg-gray-100')}`}
                              style={{ height: d.count > 0 ? height : '8px' }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="grid grid-cols-7 gap-3 px-2 mt-4">
                    {dailyData.map((d, i) => {
                      const isToday = i === dailyData.length - 1
                      return (
                        <span key={d.key} className={`text-center text-[10px] font-extrabold uppercase tracking-tighter leading-tight ${isToday ? 'text-primary' : 'text-text-muted opacity-60'}`}>
                          {d.label}
                        </span>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <BottomNav activeRoute="/check-in" />
    </div>
  )
}


