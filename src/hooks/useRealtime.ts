/**
 * Realtime subscription hook for DuoCare.
 * Subscribes to pregnancy_checkins, emergency_events, appointments, care_tasks.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

interface EmergencyEvent {
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

interface UseRealtimeReturn {
  emergencyEvents: EmergencyEvent[]
  lastCheckinAt: string | null
  refresh: () => Promise<void>
}

export function useRealtime(): UseRealtimeReturn {
  const { user } = useAuth()
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const [emergencyEvents, setEmergencyEvents] = useState<EmergencyEvent[]>([])
  const [lastCheckinAt, setLastCheckinAt] = useState<string | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    if (!user) return

    let cancelled = false
    async function load() {
      const { data: membership } = await supabase
        .from('couple_members').select('couple_id')
        .eq('user_id', user!.id).single()

      if (cancelled || !membership) return
      const cId = membership.couple_id as string
      if (mountedRef.current) setCoupleId(cId)

      // Fetch unresolved emergency events
      const { data: emergData } = await supabase
        .from('emergency_events').select('*')
        .eq('couple_id', cId).is('resolved_at', null)
        .order('created_at', { ascending: false })

      if (!cancelled && mountedRef.current) {
        setEmergencyEvents((emergData as EmergencyEvent[]) ?? [])
      }

      // Fetch latest check-in timestamp
      const { data: checkinData } = await supabase
        .from('pregnancy_checkins').select('created_at')
        .eq('couple_id', cId)
        .order('created_at', { ascending: false })
        .limit(1).maybeSingle()

      if (!cancelled && mountedRef.current) {
        setLastCheckinAt(checkinData?.created_at ?? null)
      }
    }
    load()
    return () => { cancelled = true; mountedRef.current = false }
  }, [user])

  // Realtime subscriptions
  useEffect(() => {
    if (!coupleId) return

    const channel = supabase
      .channel(`duocare-${coupleId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'pregnancy_checkins',
        filter: `couple_id=eq.${coupleId}`,
      }, (payload) => {
        setLastCheckinAt(payload.new.created_at)
      })
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'emergency_events',
        filter: `couple_id=eq.${coupleId}`,
      }, (payload) => {
        const newEvent = payload.new as EmergencyEvent
        if (!newEvent.resolved_at) {
          setEmergencyEvents(prev => [newEvent, ...prev])
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'emergency_events',
        filter: `couple_id=eq.${coupleId}`,
      }, (payload) => {
        const updated = payload.new as EmergencyEvent
        if (updated.resolved_at) {
          setEmergencyEvents(prev => prev.filter(e => e.id !== updated.id))
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [coupleId])

  const refresh = useCallback(async () => {
    if (!coupleId) return
    const { data: emergData } = await supabase
      .from('emergency_events').select('*')
      .eq('couple_id', coupleId).is('resolved_at', null)
      .order('created_at', { ascending: false })
    if (mountedRef.current) setEmergencyEvents((emergData as EmergencyEvent[]) ?? [])
  }, [coupleId])

  return { emergencyEvents, lastCheckinAt, refresh }
}
