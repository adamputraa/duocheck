import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, startOfDay } from 'date-fns'
import { useAuth } from '@/hooks/useAuth'
import { useCouple } from '@/hooks/useCouple'
import { usePregnancy } from '@/hooks/usePregnancy'
import { useAppointments } from '@/hooks/useAppointments'
import { useRealtime } from '@/hooks/useRealtime'
import { useEmergency } from '@/hooks/useEmergency'
import { useKicks } from '@/hooks/useKicks'
import BottomNav from '@/components/BottomNav'
import EmergencyBanner from '@/components/EmergencyBanner'
import EmergencyHelpModal from '@/components/EmergencyHelpModal'
import KickSummaryChart from '@/components/KickSummaryChart'
import LoadingCard from '@/components/LoadingCard'
import {
  Bell,
  CalendarDays,
  ChevronRight,
  Clock3,
  MapPin,
  Ruler,
  ShoppingBag,
  Stethoscope,
  PhoneCall,
  Activity,
  Heart
} from 'lucide-react'

export default function DashboardPage() {
  const { user } = useAuth()
  const { partner, userRole, loading: coupleLoading } = useCouple()
  const { profile, pregnancyInfo, loading: pregLoading } = usePregnancy()
  const { nextAppointment } = useAppointments()
  const { emergencyEvents } = useRealtime()
  const { triggerEmergency, resolveEmergency } = useEmergency()
  const { kicks, addKick } = useKicks()
  const navigate = useNavigate()

  const [showEmergencyModal, setShowEmergencyModal] = useState(false)
  const [emergencyLoading, setEmergencyLoading] = useState(false)
  const [emergencyError, setEmergencyError] = useState<string | null>(null)
  const [recordingKick, setRecordingKick] = useState(false)

  const pregnancyProgress = pregnancyInfo ? Math.min(100, Math.max(6, (pregnancyInfo.currentWeek / 40) * 100)) : 0
  const displayName = user?.user_metadata?.display_name || (userRole === 'wife' ? 'Mama' : 'Partner')
  const partnerName = partner?.display_name || 'Partner'
  const dueDateLabel = profile?.due_date ? format(new Date(`${profile.due_date}T00:00:00`), 'd MMM yyyy') : '16 Aug 2026'

  const handleEmergency = async (opts: { message?: string; includeLocation?: boolean }) => {
    setEmergencyLoading(true)
    const success = await triggerEmergency(opts)
    setEmergencyLoading(false)
    if (success) setShowEmergencyModal(false)
    else setEmergencyError('Failed to send. Please contact your partner directly.')
  }

  const handleRecordKick = async () => {
    if (userRole !== 'wife') {
      navigate('/check-in')
      return
    }

    setRecordingKick(true)
    await addKick()
    setRecordingKick(false)
  }

  if (coupleLoading || pregLoading) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-[#F8FAFC]">
        <LoadingCard message="Initializing DuoCheck..." />
      </div>
    )
  }

  return (
    <div className="app-page bg-[#F8FAFC]">
      <header className="mx-auto w-full max-w-[560px] px-5 pb-4 pt-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black tracking-tight text-primary">DuoCheck</h1>

          <div className="flex items-center gap-4">
            <button
              type="button"
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#171B23] shadow-sm"
              aria-label="Notifications"
            >
              <Bell className="h-6 w-6" />
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-primary ring-2 ring-white" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/settings')}
              className="h-10 w-10 overflow-hidden rounded-full border-2 border-white shadow-md"
              aria-label="Profile"
            >
              <img src="/avatar.png" alt="Avatar" className="h-full w-full object-cover" />
            </button>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-[32px] font-bold leading-none tracking-tight text-[#171B23]">Good morning</h2>
          <p className="mt-2 flex items-center gap-1.5 text-[19px] font-medium text-[#687281]">
            {displayName} & {partnerName} <Heart className="h-4 w-4 fill-primary text-primary" />
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[560px] space-y-6 px-5 pb-32">
        {emergencyEvents.map(event => (
          <EmergencyBanner
            key={event.id}
            senderName={event.triggered_by === user?.id ? 'You' : (partner?.display_name || 'Your partner')}
            isSender={event.triggered_by === user?.id}
            onResolve={() => resolveEmergency(event.id)}
          />
        ))}

        {emergencyError && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
            <p className="text-sm font-bold text-emergency">{emergencyError}</p>
          </div>
        )}

        <section className="rounded-[32px] border border-white bg-white p-6 shadow-[0_12px_32px_-16px_rgba(17,24,39,0.1)]">
          <div className="flex justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#687281]">You are</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-6xl font-bold tracking-tight text-primary">
                  {pregnancyInfo?.currentWeek ?? '28'}
                </span>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-primary">weeks</span>
                  <span className="text-sm font-medium text-[#687281]">
                    {pregnancyInfo?.trimester ?? '2nd trimester'}
                  </span>
                </div>
              </div>
              <p className="mt-4 text-[15px] font-bold text-primary">
                {pregnancyInfo ? `${pregnancyInfo.daysUntilDue} days to go` : '84 days to go'}
              </p>
            </div>

            <div className="relative flex h-32 w-32 items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-[#FFF0EA] opacity-60" />
              <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-white shadow-lg">
                <img src="/baby_illustration.png" alt="Baby" className="h-full w-full object-cover" />
              </div>
              <div className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full bg-mint text-white ring-4 ring-white">
                <Activity className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[#F1F5F9]">
            <div className="h-full rounded-full bg-primary" style={{ width: `${pregnancyProgress}%` }} />
          </div>

          <div className="mt-8 grid grid-cols-3 gap-2">
            <MetricTile
              icon={<CalendarDays className="h-5 w-5" />}
              label="Due date"
              value={dueDateLabel}
              color="bg-[#FFF0EA] text-primary"
            />
            <MetricTile
              icon={<Ruler className="h-5 w-5" />}
              label="Baby length"
              value="37.0 cm"
              color="bg-[#EAF8F6] text-mint"
            />
            <MetricTile
              icon={<ShoppingBag className="h-5 w-5" />}
              label="Baby weight"
              value="1.15 kg"
              color="bg-[#FFF6E7] text-amber"
            />
          </div>
        </section>

        <KickSummaryChart
          kicks={kicks}
          onRecord={handleRecordKick}
          recording={recordingKick}
        />

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-bold text-[#171B23]">Today</h3>
            <button onClick={() => navigate('/appointments')} className="flex items-center gap-1 text-sm font-bold text-[#687281]">
              View all <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => navigate('/appointments')}
            className="flex w-full items-center gap-4 rounded-3xl bg-white p-4 shadow-sm border border-[#F1F5F9]"
          >
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-mint-light text-mint">
              <CalendarDays className="h-8 w-8" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-mint">Appointment</p>
              <p className="text-lg font-bold text-[#171B23]">
                {nextAppointment?.title || 'Antenatal Check-up'}
              </p>
              <div className="mt-1 flex items-center gap-4 text-sm font-medium text-[#687281]">
                <span className="flex items-center gap-1.5">
                  <Clock3 className="h-4 w-4" />
                  {nextAppointment?.appointment_time || '10:30 AM'}
                </span>
                <span className="flex items-center gap-1.5 truncate max-w-[150px]">
                  <MapPin className="h-4 w-4" />
                  {nextAppointment?.location || 'Klinik Kesihatan Wangsa Maju'}
                </span>
              </div>
            </div>
            <ChevronRight className="h-6 w-6 text-[#A0AEC0]" />
          </button>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-bold text-[#171B23]">Safety</h3>
            <button onClick={() => navigate('/safety')} className="flex items-center gap-1 text-sm font-bold text-primary">
              See all <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SafetyTile
              label="Emergency Contacts"
              icon={<PhoneCall className="h-7 w-7" />}
              color="bg-[#FFF0EA] text-[#F04438]"
              onClick={() => setShowEmergencyModal(true)}
            />
            <SafetyTile
              label="Nearby Hospitals"
              icon={<MapPin className="h-7 w-7" />}
              color="bg-[#FFF6E7] text-[#FDB022]"
              onClick={() => navigate('/safety')}
            />
            <SafetyTile
              label="24/7 Nurse Help"
              icon={<Activity className="h-7 w-7" />}
              color="bg-[#EAF8F6] text-[#2DBFB6]"
              onClick={() => navigate('/safety')}
            />
            <SafetyTile
              label="Symptoms Checker"
              icon={<Stethoscope className="h-7 w-7" />}
              color="bg-[#F0F5FF] text-[#2E90FA]"
              onClick={() => navigate('/safety')}
            />
          </div>
        </section>
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

function MetricTile({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-[11px] font-bold text-[#687281]">{label}</p>
        <p className="text-[13px] font-bold text-[#171B23]">{value}</p>
      </div>
    </div>
  )
}

function SafetyTile({ label, icon, color, onClick }: { label: string; icon: React.ReactNode; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-3 rounded-3xl p-4 text-center transition-all active:scale-95 ${color}`}
    >
      <div className="mb-1">{icon}</div>
      <span className="text-[11px] font-bold leading-tight">{label}</span>
    </button>
  )
}
