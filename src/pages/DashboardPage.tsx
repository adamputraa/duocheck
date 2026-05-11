import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { startOfDay, isAfter } from 'date-fns'
import { useAuth } from '@/hooks/useAuth'
import { useCouple } from '@/hooks/useCouple'
import { usePregnancy } from '@/hooks/usePregnancy'
import { useAppointments } from '@/hooks/useAppointments'
import { useHospitalBag } from '@/hooks/useHospitalBag'
import { useRealtime } from '@/hooks/useRealtime'
import { useEmergency } from '@/hooks/useEmergency'
import { useKicks } from '@/hooks/useKicks'
import AppHeader from '@/components/AppHeader'
import BottomNav from '@/components/BottomNav'
import EmergencyBanner from '@/components/EmergencyBanner'
import EmergencyHelpModal from '@/components/EmergencyHelpModal'
import KickSummaryChart from '@/components/KickSummaryChart'
import LoadingCard from '@/components/LoadingCard'
import { Activity, AlertTriangle, BriefcaseMedical, CalendarDays, ChevronRight, ShieldAlert } from 'lucide-react'

export default function DashboardPage() {
  const { user } = useAuth()
  const { partner, userRole, loading: coupleLoading } = useCouple()
  const { profile, pregnancyInfo, loading: pregLoading } = usePregnancy()
  const { nextAppointment } = useAppointments()
  const { completionPercent, checkedItems, totalItems } = useHospitalBag()
  const { emergencyEvents } = useRealtime()
  const { triggerEmergency, resolveEmergency } = useEmergency()
  const { kicks } = useKicks()
  const navigate = useNavigate()

  const [showEmergencyModal, setShowEmergencyModal] = useState(false)
  const [emergencyLoading, setEmergencyLoading] = useState(false)
  const [emergencyError, setEmergencyError] = useState<string | null>(null)

  const todayKicks = useMemo(() => {
    const today = startOfDay(new Date())
    return kicks.filter(kick => isAfter(new Date(kick.created_at), today)).length
  }, [kicks])

  const appointmentLabel = nextAppointment
    ? new Date(nextAppointment.appointment_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
    : 'No appointment'

  const handleEmergency = async (opts: { message?: string; includeLocation?: boolean }) => {
    setEmergencyLoading(true)
    const success = await triggerEmergency(opts)
    setEmergencyLoading(false)
    if (success) setShowEmergencyModal(false)
    else setEmergencyError('Failed to send. Please contact your partner directly.')
  }

  if (coupleLoading || pregLoading) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center">
        <LoadingCard message="Initializing DuoCare..." />
      </div>
    )
  }

  return (
    <div className="app-page">
      <AppHeader
        subtitle={pregnancyInfo ? `Week ${pregnancyInfo.currentWeek} - ${pregnancyInfo.trimester}` : 'Today'}
        onSettingsClick={() => navigate('/settings')}
      />

      <main className="app-main space-y-5">
        {emergencyEvents.map(event => (
          <EmergencyBanner
            key={event.id}
            senderName={event.triggered_by === user?.id ? 'You' : (partner?.display_name || 'Your partner')}
            isSender={event.triggered_by === user?.id}
            onResolve={() => resolveEmergency(event.id)}
          />
        ))}

        {emergencyError && (
          <div className="rounded-2xl bg-red-50 border border-red-100 p-4">
            <p className="text-sm font-bold text-emergency">{emergencyError}</p>
          </div>
        )}

        <section className="rounded-[30px] bg-white border border-border-light p-5 shadow-[0_18px_42px_-32px_rgba(17,24,39,0.52)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold text-primary uppercase tracking-[0.16em]">Health Summary</p>
              <h2 className="text-2xl font-black tracking-tight text-text-dark mt-1">
                {userRole === 'wife' ? 'Today with baby' : `Hi, ${user?.user_metadata?.display_name || 'there'}`}
              </h2>
              <p className="text-sm font-semibold text-text-muted mt-2">
                {pregnancyInfo ? `Week ${pregnancyInfo.currentWeek} - ${pregnancyInfo.trimester}` : 'Your pregnancy overview'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/check-in')}
              className="min-h-0 rounded-full bg-primary text-white px-4 py-2 text-sm font-black shadow-[0_14px_24px_-18px_rgba(240,95,69,0.9)]"
            >
              Record
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-5">
            <HeroMetric label="Today" value={todayKicks} tone="primary" />
            <HeroMetric label="Days Due" value={pregnancyInfo?.daysUntilDue ?? '-'} />
            <HeroMetric label="Bag" value={`${completionPercent}%`} />
          </div>
        </section>

        <KickSummaryChart kicks={kicks} />

        <section className="grid grid-cols-3 gap-3">
          <ActionTile
            title="Kicks"
            detail={`${todayKicks} today`}
            icon={<Activity className="w-5 h-5" />}
            onClick={() => navigate('/check-in')}
          />
          <ActionTile
            title="Calendar"
            detail={appointmentLabel}
            icon={<CalendarDays className="w-5 h-5" />}
            onClick={() => navigate('/appointments')}
          />
          <ActionTile
            title="Hospital Bag"
            detail={`${checkedItems}/${totalItems} packed`}
            icon={<BriefcaseMedical className="w-5 h-5" />}
            onClick={() => navigate('/hospital-bag')}
          />
        </section>

        {pregnancyInfo && profile && (
          <section className="app-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="app-section-title">Pregnancy</p>
                <h3 className="text-xl font-black text-text-dark mt-1">Week {pregnancyInfo.currentWeek}</h3>
                <p className="text-sm text-text-muted mt-1">{pregnancyInfo.trimester}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-primary">{pregnancyInfo.daysUntilDue}</p>
                <p className="text-[10px] font-extrabold text-text-muted uppercase">days to due</p>
              </div>
            </div>
            <div className="mt-4 h-3 rounded-full bg-cream overflow-hidden">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.min(100, Math.max(4, (pregnancyInfo.currentWeek / 40) * 100))}%` }}
              />
            </div>
          </section>
        )}

        <button onClick={() => setShowEmergencyModal(true)}
          className="w-full min-h-14 rounded-2xl bg-red-50 border border-red-100 text-emergency font-black flex items-center justify-center gap-3">
          <AlertTriangle className="w-5 h-5" />
          Emergency Help
        </button>

        <button onClick={() => navigate('/safety')}
          className="w-full min-h-12 rounded-2xl bg-white border border-border-light text-text-dark font-black flex items-center justify-center gap-3">
          <ShieldAlert className="w-5 h-5 text-primary" />
          View safety guide
        </button>
      </main>

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

function HeroMetric({ label, value, tone = 'neutral' }: { label: string; value: string | number; tone?: 'primary' | 'neutral' }) {
  return (
    <div className={`rounded-2xl px-3 py-3 ${tone === 'primary' ? 'bg-primary text-white' : 'bg-cream text-text-dark'}`}>
      <p className="text-2xl font-black">{value}</p>
      <p className={`text-[10px] font-extrabold uppercase leading-tight mt-1 ${tone === 'primary' ? 'text-white/80' : 'text-text-muted'}`}>
        {label}
      </p>
    </div>
  )
}

function ActionTile({ title, detail, icon, onClick }: { title: string; detail: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="app-card p-3 text-left min-h-[112px] flex flex-col justify-between active:bg-primary-light">
      <div className="flex items-center justify-between gap-2">
        <span className="w-10 h-10 rounded-2xl bg-primary-light text-primary flex items-center justify-center">{icon}</span>
        <ChevronRight className="w-4 h-4 text-text-muted" />
      </div>
      <div>
        <p className="text-sm font-black text-text-dark">{title}</p>
        <p className="text-xs font-semibold text-text-muted mt-1">{detail}</p>
      </div>
    </button>
  )
}
