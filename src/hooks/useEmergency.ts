/**
 * Emergency hook for DuoCare.
 * Manages emergency events and emergency contacts.
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useCouple } from '@/hooks/useCouple'

export interface EmergencyContact {
  id: string
  couple_id: string
  name: string
  phone: string
  relationship: string | null
  contact_type: string
  created_by: string
}

export interface EmergencyEvent {
  id: string
  couple_id: string
  triggered_by: string
  message: string | null
  include_location: boolean
  latitude: number | null
  longitude: number | null
  resolved_at: string | null
  created_at: string
}

export function useEmergency() {
  const { user } = useAuth()
  const { couple } = useCouple()
  const [contacts, setContacts] = useState<EmergencyContact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchContacts = useCallback(async () => {
    if (!couple) { setLoading(false); return }
    setLoading(true)
    const { data } = await supabase
      .from('emergency_contacts').select('*')
      .eq('couple_id', couple.id)
      .order('created_at', { ascending: true })
    setContacts((data as EmergencyContact[]) ?? [])
    setLoading(false)
  }, [couple])

  useEffect(() => { fetchContacts() }, [fetchContacts])

  const addContact = useCallback(async (data: Partial<EmergencyContact>): Promise<boolean> => {
    if (!user || !couple) return false
    const { error: err } = await supabase.from('emergency_contacts').insert({
      couple_id: couple.id, created_by: user.id, ...data,
    })
    if (err) { setError('Failed to add contact.'); return false }
    await fetchContacts()
    return true
  }, [user, couple, fetchContacts])

  const updateContact = useCallback(async (id: string, data: Partial<EmergencyContact>): Promise<boolean> => {
    const { error: err } = await supabase.from('emergency_contacts').update(data).eq('id', id)
    if (err) return false
    await fetchContacts()
    return true
  }, [fetchContacts])

  const deleteContact = useCallback(async (id: string): Promise<boolean> => {
    const { error: err } = await supabase.from('emergency_contacts').delete().eq('id', id)
    if (err) return false
    await fetchContacts()
    return true
  }, [fetchContacts])

  const triggerEmergency = useCallback(async (opts: {
    message?: string; includeLocation?: boolean
  }): Promise<boolean> => {
    if (!user || !couple) return false
    setError(null)

    let lat: number | null = null
    let lng: number | null = null

    if (opts.includeLocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true, timeout: 10000,
          })
        })
        lat = pos.coords.latitude
        lng = pos.coords.longitude
      } catch {
        // Location failed — continue without it
      }
    }

    const { data: eventData, error: insertErr } = await supabase
      .from('emergency_events').insert({
        couple_id: couple.id, triggered_by: user.id,
        message: opts.message || null,
        include_location: opts.includeLocation || false,
        latitude: lat, longitude: lng,
      }).select('id').single()

    if (insertErr) {
      setError('Failed to send emergency alert.')
      return false
    }

    // Invoke edge function
    if (eventData) {
      try {
        await supabase.functions.invoke('emergency-notify', {
          body: { emergency_event_id: eventData.id },
        })
      } catch {
        setError('Emergency sent but email notification may have failed. Contact your partner directly.')
      }
    }

    return true
  }, [user, couple])

  const resolveEmergency = useCallback(async (eventId: string): Promise<boolean> => {
    const { error: err } = await supabase
      .from('emergency_events')
      .update({ resolved_at: new Date().toISOString() })
      .eq('id', eventId)
    return !err
  }, [])

  return {
    contacts, loading, error,
    addContact, updateContact, deleteContact,
    triggerEmergency, resolveEmergency,
    refresh: fetchContacts,
  }
}
