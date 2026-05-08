/**
 * NextAppointmentCard for DuoCare dashboard.
 */

import { Calendar } from 'lucide-react'
import type { Appointment } from '@/hooks/useAppointments'
import { APPOINTMENT_TYPES } from '@/lib/pregnancy'

interface NextAppointmentCardProps {
  appointment: Appointment | null
  onViewAll: () => void
}

export default function NextAppointmentCard({ appointment, onViewAll }: NextAppointmentCardProps) {
  if (!appointment) {
    return (
      <div className="bg-card rounded-2xl border border-border-light p-5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-text-dark">Next Appointment</h3>
          <button onClick={onViewAll} className="text-xs text-primary font-medium min-h-[44px] flex items-center">
            View all
          </button>
        </div>
        <p className="text-sm text-text-muted">No upcoming appointments.</p>
      </div>
    )
  }

  const dateStr = new Date(appointment.appointment_date).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
  const typeLabel = APPOINTMENT_TYPES.find(t => t.value === appointment.appointment_type)?.label || appointment.appointment_type

  return (
    <div className="bg-card rounded-2xl border border-border-light p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text-dark">Next Appointment</h3>
        <button onClick={onViewAll} className="text-xs text-primary font-medium min-h-[44px] flex items-center">
          View all
        </button>
      </div>
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-light shrink-0">
          <Calendar className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-dark truncate">{appointment.title}</p>
          <p className="text-xs text-text-muted">{dateStr}{appointment.appointment_time ? ` • ${appointment.appointment_time.slice(0, 5)}` : ''}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] bg-primary-light text-primary-dark px-2 py-0.5 rounded-full font-medium">{typeLabel}</span>
            {appointment.husband_attending && (
              <span className="text-[10px] bg-success/10 text-success px-2 py-0.5 rounded-full font-medium">Husband attending</span>
            )}
          </div>
          {appointment.location && (
            <p className="text-xs text-text-muted mt-1 truncate">📍 {appointment.location}</p>
          )}
        </div>
      </div>
    </div>
  )
}
