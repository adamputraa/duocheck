/**
 * Check-In page for DuoCare.
 * Only wife can submit pregnancy check-ins.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCouple } from '@/hooks/useCouple'
import { usePregnancy } from '@/hooks/usePregnancy'
import { isUrgentCheckin, getUrgentWarningMessage,
  FEELING_OPTIONS, MOOD_OPTIONS, ENERGY_OPTIONS, NAUSEA_OPTIONS,
  PAIN_OPTIONS, SWELLING_OPTIONS, BABY_MOVEMENT_OPTIONS,
  APPETITE_OPTIONS, SLEEP_OPTIONS, NEEDS_OPTIONS,
} from '@/lib/pregnancy'
import AppHeader from '@/components/AppHeader'
import BottomNav from '@/components/BottomNav'
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react'

type OptionItem = { value: string; label: string; emoji: string }

function PillSelector({ label, options, value, onChange }: {
  label: string; options: readonly OptionItem[]; value: string; onChange: (v: string) => void
}) {
  return (
    <div className="bg-card rounded-2xl border border-border-light p-4 shadow-sm">
      <p className="text-sm font-semibold text-text-dark mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button key={opt.value} type="button" onClick={() => onChange(opt.value)}
            className={`px-3 py-2 rounded-xl border text-sm font-medium transition min-h-[44px] ${
              value === opt.value
                ? 'bg-primary text-white border-primary'
                : 'bg-cream text-text-dark border-border-light active:bg-primary-light/50'
            }`}>
            {opt.emoji} {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function CheckInPage() {
  const { userRole } = useCouple()
  const { submitCheckin } = usePregnancy()
  const navigate = useNavigate()

  const [feeling, setFeeling] = useState('')
  const [mood, setMood] = useState('')
  const [energy, setEnergy] = useState('')
  const [nausea, setNausea] = useState('none')
  const [pain, setPain] = useState('none')
  const [painNote, setPainNote] = useState('')
  const [swelling, setSwelling] = useState('none')
  const [babyMovement, setBabyMovement] = useState('')
  const [appetite, setAppetite] = useState('')
  const [sleep, setSleep] = useState('')
  const [need, setNeed] = useState('none')
  const [note, setNote] = useState('')
  const [isUrgent, setIsUrgent] = useState(false)
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (userRole !== 'wife') {
    return (
      <div className="min-h-dvh bg-cream pb-24">
        <AppHeader />
        <main className="max-w-lg mx-auto px-4 py-6">
          <div className="bg-card rounded-2xl border border-border-light p-6 shadow-sm text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-base font-semibold text-text-dark mb-2">Check-In is for Wife</p>
            <p className="text-sm text-text-muted">Only the wife can submit pregnancy check-ins. You can view the latest update on Home.</p>
            <button onClick={() => navigate('/dashboard')}
              className="mt-4 px-6 py-3 bg-primary text-white rounded-xl font-semibold min-h-[44px]">
              Go to Home
            </button>
          </div>
        </main>
        <BottomNav activeRoute="/check-in" />
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-dvh bg-cream pb-24">
        <AppHeader />
        <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
          <div className="bg-card rounded-2xl border border-border-light p-6 shadow-sm text-center">
            <CheckCircle className="w-12 h-12 text-success mx-auto mb-3" />
            <p className="text-lg font-bold text-text-dark mb-1">Check-in submitted! 💕</p>
            <p className="text-sm text-text-muted">Your husband will see your update.</p>
          </div>
          {showWarning && (
            <div className="bg-emergency/10 border border-emergency/30 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-emergency shrink-0 mt-0.5" />
                <p className="text-sm text-emergency leading-relaxed">{getUrgentWarningMessage()}</p>
              </div>
            </div>
          )}
          <button onClick={() => navigate('/dashboard')}
            className="w-full h-12 bg-primary text-white font-semibold rounded-xl min-h-[44px]">
            Back to Home
          </button>
        </main>
        <BottomNav activeRoute="/check-in" />
      </div>
    )
  }

  const handleSubmit = async () => {
    if (!feeling) { setError('Please select how you are feeling.'); return }
    setSaving(true); setError(null)

    const checkinData = {
      overall_feeling: feeling, mood: mood || null, energy_level: energy || null,
      nausea_level: nausea, pain_type: pain, pain_note: painNote || null,
      swelling, baby_movement: babyMovement || null, appetite: appetite || null,
      sleep_quality: sleep || null, needs_from_husband: need, note: note || null,
      is_urgent: isUrgent,
    }

    const success = await submitCheckin(checkinData as any)
    setSaving(false)

    if (success) {
      setSubmitted(true)
      if (isUrgentCheckin(checkinData as any)) setShowWarning(true)
    } else {
      setError('Failed to submit. Please try again.')
    }
  }

  return (
    <div className="min-h-dvh bg-cream pb-24">
      <AppHeader subtitle="Daily Check-In" />
      <main className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {error && (
          <div className="bg-emergency/10 border border-emergency/20 text-emergency rounded-xl p-3 text-sm">{error}</div>
        )}

        <PillSelector label="How are you feeling? *" options={FEELING_OPTIONS} value={feeling} onChange={setFeeling} />
        <PillSelector label="Mood" options={MOOD_OPTIONS} value={mood} onChange={setMood} />
        <PillSelector label="Energy Level" options={ENERGY_OPTIONS} value={energy} onChange={setEnergy} />
        <PillSelector label="Nausea" options={NAUSEA_OPTIONS} value={nausea} onChange={setNausea} />
        <PillSelector label="Pain" options={PAIN_OPTIONS} value={pain} onChange={setPain} />

        {pain === 'other' && (
          <div className="bg-card rounded-2xl border border-border-light p-4 shadow-sm">
            <input type="text" placeholder="Describe pain..." value={painNote}
              onChange={(e) => setPainNote(e.target.value)}
              className="w-full h-12 px-3 bg-cream border border-border-light rounded-xl text-text-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>
        )}

        <PillSelector label="Swelling" options={SWELLING_OPTIONS} value={swelling} onChange={setSwelling} />
        <PillSelector label="Baby Movement" options={BABY_MOVEMENT_OPTIONS} value={babyMovement} onChange={setBabyMovement} />
        <PillSelector label="Appetite" options={APPETITE_OPTIONS} value={appetite} onChange={setAppetite} />
        <PillSelector label="Sleep Quality" options={SLEEP_OPTIONS} value={sleep} onChange={setSleep} />
        <PillSelector label="Need from Husband" options={NEEDS_OPTIONS} value={need} onChange={setNeed} />

        {/* Notes */}
        <div className="bg-card rounded-2xl border border-border-light p-4 shadow-sm">
          <p className="text-sm font-semibold text-text-dark mb-2">Notes</p>
          <textarea value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="Anything you want to share..." rows={3}
            className="w-full px-3 py-2 bg-cream border border-border-light rounded-xl text-text-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none" />
        </div>

        {/* Urgent checkbox */}
        <button type="button" onClick={() => setIsUrgent(!isUrgent)}
          className="flex items-center gap-3 w-full bg-card rounded-2xl border border-border-light p-4 shadow-sm min-h-[44px]">
          <div className={`w-6 h-6 rounded border-2 flex items-center justify-center shrink-0 ${
            isUrgent ? 'bg-emergency border-emergency' : 'border-border-light'
          }`}>
            {isUrgent && <span className="text-white text-xs font-bold">✓</span>}
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-text-dark">Mark as urgent</p>
            <p className="text-xs text-text-muted">This will highlight the check-in for your husband</p>
          </div>
        </button>

        <button onClick={handleSubmit} disabled={saving}
          className="w-full h-14 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2 text-base min-h-[44px]">
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
          {saving ? 'Submitting…' : 'Submit Check-In'}
        </button>
      </main>
      <BottomNav activeRoute="/check-in" />
    </div>
  )
}
