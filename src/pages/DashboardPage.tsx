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
    <div className="min-h-dvh pb-24">
      <AppHeader
        subtitle={pregnancyInfo ? `Week ${pregnancyInfo.currentWeek} • ${pregnancyInfo.trimester}` : undefined}
        onSettingsClick={() => navigate('/settings')}
      />

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
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
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center">
            <p className="text-sm font-bold text-emergency">{emergencyError}</p>
          </div>
        )}

        {/* Primary Action Card */}
        <div className="pristine-card p-6 relative overflow-hidden">
          <div className="flex flex-col relative z-10">
            {isWife ? (
              <>
                <h2 className="text-xl font-extrabold text-text-dark tracking-tight mb-1">Track Baby Kicks</h2>
                <p className="text-sm text-text-muted mb-5">Keep a record of your baby's activity today.</p>
                <button onClick={() => navigate('/check-in')}
                  className="w-full h-14 bg-primary text-white font-bold rounded-2xl transition-all tap-effect flex items-center justify-center gap-3 shadow-lg shadow-primary/20">
                  <Activity className="w-5 h-5" />
                  <span>Open Kick Tracker</span>
                </button>
              </>
            ) : (
              <>
                <h2 className="text-xl font-extrabold text-text-dark tracking-tight mb-1">Hi, {user?.user_metadata?.display_name || 'there'} 👋</h2>
                <p className="text-sm text-text-muted mb-5">Today's total kicks: <span className="text-primary font-bold">{todayKicks}</span></p>
                <button onClick={() => navigate('/check-in')}
                  className="w-full h-14 bg-gray-50 text-text-dark font-bold rounded-2xl transition-all tap-effect flex items-center justify-center gap-3 border border-gray-100">
                  <Activity className="w-5 h-5 text-primary" />
                  <span>View Activity Log</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Pregnancy Week Card */}
        {pregnancyInfo && profile && (
          <div className="pristine-card overflow-hidden">
            <PregnancyWeekCard info={pregnancyInfo} dueDate={profile.due_date} />
          </div>
        )}

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 gap-4">
          <NextAppointmentCard appointment={nextAppointment} onViewAll={() => navigate('/appointments')} />
          <PendingTasksCard tasks={pending} onViewAll={() => navigate('/tasks')} />
          <HospitalBagCard
            completionPercent={completionPercent}
            checkedItems={checkedItems}
            totalItems={totalItems}
            onView={() => navigate('/hospital-bag')}
          />
        </div>

        {/* Emergency Help Button */}
        <button onClick={() => setShowEmergencyModal(true)}
          className="w-full h-14 bg-red-50 text-emergency font-bold rounded-2xl border border-red-100 transition-all tap-effect flex items-center justify-center gap-3">
          <AlertTriangle className="w-5 h-5" />
          <span>EMERGENCY HELP</span>
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

