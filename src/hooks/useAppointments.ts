/**
 * Appointments hook for DuoCare.
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useCouple } from '@/hooks/useCouple'

export interface Appointment {
  id: string
  couple_id: string
  title: string
  appointment_type: string
  appointment_date: string
  appointment_time: string | null
  location: string | null
  doctor_name: string | null
  notes: string | null
  husband_attending: boolean
  reminder_enabled: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export function useAppointments() {
  const { user } = useAuth()
  const { couple } = useCouple()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAppointments = useCallback(async () => {
    if (!couple) { setLoading(false); return }
    setLoading(true)

    const { data, error: fetchErr } = await supabase
      .from('appointments').select('*')
      .eq('couple_id', couple.id)
      .order('appointment_date', { ascending: true })

    if (fetchErr) setError('Failed to load appointments.')
    else setAppointments((data as Appointment[]) ?? [])
    setLoading(false)
  }, [couple])

  useEffect(() => { fetchAppointments() }, [fetchAppointments])

  const today = new Date().toISOString().split('T')[0]
  const upcoming = appointments.filter(a => a.appointment_date >= today)
  const past = appointments.filter(a => a.appointment_date < today).reverse()
  const nextAppointment = upcoming.length > 0 ? upcoming[0] : null

  const addAppointment = useCallback(async (data: Partial<Appointment>): Promise<boolean> => {
    if (!user || !couple) return false
    const { error: insertErr } = await supabase.from('appointments').insert({
      couple_id: couple.id, created_by: user.id, ...data,
    })
    if (insertErr) { setError('Failed to add appointment.'); return false }
    await fetchAppointments()
    return true
  }, [user, couple, fetchAppointments])

  const updateAppointment = useCallback(async (id: string, data: Partial<Appointment>): Promise<boolean> => {
    const { error: updateErr } = await supabase
      .from('appointments').update(data).eq('id', id)
    if (updateErr) { setError('Failed to update appointment.'); return false }
    await fetchAppointments()
    return true
  }, [fetchAppointments])

  const deleteAppointment = useCallback(async (id: string): Promise<boolean> => {
    const { error: deleteErr } = await supabase
      .from('appointments').delete().eq('id', id)
    if (deleteErr) { setError('Failed to delete appointment.'); return false }
    await fetchAppointments()
    return true
  }, [fetchAppointments])

  return {
    appointments, upcoming, past, nextAppointment,
    loading, error, addAppointment, updateAppointment, deleteAppointment,
    refresh: fetchAppointments,
  }
}
