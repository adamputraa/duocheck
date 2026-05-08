/**
 * Pregnancy Setup page for DuoCare.
 * Shown after pairing if no pregnancy profile exists.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useCouple } from '@/hooks/useCouple'
import { usePregnancy } from '@/hooks/usePregnancy'
import { useHospitalBag } from '@/hooks/useHospitalBag'
import { Baby, Loader2 } from 'lucide-react'

export default function PregnancySetupPage() {
  const { user } = useAuth()
  const { refreshCouple } = useCouple()
  const { createProfile } = usePregnancy()
  const { seedDefaults } = useHospitalBag()
  const navigate = useNavigate()

  const [dueDate, setDueDate] = useState('')
  const [lmp, setLmp] = useState('')
  const [pregnancyType, setPregnancyType] = useState('unknown')
  const [hospitalName, setHospitalName] = useState('')
  const [clinicName, setClinicName] = useState('')
  const [doctorName, setDoctorName] = useState('')
  const [doctorPhone, setDoctorPhone] = useState('')
  const [emergContactName, setEmergContactName] = useState('')
  const [emergContactPhone, setEmergContactPhone] = useState('')
  const [bloodType, setBloodType] = useState('')
  const [riskNotes, setRiskNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dueDate) { setError('Due date is required.'); return }
    setSaving(true); setError(null)

    const success = await createProfile({
      due_date: dueDate,
      last_menstrual_period: lmp || null,
      pregnancy_type: pregnancyType,
      hospital_name: hospitalName || null,
      clinic_name: clinicName || null,
      doctor_name: doctorName || null,
      doctor_phone: doctorPhone || null,
      emergency_contact_name: emergContactName || null,
      emergency_contact_phone: emergContactPhone || null,
      blood_type: bloodType || null,
      risk_notes: riskNotes || null,
    } as any)

    if (success) {
      await seedDefaults()
      await refreshCouple()
      navigate('/dashboard')
    } else {
      setError('Failed to save. Please try again.')
    }
    setSaving(false)
  }

  const inputClass = 'w-full h-12 px-3 bg-cream border border-border-light rounded-xl text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition text-sm'

  return (
    <div className="min-h-dvh bg-cream">
      <header className="sticky top-0 z-50 px-4 py-3" style={{ background: 'linear-gradient(135deg, #D97756 0%, #B85C38 100%)' }}>
        <h1 className="text-xl font-bold text-white">Pregnancy Setup</h1>
        <p className="text-xs text-white/70">Let's set up your pregnancy profile</p>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary-light">
            <Baby className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-base font-semibold text-text-dark">Welcome to DuoCare</p>
            <p className="text-xs text-text-muted">Fill in as much as you know. You can update later.</p>
          </div>
        </div>

        {error && (
          <div className="bg-emergency/10 border border-emergency/20 text-emergency rounded-xl p-3 mb-4 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Due Date */}
          <div className="bg-card rounded-2xl border border-border-light p-4 shadow-sm">
            <label className="block text-sm font-semibold text-text-dark mb-2">Due Date *</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required className={inputClass} />
          </div>

          {/* LMP */}
          <div className="bg-card rounded-2xl border border-border-light p-4 shadow-sm">
            <label className="block text-sm font-semibold text-text-dark mb-1">Last Menstrual Period</label>
            <p className="text-xs text-text-muted mb-2">Optional — helps estimate pregnancy week</p>
            <input type="date" value={lmp} onChange={(e) => setLmp(e.target.value)} className={inputClass} />
          </div>

          {/* Pregnancy Type */}
          <div className="bg-card rounded-2xl border border-border-light p-4 shadow-sm">
            <label className="block text-sm font-semibold text-text-dark mb-2">Pregnancy Type</label>
            <div className="flex gap-2">
              {[{ v: 'single', l: 'Single' }, { v: 'twins', l: 'Twins' }, { v: 'unknown', l: 'Unknown' }].map(o => (
                <button key={o.v} type="button" onClick={() => setPregnancyType(o.v)}
                  className={`flex-1 px-3 py-2.5 rounded-xl border text-sm font-medium transition min-h-[44px] ${
                    pregnancyType === o.v ? 'bg-primary text-white border-primary' : 'bg-cream text-text-dark border-border-light'
                  }`}>{o.l}</button>
              ))}
            </div>
          </div>

          {/* Hospital & Clinic */}
          <div className="bg-card rounded-2xl border border-border-light p-4 shadow-sm space-y-3">
            <p className="text-sm font-semibold text-text-dark">Hospital & Clinic</p>
            <input type="text" placeholder="Hospital name" value={hospitalName} onChange={(e) => setHospitalName(e.target.value)} className={inputClass} />
            <input type="text" placeholder="Clinic name" value={clinicName} onChange={(e) => setClinicName(e.target.value)} className={inputClass} />
          </div>

          {/* Doctor */}
          <div className="bg-card rounded-2xl border border-border-light p-4 shadow-sm space-y-3">
            <p className="text-sm font-semibold text-text-dark">Doctor</p>
            <input type="text" placeholder="Doctor name" value={doctorName} onChange={(e) => setDoctorName(e.target.value)} className={inputClass} />
            <input type="tel" placeholder="Doctor phone" value={doctorPhone} onChange={(e) => setDoctorPhone(e.target.value)} className={inputClass} />
          </div>

          {/* Emergency Contact */}
          <div className="bg-card rounded-2xl border border-border-light p-4 shadow-sm space-y-3">
            <p className="text-sm font-semibold text-text-dark">Emergency Contact</p>
            <input type="text" placeholder="Contact name" value={emergContactName} onChange={(e) => setEmergContactName(e.target.value)} className={inputClass} />
            <input type="tel" placeholder="Contact phone" value={emergContactPhone} onChange={(e) => setEmergContactPhone(e.target.value)} className={inputClass} />
          </div>

          {/* Blood Type & Notes */}
          <div className="bg-card rounded-2xl border border-border-light p-4 shadow-sm space-y-3">
            <p className="text-sm font-semibold text-text-dark">Additional Info</p>
            <input type="text" placeholder="Blood type (e.g. O+)" value={bloodType} onChange={(e) => setBloodType(e.target.value)} className={inputClass} />
            <textarea placeholder="Notes or risk factors (optional)" value={riskNotes} onChange={(e) => setRiskNotes(e.target.value)} rows={3}
              className="w-full px-3 py-2 bg-cream border border-border-light rounded-xl text-text-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none" />
          </div>

          <button type="submit" disabled={saving}
            className="w-full h-14 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2 text-base">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            {saving ? 'Saving…' : 'Start DuoCare'}
          </button>
        </form>
      </main>
    </div>
  )
}
