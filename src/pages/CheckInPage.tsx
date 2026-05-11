import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, startOfDay } from 'date-fns'
import { Activity } from 'lucide-react'
import { useCouple } from '@/hooks/useCouple'
import { useKicks } from '@/hooks/useKicks'
import AppHeader from '@/components/AppHeader'
import BottomNav from '@/components/BottomNav'
import KickSummaryChart from '@/components/KickSummaryChart'

const dayKey = (date: Date) => format(startOfDay(date), 'yyyy-MM-dd')

export default function CheckInPage() {
  const { userRole, isInCouple } = useCouple()
  const { kicks, addKick } = useKicks()
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  const todayCount = useMemo(() => {
    const today = dayKey(new Date())
    return kicks.filter(kick => dayKey(new Date(kick.created_at)) === today).length
  }, [kicks])

  const handleKick = async () => {
    setSaving(true)
    await addKick()
    setSaving(false)
  }

  if (!isInCouple) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-6 text-center">
        <AppHeader subtitle="Kick Record" onSettingsClick={() => navigate('/settings')} />
        <div className="app-card rounded-[28px] p-8 max-w-sm">
          <p className="text-text-muted font-bold">You need to join a couple to track kicks.</p>
        </div>
        <BottomNav activeRoute="/check-in" />
      </div>
    )
  }

  return (
    <div className="app-page">
      <AppHeader subtitle="Kick Record" onSettingsClick={() => navigate('/settings')} />

      <main className="app-main space-y-6">
        <section className="app-card p-8 text-center">
          <h2 className="text-[11px] font-extrabold text-text-muted uppercase tracking-[0.18em]">Total Kicks Today</h2>
          <p className="text-7xl font-black text-primary tracking-tight mt-3">{todayCount}</p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary-light px-3 py-1">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-black text-primary uppercase tracking-wider">Live Tracker</span>
          </div>
        </section>

        {userRole === 'wife' && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleKick}
              disabled={saving}
              className="group relative w-64 h-64 flex items-center justify-center tap-effect disabled:opacity-70"
            >
              <div className="absolute inset-0 rounded-full bg-primary/8 group-active:scale-95 transition-transform" />
              <div className="absolute inset-4 rounded-full border-2 border-dashed border-primary/20 animate-[spin_20s_linear_infinite]" />
              <div className="w-48 h-48 rounded-full bg-primary shadow-[0_20px_40px_-10px_rgba(240,95,69,0.55)] flex flex-col items-center justify-center transition-all group-active:scale-90">
                <Activity className="w-12 h-12 mb-3 text-white/90" />
                <span className="text-white font-black tracking-[0.15em] text-lg">
                  {saving ? 'RECORDING' : 'KICK!'}
                </span>
              </div>
            </button>
          </div>
        )}

        <KickSummaryChart kicks={kicks} />
      </main>

      <BottomNav activeRoute="/check-in" />
    </div>
  )
}
