import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppointments, type Appointment } from '@/hooks/useAppointments'
import { APPOINTMENT_TYPES } from '@/lib/pregnancy'
import AppHeader from '@/components/AppHeader'
import BottomNav from '@/components/BottomNav'
import { ChevronLeft, ChevronRight, Clock, Edit3, Loader2, MapPin, Plus, Trash2, X } from 'lucide-react'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function dateFromKey(key: string) {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function keyFromDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDateLabel(key: string) {
  return dateFromKey(key).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function buildMonthGrid(monthDate: Date) {
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const startOffset = (first.getDay() + 6) % 7
  const days: Array<{ key: string; date: Date; inMonth: boolean }> = []

  const start = new Date(first)
  start.setDate(first.getDate() - startOffset)

  for (let i = 0; i < 42; i++) {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    days.push({
      key: keyFromDate(date),
      date,
      inMonth: date.getMonth() === monthDate.getMonth(),
    })
  }

  const lastRow = days.slice(35)
  return lastRow.every(day => !day.inMonth) ? days.slice(0, 35) : days
}

export default function AppointmentsPage() {
  const { appointments, upcoming, loading, addAppointment, updateAppointment, deleteAppointment } = useAppointments()
  const navigate = useNavigate()
  const todayKey = keyFromDate(new Date())

  const [monthCursor, setMonthCursor] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState(todayKey)
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

  const appointmentMap = useMemo(() => {
    const map = new Map<string, Appointment[]>()
    appointments.forEach(appointment => {
      const list = map.get(appointment.appointment_date) ?? []
      list.push(appointment)
      map.set(appointment.appointment_date, list)
    })
    return map
  }, [appointments])

  const calendarDays = useMemo(() => buildMonthGrid(monthCursor), [monthCursor])
  const selectedAppointments = appointmentMap.get(selectedDate) ?? []
  const upcoming30Days = useMemo(() => {
    const limit = new Date()
    limit.setDate(limit.getDate() + 30)
    const limitKey = keyFromDate(limit)
    return upcoming.filter(appointment => appointment.appointment_date <= limitKey)
  }, [upcoming])
  const monthTitle = monthCursor.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  const resetForm = () => {
    setTitle('')
    setType('checkup')
    setDate('')
    setTime('')
    setLocation('')
    setDoctor('')
    setNotes('')
    setHusbandAttending(false)
    setEditItem(null)
    setShowForm(false)
  }

  const openCreate = (dateKey = selectedDate) => {
    resetForm()
    setDate(dateKey)
    setShowForm(true)
  }

  const openEdit = (appointment: Appointment) => {
    setEditItem(appointment)
    setTitle(appointment.title)
    setType(appointment.appointment_type)
    setDate(appointment.appointment_date)
    setTime(appointment.appointment_time || '')
    setLocation(appointment.location || '')
    setDoctor(appointment.doctor_name || '')
    setNotes(appointment.notes || '')
    setHusbandAttending(appointment.husband_attending)
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!title || !date) return
    setSaving(true)
    const data = {
      title,
      appointment_type: type,
      appointment_date: date,
      appointment_time: time || null,
      location: location || null,
      doctor_name: doctor || null,
      notes: notes || null,
      husband_attending: husbandAttending,
    }
    if (editItem) await updateAppointment(editItem.id, data)
    else await addAppointment(data)
    setSelectedDate(date)
    setMonthCursor(dateFromKey(date))
    setSaving(false)
    resetForm()
  }

  const moveMonth = (delta: number) => {
    setMonthCursor(current => new Date(current.getFullYear(), current.getMonth() + delta, 1))
  }

  const renderAppointment = (appointment: Appointment) => {
    const typeLabel = APPOINTMENT_TYPES.find(t => t.value === appointment.appointment_type)?.label || appointment.appointment_type
    return (
      <div key={appointment.id} className="app-card p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-black text-text-dark truncate">{appointment.title}</p>
            <p className="text-xs font-bold text-primary mt-1">{typeLabel}</p>
          </div>
          <div className="flex gap-1 shrink-0">
            <button onClick={() => openEdit(appointment)} className="w-9 h-9 rounded-xl bg-cream flex items-center justify-center" aria-label="Edit appointment">
              <Edit3 className="w-4 h-4 text-text-muted" />
            </button>
            <button onClick={() => deleteAppointment(appointment.id)} className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center" aria-label="Delete appointment">
              <Trash2 className="w-4 h-4 text-emergency" />
            </button>
          </div>
        </div>
        <div className="mt-3 space-y-2">
          {appointment.appointment_time && (
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <Clock className="w-4 h-4" />
              <span>{appointment.appointment_time.slice(0, 5)}</span>
            </div>
          )}
          {appointment.location && (
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <MapPin className="w-4 h-4" />
              <span>{appointment.location}</span>
            </div>
          )}
          {appointment.doctor_name && <p className="text-xs text-text-muted">Doctor: {appointment.doctor_name}</p>}
          {appointment.husband_attending && <p className="text-xs font-bold text-success">Partner attending</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="app-page">
      <AppHeader subtitle="Calendar" onSettingsClick={() => navigate('/settings')} />
      <main className="app-main space-y-5">
        <section className="app-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="app-section-title">Appointments</p>
              <h2 className="text-2xl font-black text-text-dark tracking-tight mt-1">{monthTitle}</h2>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => moveMonth(-1)} className="w-10 h-10 rounded-2xl bg-cream flex items-center justify-center" aria-label="Previous month">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={() => moveMonth(1)} className="w-10 h-10 rounded-2xl bg-cream flex items-center justify-center" aria-label="Next month">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mt-5">
            {WEEKDAYS.map(day => (
              <div key={day} className="text-center text-[10px] font-black text-text-muted uppercase py-1">{day}</div>
            ))}
            {calendarDays.map(day => {
              const count = appointmentMap.get(day.key)?.length ?? 0
              const isSelected = day.key === selectedDate
              const isToday = day.key === todayKey
              return (
                <button
                  key={day.key}
                  onClick={() => setSelectedDate(day.key)}
                  onDoubleClick={() => openCreate(day.key)}
                  className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 text-sm font-black transition ${
                    isSelected
                      ? 'bg-primary text-white shadow-[0_10px_18px_-14px_rgba(217,119,86,0.85)]'
                      : day.inMonth
                        ? 'bg-white text-text-dark active:bg-primary-light'
                        : 'bg-transparent text-text-muted/35'
                  } ${isToday && !isSelected ? 'ring-2 ring-primary/30' : ''}`}
                  aria-label={`${day.date.getDate()} ${count ? `${count} appointments` : 'no appointments'}`}
                >
                  <span>{day.date.getDate()}</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${count ? (isSelected ? 'bg-white' : 'bg-primary') : 'bg-transparent'}`} />
                </button>
              )
            })}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="app-section-title">Selected Day</p>
              <h3 className="text-lg font-black text-text-dark mt-1">{formatDateLabel(selectedDate)}</h3>
            </div>
            <button onClick={() => openCreate(selectedDate)} className="btn-primary px-4 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          {loading && <div className="app-card p-5 text-sm text-text-muted animate-pulse">Loading calendar...</div>}

          {!loading && selectedAppointments.length === 0 && (
            <div className="app-card p-5">
              <p className="text-sm font-bold text-text-dark">No appointment on this day.</p>
              <p className="text-xs text-text-muted mt-1">Tap Add or double-tap a date to schedule one.</p>
            </div>
          )}

          {!loading && selectedAppointments.map(renderAppointment)}
        </section>

        {!loading && upcoming30Days.length > 0 && (
          <section className="space-y-3">
            <p className="app-section-title">Next 30 Days</p>
            {upcoming30Days.slice(0, 3).map(renderAppointment)}
          </section>
        )}
      </main>

      {showForm && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/45">
          <div className="bg-white rounded-t-[28px] sm:rounded-[28px] w-full max-w-md p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-black text-text-dark">{editItem ? 'Edit appointment' : 'New appointment'}</h3>
              <button onClick={resetForm} className="w-10 h-10 rounded-2xl bg-cream flex items-center justify-center" aria-label="Close">
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="Title" value={title} onChange={event => setTitle(event.target.value)} className="app-input" />
              <select value={type} onChange={event => setType(event.target.value)} className="app-input">
                {APPOINTMENT_TYPES.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
              <input type="date" value={date} onChange={event => setDate(event.target.value)} className="app-input" />
              <input type="time" value={time} onChange={event => setTime(event.target.value)} className="app-input" />
              <input type="text" placeholder="Location" value={location} onChange={event => setLocation(event.target.value)} className="app-input" />
              <input type="text" placeholder="Doctor name" value={doctor} onChange={event => setDoctor(event.target.value)} className="app-input" />
              <textarea placeholder="Notes" value={notes} onChange={event => setNotes(event.target.value)} rows={3}
                className="app-input min-h-[88px] py-3 resize-none" />
              <button type="button" onClick={() => setHusbandAttending(!husbandAttending)}
                className="w-full min-h-12 rounded-2xl bg-cream px-4 flex items-center justify-between">
                <span className="text-sm font-bold text-text-dark">Partner attending</span>
                <span className={`w-11 h-6 rounded-full p-1 transition ${husbandAttending ? 'bg-primary' : 'bg-gray-300'}`}>
                  <span className={`block w-4 h-4 rounded-full bg-white transition ${husbandAttending ? 'translate-x-5' : ''}`} />
                </span>
              </button>
              <button onClick={handleSave} disabled={saving || !title || !date}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {saving ? 'Saving...' : 'Save appointment'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav activeRoute="/appointments" />
    </div>
  )
}
