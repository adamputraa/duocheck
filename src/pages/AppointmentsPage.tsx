/**
 * Appointments page for DuoCare.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppointments, type Appointment } from '@/hooks/useAppointments'
import { APPOINTMENT_TYPES } from '@/lib/pregnancy'
import AppHeader from '@/components/AppHeader'
import BottomNav from '@/components/BottomNav'
import { Plus, X, Loader2, Trash2, Edit3 } from 'lucide-react'

export default function AppointmentsPage() {
  const { upcoming, past, loading, addAppointment, updateAppointment, deleteAppointment } = useAppointments()
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<Appointment | null>(null)
  const [saving, setSaving] = useState(false)

  const [title, setTitle] = useState('')
  const [type, setType] = useState('checkup')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [location, setLocation] = useState('')
  const [doctor, setDoctor] = useState('')
  const [notes, setNotes] = useState('')
  const [husbandAttending, setHusbandAttending] = useState(false)

  const resetForm = () => {
    setTitle(''); setType('checkup'); setDate(''); setTime('')
    setLocation(''); setDoctor(''); setNotes(''); setHusbandAttending(false)
    setEditItem(null); setShowForm(false)
  }

  const openEdit = (a: Appointment) => {
    setEditItem(a); setTitle(a.title); setType(a.appointment_type)
    setDate(a.appointment_date); setTime(a.appointment_time || '')
    setLocation(a.location || ''); setDoctor(a.doctor_name || '')
    setNotes(a.notes || ''); setHusbandAttending(a.husband_attending)
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!title || !date) return
    setSaving(true)
    const data = {
      title, appointment_type: type, appointment_date: date,
      appointment_time: time || null, location: location || null,
      doctor_name: doctor || null, notes: notes || null,
      husband_attending: husbandAttending,
    }
    if (editItem) await updateAppointment(editItem.id, data)
    else await addAppointment(data)
    setSaving(false); resetForm()
  }

  const inputCls = 'w-full h-12 px-3 bg-cream border border-border-light rounded-xl text-text-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition'

  const renderCard = (a: Appointment) => {
    const d = new Date(a.appointment_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
    const typeLabel = APPOINTMENT_TYPES.find(t => t.value === a.appointment_type)?.label || a.appointment_type
    return (
      <div key={a.id} className="bg-card rounded-2xl border border-border-light p-4 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-dark truncate">{a.title}</p>
            <p className="text-xs text-text-muted">{d}{a.appointment_time ? ` • ${a.appointment_time.slice(0,5)}` : ''}</p>
            <div className="flex flex-wrap gap-1.5 mt-1">
              <span className="text-[10px] bg-primary-light text-primary-dark px-2 py-0.5 rounded-full font-medium">{typeLabel}</span>
              {a.husband_attending && <span className="text-[10px] bg-success/10 text-success px-2 py-0.5 rounded-full font-medium">Husband</span>}
            </div>
            {a.location && <p className="text-xs text-text-muted mt-1">📍 {a.location}</p>}
          </div>
          <div className="flex gap-1 shrink-0">
            <button onClick={() => openEdit(a)} className="w-9 h-9 flex items-center justify-center rounded-lg active:bg-cream">
              <Edit3 className="w-4 h-4 text-text-muted" />
            </button>
            <button onClick={() => deleteAppointment(a.id)} className="w-9 h-9 flex items-center justify-center rounded-lg active:bg-cream">
              <Trash2 className="w-4 h-4 text-emergency" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-cream pb-24">
      <AppHeader subtitle="Appointments" onSettingsClick={() => navigate('/settings')} />
      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <button onClick={() => { resetForm(); setShowForm(true) }}
          className="w-full flex items-center justify-center gap-2 h-12 bg-primary text-white font-semibold rounded-xl min-h-[44px]">
          <Plus className="w-5 h-5" /> Add Appointment
        </button>

        {loading && <div className="text-center py-8 text-text-muted animate-pulse">Loading…</div>}

        {!loading && upcoming.length === 0 && past.length === 0 && (
          <div className="bg-card rounded-2xl border border-border-light p-6 shadow-sm text-center">
            <p className="text-4xl mb-3">📅</p>
            <p className="text-sm text-text-muted">No appointments yet.</p>
          </div>
        )}

        {upcoming.length > 0 && (
          <>
            <h2 className="text-sm font-semibold text-text-muted">Upcoming</h2>
            <div className="space-y-2">{upcoming.map(renderCard)}</div>
          </>
        )}

        {past.length > 0 && (
          <>
            <h2 className="text-sm font-semibold text-text-muted mt-4">Past</h2>
            <div className="space-y-2">{past.map(renderCard)}</div>
          </>
        )}
      </main>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-text-dark">{editItem ? 'Edit' : 'New'} Appointment</h3>
              <button onClick={resetForm} className="w-10 h-10 flex items-center justify-center">
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="Title *" value={title} onChange={e => setTitle(e.target.value)} className={inputCls} />
              <select value={type} onChange={e => setType(e.target.value)} className={inputCls}>
                {APPOINTMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} />
              <input type="time" value={time} onChange={e => setTime(e.target.value)} className={inputCls} />
              <input type="text" placeholder="Location" value={location} onChange={e => setLocation(e.target.value)} className={inputCls} />
              <input type="text" placeholder="Doctor name" value={doctor} onChange={e => setDoctor(e.target.value)} className={inputCls} />
              <textarea placeholder="Notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                className="w-full px-3 py-2 bg-cream border border-border-light rounded-xl text-text-dark text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <button type="button" onClick={() => setHusbandAttending(!husbandAttending)}
                className="flex items-center gap-2 min-h-[44px]">
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${husbandAttending ? 'bg-primary border-primary' : 'border-border-light'}`}>
                  {husbandAttending && <span className="text-white text-xs">✓</span>}
                </div>
                <span className="text-sm text-text-dark">Husband attending</span>
              </button>
              <button onClick={handleSave} disabled={saving || !title || !date}
                className="w-full h-12 bg-primary text-white font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav activeRoute="/appointments" />
    </div>
  )
}
