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
  Baby,
  Bell,
  CalendarDays,
  ChevronRight,
  Clock3,
  Footprints,
  HeartPulse,
  MapPin,
  PhoneCall,
  ShieldCheck,
  Stethoscope,
  UserRound
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

  const todayKicks = useMemo(() => {
    const today = format(startOfDay(new Date()), 'yyyy-MM-dd')
    return kicks.filter(kick => format(startOfDay(new Date(kick.created_at)), 'yyyy-MM-dd') === today).length
  }, [kicks])

  const pregnancyProgress = pregnancyInfo ? Math.min(100, Math.max(6, (pregnancyInfo.currentWeek / 40) * 100)) : 0
  const displayName = user?.user_metadata?.display_name || (userRole === 'wife' ? 'Mama' : 'Partner')
  const lastKickText = kicks[0] ? format(new Date(kicks[0].created_at), 'h:mm a') : 'No kicks yet'
  const dueDateLabel = profile?.due_date ? format(new Date(`${profile.due_date}T00:00:00`), 'd MMM yyyy') : 'Set due date'

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
    const success = await addKick()
    setRecordingKick(false)
    if (!success) navigate('/check-in')
  }

  if (coupleLoading || pregLoading) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-[#f3f7fa]">
        <LoadingCard message="Initializing DuoCheck..." />
      </div>
    )
  }

  return (
    <div className="app-page bg-[#f3f7fa]">
      <header className="mx-auto w-full max-w-[560px] px-5 pb-3 pt-5">
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => navigate('/dashboard')} className="min-h-0 text-left">
            <h1 className="text-[34px] font-black leading-none tracking-tight text-primary">DuoCheck</h1>
            <p className="mt-2 text-[15px] font-semibold text-[#687281]">
              Good morning, {displayName}
            </p>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/settings')}
              className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#1f2937] shadow-[0_12px_28px_-22px_rgba(17,24,39,0.6)]"
              aria-label="Notifications and settings"
            >
              <Bell className="h-6 w-6" />
              <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-white" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/settings')}
              className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary bg-white text-primary shadow-[0_12px_28px_-22px_rgba(17,24,39,0.6)]"
              aria-label="Profile"
            >
              <UserRound className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[560px] space-y-5 px-5 pb-28">
        {emergencyEvents.map(event => (
          <EmergencyBanner
            key={event.id}
            senderName={event.triggered_by === user?.id ? 'You' : (partner?.display_name || 'Your partner')}
            isSender={event.triggered_by === user?.id}
            onResolve={() => resolveEmergency(event.id)}
          />
        ))}

        {emergencyError && (
          <div className="rounded-[22px] border border-red-100 bg-red-50 p-4">
            <p className="text-sm font-bold text-emergency">{emergencyError}</p>
          </div>
        )}

        <section className="overflow-hidden rounded-[32px] border border-white bg-white shadow-[0_18px_44px_-34px_rgba(17,24,39,0.65)]">
          <div className="grid grid-cols-[1fr_auto] gap-4 p-5">
            <div>
              <p className="text-[15px] font-semibold text-[#687281]">You are</p>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-[56px] font-black leading-[0.85] tracking-tight text-primary sm:text-[68px]">
                  {pregnancyInfo?.currentWeek ?? '-'}
                </span>
                <div className="pb-1">
                  <p className="text-xl font-black leading-none text-primary sm:text-2xl">weeks</p>
                  <p className="mt-2 text-[15px] font-semibold text-[#687281]">
                    {pregnancyInfo?.trimester ?? 'Pregnancy setup'}
                  </p>
                </div>
              </div>
              <p className="mt-5 text-lg font-extrabold text-primary">
                {pregnancyInfo ? `${pregnancyInfo.daysUntilDue} days to go` : 'Add due date'}
              </p>
            </div>

            <div className="relative flex h-[118px] w-[118px] items-center justify-center rounded-full bg-[#ffe7e1] sm:h-[138px] sm:w-[138px]">
              <div className="absolute inset-3 rounded-full bg-[#ffd6ce]" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary text-white shadow-[0_16px_30px_-18px_rgba(240,95,69,0.9)] sm:h-[94px] sm:w-[94px]">
                <Baby className="h-12 w-12 sm:h-14 sm:w-14" />
              </div>
              <div className="absolute bottom-2 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#2dbfb6] text-white ring-4 ring-white">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="px-5 pb-5">
            <div className="h-2 overflow-hidden rounded-full bg-[#edf0f3]">
              <div className="h-full rounded-full bg-primary" style={{ width: `${pregnancyProgress}%` }} />
            </div>

            <div className="mt-5 grid grid-cols-3 divide-x divide-[#e8edf2] border-t border-[#edf0f3] pt-4">
              <HeroMetric icon={<CalendarDays className="h-5 w-5" />} label="Due date" value={dueDateLabel} tone="coral" />
              <HeroMetric icon={<HeartPulse className="h-5 w-5" />} label="Today" value={`${todayKicks} kicks`} tone="mint" />
              <HeroMetric icon={<Footprints className="h-5 w-5" />} label="Last kick" value={lastKickText} tone="amber" />
            </div>
          </div>
        </section>

        <KickSummaryChart
          kicks={kicks}
          compact
          showRecordAction
          onRecord={handleRecordKick}
          recording={recordingKick}
        />

        <section className="rounded-[28px] border border-white bg-white p-5 shadow-[0_18px_44px_-36px_rgba(17,24,39,0.58)]">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black tracking-tight text-[#171b23]">Today</h2>
            <button
              type="button"
              onClick={() => navigate('/appointments')}
              className="flex min-h-0 items-center gap-1 text-sm font-extrabold text-primary"
            >
              View all
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => navigate('/appointments')}
            className="mt-4 flex w-full items-center gap-4 rounded-[24px] bg-[#edfafa] p-4 text-left"
          >
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#d7f3ef] text-[#159e93]">
              <CalendarDays className="h-8 w-8" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-[#159e93]">Appointment</p>
              <p className="mt-1 truncate text-lg font-black text-[#171b23]">
                {nextAppointment?.title || 'No appointment scheduled'}
              </p>
              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold text-[#687281]">
                <span className="inline-flex items-center gap-1">
                  <Clock3 className="h-4 w-4" />
                  {nextAppointment?.appointment_time || 'Set time'}
                </span>
                <span className="inline-flex min-w-0 items-center gap-1">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span className="truncate">{nextAppointment?.location || profile?.hospital_name || 'Add location'}</span>
                </span>
              </p>
            </div>
            <ChevronRight className="h-6 w-6 shrink-0 text-[#687281]" />
          </button>
        </section>

        <section className="rounded-[28px] border border-white bg-white p-5 shadow-[0_18px_44px_-36px_rgba(17,24,39,0.58)]">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black tracking-tight text-[#171b23]">Safety</h2>
            <button
              type="button"
              onClick={() => navigate('/safety')}
              className="flex min-h-0 items-center gap-1 text-sm font-extrabold text-primary"
            >
              See all
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <QuickTile
              label="Emergency"
              icon={<ShieldCheck className="h-7 w-7" />}
              tone="bg-[#fff0ef] text-[#e84755]"
              onClick={() => setShowEmergencyModal(true)}
            />
            <QuickTile
              label="Hospitals"
              icon={<MapPin className="h-7 w-7" />}
              tone="bg-[#fff6e7] text-[#dc8500]"
              onClick={() => navigate('/safety')}
            />
            <QuickTile
              label="Call Doctor"
              icon={<PhoneCall className="h-7 w-7" />}
              tone="bg-[#eaf8f6] text-[#159e93]"
              onClick={() => profile?.doctor_phone ? window.location.href = `tel:${profile.doctor_phone}` : setShowEmergencyModal(true)}
            />
            <QuickTile
              label="Symptoms"
              icon={<Stethoscope className="h-7 w-7" />}
              tone="bg-[#eef5ff] text-[#1769aa]"
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

function HeroMetric({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: 'coral' | 'mint' | 'amber' }) {
  const toneClass = {
    coral: 'bg-[#fff0ef] text-primary',
    mint: 'bg-[#eaf8f6] text-[#159e93]',
    amber: 'bg-[#fff6e7] text-[#dc8500]'
  }[tone]

  return (
    <div className="min-w-0 px-3 first:pl-0 last:pr-0">
      <div className={`mb-2 flex h-10 w-10 items-center justify-center rounded-2xl ${toneClass}`}>
        {icon}
      </div>
      <p className="text-[13px] font-semibold leading-tight text-[#687281]">{label}</p>
      <p className="mt-1 truncate text-[15px] font-black leading-tight text-[#171b23]">{value}</p>
    </div>
  )
}

function QuickTile({ label, icon, tone, onClick }: { label: string; icon: React.ReactNode; tone: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[112px] flex-col items-center justify-center gap-3 rounded-[22px] px-2 text-center ${tone}`}
    >
      {icon}
      <span className="text-[13px] font-extrabold leading-tight">{label}</span>
    </button>
  )
}
