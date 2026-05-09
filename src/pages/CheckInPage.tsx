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
        <div className="relative group">
          <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity"></div>
          <div className="glass rounded-[40px] p-10 shadow-2xl shadow-primary/10 text-center relative z-10 border-white/60">
            <h2 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-3">Total Kicks Today</h2>
            <div className="flex items-center justify-center gap-2">
              <p className="text-7xl font-black text-primary tracking-tighter">{todayCount}</p>
            </div>
            <p className="text-xs font-bold text-text-muted/60 mt-2 italic">Updated just now</p>
          </div>
        </div>

        {/* Kick Button (Wife Only) */}
        {userRole === 'wife' && (
          <div className="flex justify-center relative">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse"></div>
            <button
              onClick={handleKick}
              disabled={saving}
              className="relative group w-60 h-60 rounded-full glass shadow-[0_20px_50px_-10px_rgba(217,119,86,0.3)] flex items-center justify-center transition-all tap-effect disabled:opacity-50 border-white/80"
            >
              <div className="absolute inset-2 rounded-full bg-gradient-to-br from-primary-light to-primary shadow-inner opacity-90 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative flex flex-col items-center">
                <div className="text-6xl mb-1 drop-shadow-xl transform group-hover:scale-110 transition-transform">👶</div>
                <span className="text-white font-black tracking-[0.1em] text-xl drop-shadow-md">
                  {saving ? 'RECORDING' : 'KICK!'}
                </span>
              </div>
            </button>
          </div>
        )}

        {/* Trends Container */}
        <div className="grid grid-cols-1 gap-6">
          {/* Hourly Trend */}
          <div className="glass rounded-[32px] p-6 shadow-xl shadow-black/5 border-white/60">
            <h3 className="font-black text-text-dark text-sm uppercase tracking-wider mb-6">Hourly Activity</h3>
            {loading ? (
              <div className="h-32 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="flex items-end h-32 gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
                {hourlyData.map((h, i) => {
                  const height = `${(h.count / maxHourly) * 100}%`
                  return (
                    <div key={i} className="flex-1 flex flex-col justify-end items-center min-w-[20px] group relative">
                      <div className="w-full bg-primary/20 rounded-full transition-all group-hover:bg-primary/50" 
                           style={{ height: h.count > 0 ? height : '4px' }}>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            <div className="flex justify-between mt-3 text-[10px] font-black text-text-muted/60 uppercase tracking-tighter">
              <span>24h Ago</span>
              <span>Now</span>
            </div>
          </div>

          {/* Daily Trend */}
          <div className="glass rounded-[32px] p-6 shadow-xl shadow-black/5 border-white/60">
            <h3 className="font-black text-text-dark text-sm uppercase tracking-wider mb-6">Weekly Progress</h3>
            {loading ? (
              <div className="h-40 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="flex items-end h-40 gap-3 mt-4 px-2">
                {dailyData.map((d, i) => {
                  const height = `${(d.count / maxDaily) * 100}%`
                  const isToday = i === dailyData.length - 1
                  return (
                    <div key={i} className="flex-1 flex flex-col justify-end items-center group relative">
                      <div className={`w-full rounded-full transition-all ${isToday ? 'bg-primary shadow-lg shadow-primary/30' : 'bg-primary/20'}`} 
                           style={{ height: d.count > 0 ? height : '8px' }}>
                      </div>
                      <span className={`text-[10px] mt-4 font-black uppercase tracking-tighter ${isToday ? 'text-primary' : 'text-text-muted/60'}`}>
                        {d.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

      </main>
      <BottomNav activeRoute="/check-in" />
    </div>
  )
}

