/**
 * Dashboard page for DuoCare.
 */

import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useCouple } from '@/hooks/useCouple'
import { usePregnancy } from '@/hooks/usePregnancy'
import { useAppointments } from '@/hooks/useAppointments'
import { useTasks } from '@/hooks/useTasks'
import { useHospitalBag } from '@/hooks/useHospitalBag'
import { useRealtime } from '@/hooks/useRealtime'
import { useEmergency } from '@/hooks/useEmergency'
import { useKicks } from '@/hooks/useKicks'
import { startOfDay, isAfter } from 'date-fns'
import AppHeader from '@/components/AppHeader'
import BottomNav from '@/components/BottomNav'
import PregnancyWeekCard from '@/components/PregnancyWeekCard'
import NextAppointmentCard from '@/components/NextAppointmentCard'
import PendingTasksCard from '@/components/PendingTasksCard'
import HospitalBagCard from '@/components/HospitalBagCard'
import EmergencyBanner from '@/components/EmergencyBanner'
import EmergencyHelpModal from '@/components/EmergencyHelpModal'
import LoadingCard from '@/components/LoadingCard'
import { Activity, AlertTriangle, Sparkles } from 'lucide-react'

export default function DashboardPage() {
  const { user } = useAuth()
  const { partner, userRole, loading: coupleLoading } = useCouple()
  const { profile, pregnancyInfo, loading: pregLoading } = usePregnancy()
  const { nextAppointment } = useAppointments()
  const { pending } = useTasks()
  const { completionPercent, checkedItems, totalItems } = useHospitalBag()
  const { emergencyEvents } = useRealtime()
  const { triggerEmergency, resolveEmergency } = useEmergency()
  const { kicks } = useKicks()
  const navigate = useNavigate()

  const [showEmergencyModal, setShowEmergencyModal] = useState(false)
  const [emergencyLoading, setEmergencyLoading] = useState(false)
  const [emergencyError, setEmergencyError] = useState<string | null>(null)

  const isWife = userRole === 'wife'

  const todayKicks = useMemo(() => {
    const today = startOfDay(new Date())
    return kicks.filter(k => isAfter(new Date(k.created_at), today)).length
  }, [kicks])

  const handleEmergency = async (opts: { message?: string; includeLocation?: boolean }) => {
    setEmergencyLoading(true)
    const success = await triggerEmergency(opts)
    setEmergencyLoading(false)
    if (success) setShowEmergencyModal(false)
    else setEmergencyError('Failed to send. Please contact your partner directly.')
  }

  const handleResolve = async (eventId: string) => {
    await resolveEmergency(eventId)
  }

  if (coupleLoading || pregLoading) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center">
        <LoadingCard message="Initializing DuoCare..." />
      </div>
    )
  }

  return (
    <div className="min-h-dvh pb-32">
      <AppHeader
        subtitle={pregnancyInfo ? `Week ${pregnancyInfo.currentWeek} • ${pregnancyInfo.trimester}` : undefined}
        onSettingsClick={() => navigate('/settings')}
      />

      <main className="max-w-lg mx-auto px-4 py-4 space-y-5">
        {/* Emergency Banners */}
        {emergencyEvents.map(event => (
          <EmergencyBanner
            key={event.id}
            senderName={event.triggered_by === user?.id ? 'You' : (partner?.display_name || 'Your partner')}
            isSender={event.triggered_by === user?.id}
            onResolve={() => handleResolve(event.id)}
          />
        ))}

        {emergencyError && (
          <div className="glass-dark border-emergency/30 rounded-[24px] p-4 text-center">
            <p className="text-sm font-bold text-emergency">{emergencyError}</p>
          </div>
        )}

        {/* Greeting / Primary Action */}
        <div className="glass rounded-[32px] p-7 shadow-2xl shadow-primary/5 relative overflow-hidden border-white/60">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl"></div>
          
          {isWife ? (
            <>
              <div className="flex items-center gap-2 mb-1 relative z-10">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                <p className="text-xl font-black text-text-dark tracking-tight">Baby is active!</p>
              </div>
              <p className="text-sm font-medium text-text-muted mb-5 relative z-10">Don't forget to record those precious kicks today.</p>
              <button onClick={() => navigate('/check-in')}
                className="w-full flex items-center justify-center gap-3 h-14 bg-primary shadow-[0_10px_25px_-5px_rgba(217,119,86,0.4)] text-white font-black rounded-2xl transition-all tap-effect text-base relative z-10">
                <Activity className="w-5 h-5" />
                Track Kick Record
              </button>
            </>
          ) : (
            <>
              <p className="text-xl font-black text-text-dark mb-1 relative z-10">Hi, {user?.user_metadata?.display_name || 'there'} 👋</p>
              <div className="flex items-center gap-2 mb-5 relative z-10">
                <div className="px-2 py-0.5 bg-primary/10 rounded-full">
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest">Live Updates</p>
                </div>
                <p className="text-sm font-medium text-text-muted">Today's Kicks: <strong className="text-primary">{todayKicks}</strong></p>
              </div>
              <button onClick={() => navigate('/check-in')}
                className="w-full flex items-center justify-center gap-3 h-14 bg-white/50 border-2 border-primary/20 text-primary font-black rounded-2xl transition-all tap-effect text-base relative z-10 backdrop-blur-sm">
                <Activity className="w-5 h-5" />
                View Activity Log
              </button>
            </>
          )}
        </div>

        {/* Pregnancy Week Card */}
        {pregnancyInfo && profile && (
          <div className="glass rounded-[32px] overflow-hidden shadow-xl shadow-black/5 border-white/60">
            <PregnancyWeekCard info={pregnancyInfo} dueDate={profile.due_date} />
          </div>
        )}

        <div className="grid grid-cols-1 gap-5">
          {/* Next Appointment */}
          <div className="glass rounded-[32px] p-1 border-white/60">
            <NextAppointmentCard appointment={nextAppointment} onViewAll={() => navigate('/appointments')} />
          </div>

          {/* Pending Tasks */}
          <div className="glass rounded-[32px] p-1 border-white/60">
            <PendingTasksCard tasks={pending} onViewAll={() => navigate('/tasks')} />
          </div>

          {/* Hospital Bag */}
          <div className="glass rounded-[32px] p-1 border-white/60">
            <HospitalBagCard
              completionPercent={completionPercent}
              checkedItems={checkedItems}
              totalItems={totalItems}
              onView={() => navigate('/hospital-bag')}
            />
          </div>
        </div>

        {/* Emergency Help Button */}
        <button onClick={() => setShowEmergencyModal(true)}
          className="w-full flex items-center justify-center gap-3 h-16 glass-dark border-emergency/20 text-emergency font-black rounded-[24px] shadow-xl shadow-emergency/5 tap-effect transition-all active:bg-emergency/5">
          <AlertTriangle className="w-6 h-6 animate-bounce" />
          <span className="tracking-tighter text-lg uppercase">Emergency Help</span>
        </button>
      </main>

      {/* Emergency Modal */}
      {showEmergencyModal && (
        <EmergencyHelpModal
          partnerName={partner?.display_name || 'your partner'}
          onConfirm={handleEmergency}
          onClose={() => setShowEmergencyModal(false)}
          loading={emergencyLoading}
        />
      )}

      <BottomNav activeRoute="/dashboard" />
    </div>
  )
}

