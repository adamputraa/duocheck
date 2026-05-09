/**
 * Dashboard page for DuoCare.
 * Role-based dashboard: wife sees check-in prompt, husband sees wife's status.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useCouple } from '@/hooks/useCouple'
import { usePregnancy } from '@/hooks/usePregnancy'
import { useAppointments } from '@/hooks/useAppointments'
import { useTasks } from '@/hooks/useTasks'
import { useHospitalBag } from '@/hooks/useHospitalBag'
import { useRealtime } from '@/hooks/useRealtime'
import { useEmergency } from '@/hooks/useEmergency'
import AppHeader from '@/components/AppHeader'
import BottomNav from '@/components/BottomNav'
import PregnancyWeekCard from '@/components/PregnancyWeekCard'
import WifeTodayCard from '@/components/WifeTodayCard'
import NeedFromHusbandCard from '@/components/NeedFromHusbandCard'
import NextAppointmentCard from '@/components/NextAppointmentCard'
import PendingTasksCard from '@/components/PendingTasksCard'
import HospitalBagCard from '@/components/HospitalBagCard'
import EmergencyBanner from '@/components/EmergencyBanner'
import EmergencyHelpModal from '@/components/EmergencyHelpModal'
import LoadingCard from '@/components/LoadingCard'
import { ClipboardPlus, AlertTriangle } from 'lucide-react'

export default function DashboardPage() {
  const { user } = useAuth()
  const { couple, partner, partnerSettings, userRole, loading: coupleLoading } = useCouple()
  const { profile, pregnancyInfo, latestCheckin, loading: pregLoading } = usePregnancy()
  const { nextAppointment } = useAppointments()
  const { pending } = useTasks()
  const { completionPercent, checkedItems, totalItems } = useHospitalBag()
  const { emergencyEvents } = useRealtime()
  const { triggerEmergency, resolveEmergency } = useEmergency()
  const navigate = useNavigate()

  const [showEmergencyModal, setShowEmergencyModal] = useState(false)
  const [emergencyLoading, setEmergencyLoading] = useState(false)
  const [emergencyError, setEmergencyError] = useState<string | null>(null)

  const isWife = userRole === 'wife'
  const sharingEnabled = partnerSettings?.share_status_with_partner ?? true

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
      <div className="min-h-dvh bg-cream pb-24">
        <AppHeader subtitle={pregnancyInfo ? `Week ${pregnancyInfo.currentWeek}` : undefined} />
        <main className="max-w-lg mx-auto px-4 py-6">
          <LoadingCard message="Loading dashboard…" />
        </main>
        <BottomNav activeRoute="/dashboard" />
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-cream pb-24">
      <AppHeader
        subtitle={pregnancyInfo ? `Week ${pregnancyInfo.currentWeek} • ${pregnancyInfo.trimester}` : undefined}
        onSettingsClick={() => navigate('/settings')}
      />

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
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
          <div className="bg-warning/10 border border-warning/30 rounded-xl p-3">
            <p className="text-sm text-amber-800">{emergencyError}</p>
          </div>
        )}

        {/* Greeting */}
        <div className="bg-card rounded-2xl border border-border-light p-5 shadow-sm">
          {isWife ? (
            <>
              <p className="text-lg font-bold text-text-dark mb-1">Track Baby Kicks 👶</p>
              <p className="text-sm text-text-muted mb-3">Record every time you feel your baby kick</p>
              <button onClick={() => navigate('/check-in')}
                className="w-full flex items-center justify-center gap-2 h-14 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition text-base min-h-[44px]">
                <ClipboardPlus className="w-5 h-5" />
                Track Baby Kicks
              </button>
            </>
          ) : (
            <>
              <p className="text-lg font-bold text-text-dark mb-1">Hi, {user?.user_metadata?.display_name || 'there'} 👋</p>
              <p className="text-sm text-text-muted">Here's how your wife is doing today</p>
            </>
          )}
        </div>

        {/* Pregnancy Week Card */}
        {pregnancyInfo && profile && (
          <PregnancyWeekCard info={pregnancyInfo} dueDate={profile.due_date} />
        )}

        {/* Wife Today (husband view) / Latest check-in (wife view) */}
        {!isWife && (
          <WifeTodayCard checkin={latestCheckin} sharingEnabled={sharingEnabled} />
        )}

        {/* Need from Husband */}
        {!isWife && latestCheckin && sharingEnabled && (
          <NeedFromHusbandCard need={latestCheckin.needs_from_husband} />
        )}

        {/* Next Appointment */}
        <NextAppointmentCard appointment={nextAppointment} onViewAll={() => navigate('/appointments')} />

        {/* Pending Tasks */}
        <PendingTasksCard tasks={pending} onViewAll={() => navigate('/tasks')} />

        {/* Hospital Bag */}
        <HospitalBagCard
          completionPercent={completionPercent}
          checkedItems={checkedItems}
          totalItems={totalItems}
          onView={() => navigate('/hospital-bag')}
        />

        {/* Emergency Help Button */}
        <button onClick={() => setShowEmergencyModal(true)}
          className="w-full flex items-center justify-center gap-2 h-14 bg-emergency text-white font-bold rounded-xl shadow-lg shadow-red-200 active:bg-red-600 transition min-h-[44px]">
          <AlertTriangle className="w-5 h-5" />
          Emergency Help
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
