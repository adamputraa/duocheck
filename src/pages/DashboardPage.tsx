import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, startOfDay } from 'date-fns'
import { useAuth } from '@/hooks/useAuth'
import { useCouple } from '@/hooks/useCouple'
import { usePregnancy } from '@/hooks/usePregnancy'
import { useAppointments } from '@/hooks/useAppointments'
import { useHospitalBag } from '@/hooks/useHospitalBag'
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
  BriefcaseMedical,
  CalendarDays,
  ChevronRight,
  HeartPulse,
  MapPin,
  PhoneCall,
  ShieldCheck,
  Sparkles
} from 'lucide-react'

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
    const today = format(startOfDay(new Date()), 'yyyy-MM-dd')
    return kicks.filter(kick => format(startOfDay(new Date(kick.created_at)), 'yyyy-MM-dd') === today).length
  }, [kicks])

  const appointmentDate = nextAppointment ? new Date(`${nextAppointment.appointment_date}T00:00:00`) : null
  const pregnancyProgress = pregnancyInfo ? Math.min(100, Math.max(4, (pregnancyInfo.currentWeek / 40) * 100)) : 0

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
      <header className="relative overflow-hidden rounded-b-[38px] bg-primary px-4 pb-14 pt-5 text-white shadow-[0_18px_40px_-28px_rgba(240,95,69,0.95)]">
        <div className="mx-auto flex max-w-[560px] items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-3xl bg-white/18 flex items-center justify-center">
              <HeartPulse className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight leading-none">DuoCheck</h1>
              <p className="mt-1 text-sm font-semibold text-white/82">Your Pregnancy Companion</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="h-12 w-12 rounded-full bg-white text-primary flex items-center justify-center shadow-[0_16px_28px_-18px_rgba(17,24,39,0.45)]"
            aria-label="Settings"
          >
            <Bell className="h-6 w-6" />
          </button>
        </div>
      </header>

      <main className="mx-auto -mt-9 w-full max-w-[560px] space-y-5 px-4 pb-28">
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

        <section className="app-card p-5">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 shrink-0 rounded-full bg-primary-light flex items-center justify-center">
              <Baby className="h-11 w-11 text-primary" />
            </div>
            <button type="button" onClick={() => navigate('/settings')} className="flex min-h-0 flex-1 items-center justify-between gap-3 text-left">
              <div className="min-w-0">
                <h2 className="text-2xl font-black tracking-tight text-text-dark">
                  Good day, {userRole === 'wife' ? (user?.user_metadata?.display_name || 'Mama') : (user?.user_metadata?.display_name || 'Partner')}
                </h2>
                <p className="mt-1 text-sm font-semibold text-text-muted">
                  {pregnancyInfo ? `Week ${pregnancyInfo.currentWeek} - ${pregnancyInfo.trimester}` : 'Set up pregnancy details'}
                </p>
              </div>
              <ChevronRight className="h-6 w-6 shrink-0 text-text-muted" />
            </button>
          </div>

          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-primary-light">
            <div className="h-full rounded-full bg-primary" style={{ width: `${pregnancyProgress}%` }} />
          </div>
          <p className="mt-3 text-sm font-semibold text-text-muted">
            {pregnancyInfo ? `${pregnancyInfo.daysUntilDue} days to go` : 'Pregnancy progress appears here'}
          </p>
        </section>

        <KickSummaryChart kicks={kicks} />

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xl font-black tracking-tight text-text-dark">Health Snapshot</h3>
            <button type="button" onClick={() => navigate('/settings')} className="min-h-0 text-sm font-black text-primary">
              See All
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SnapshotCard icon={<HeartPulse className="h-6 w-6" />} label="Kick Count" value={todayKicks} detail="Today" />
            <SnapshotCard icon={<CalendarDays className="h-6 w-6" />} label="Due Date" value={pregnancyInfo?.daysUntilDue ?? '-'} detail="Days left" />
            <SnapshotCard icon={<BriefcaseMedical className="h-6 w-6" />} label="Bag" value={`${completionPercent}%`} detail={`${checkedItems}/${totalItems} ready`} />
            <SnapshotCard icon={<ShieldCheck className="h-6 w-6" />} label="Safety" value="Ready" detail="Quick guide" />
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-xl font-black tracking-tight text-text-dark">Today's Appointment</h3>
          <button
            type="button"
            onClick={() => navigate('/appointments')}
            className="app-card flex w-full items-center gap-4 p-4 text-left"
          >
            <div className="w-20 shrink-0 overflow-hidden rounded-2xl border border-primary/25 bg-white text-center">
              <div className="bg-primary px-2 py-1 text-sm font-black uppercase text-white">
                {appointmentDate ? format(appointmentDate, 'MMM') : 'CAL'}
              </div>
              <div className="py-2">
                <p className="text-4xl font-black leading-none text-text-dark">{appointmentDate ? format(appointmentDate, 'd') : '-'}</p>
                <p className="mt-1 text-sm font-black text-primary">{appointmentDate ? format(appointmentDate, 'EEE') : 'None'}</p>
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-primary">{nextAppointment?.appointment_time || 'No time set'}</p>
              <p className="mt-1 text-lg font-black text-text-dark">{nextAppointment?.title || 'No appointment scheduled'}</p>
              <p className="mt-1 text-sm font-semibold text-text-muted">{nextAppointment?.doctor_name || profile?.doctor_name || 'Add doctor details'}</p>
              <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-text-muted">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{nextAppointment?.location || profile?.hospital_name || 'No location yet'}</span>
              </p>
            </div>
            <ChevronRight className="h-7 w-7 shrink-0 rounded-full bg-primary-light p-1 text-primary" />
          </button>
        </section>

        <section className="rounded-[24px] bg-primary-light p-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 shrink-0 rounded-2xl bg-white text-primary flex items-center justify-center">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-black text-primary">Safety First</h3>
              <p className="text-sm font-semibold text-text-dark">If movement feels reduced, contact your doctor.</p>
            </div>
            <button
              type="button"
              onClick={() => profile?.doctor_phone ? window.location.href = `tel:${profile.doctor_phone}` : setShowEmergencyModal(true)}
              className="min-h-0 rounded-2xl bg-primary px-4 py-3 text-sm font-black text-white"
            >
              <PhoneCall className="inline h-4 w-4" /> Call
            </button>
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

function SnapshotCard({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string | number; detail: string }) {
  return (
    <div className="app-card min-h-[136px] p-4 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-primary">
        {icon}
      </div>
      <p className="mt-3 text-sm font-semibold text-text-muted">{label}</p>
      <p className="mt-1 text-2xl font-black text-text-dark">{value}</p>
      <p className="mt-1 text-xs font-bold text-success">
        <Sparkles className="inline h-3 w-3" /> {detail}
      </p>
    </div>
  )
}
