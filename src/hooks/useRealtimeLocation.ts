/**
 * Realtime subscription hook for DuoCheck.
 * Subscribes to Supabase Realtime for location_updates and sos_events
 * for the current couple. Provides partner location, own location, and SOS events.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

interface LocationUpdate {
  id: string
  user_id: string
  couple_id: string
  latitude: number
  longitude: number
  accuracy: number | null
  status: string
  source: string
  created_at: string
}

interface SosEvent {
  id: string
  user_id: string
  couple_id: string
  latitude: number
  longitude: number
  accuracy?: number | null
  resolved_at: string | null
  created_at: string
}

interface UseRealtimeLocationReturn {
  partnerLocation: LocationUpdate | null
  ownLocation: LocationUpdate | null
  sosEvents: SosEvent[]
  latestActivity: LocationUpdate | null
  refresh: () => Promise<void>
}

async function fetchInitialData(userId: string, coupleId: string): Promise<{
  partnerLocation: LocationUpdate | null
  ownLocation: LocationUpdate | null
  latestActivity: LocationUpdate | null
  sosEvents: SosEvent[]
}> {
  // Fetch partner's latest location
  const { data: partnerData } = await supabase
    .from('location_updates')
    .select('*')
    .eq('couple_id', coupleId)
    .neq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Fetch own latest location
  const { data: ownData } = await supabase
    .from('location_updates')
    .select('*')
    .eq('couple_id', coupleId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Fetch latest activity (including own)
  const { data: activityData } = await supabase
    .from('location_updates')
    .select('*')
    .eq('couple_id', coupleId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Fetch unresolved SOS events (resolved_at IS NULL means active)
  const { data: sosData } = await supabase
    .from('sos_events')
    .select('*')
    .eq('couple_id', coupleId)
    .is('resolved_at', null)
    .order('created_at', { ascending: false })

  return {
    partnerLocation: (partnerData as LocationUpdate) ?? null,
    ownLocation: (ownData as LocationUpdate) ?? null,
    latestActivity: (activityData as LocationUpdate) ?? null,
    sosEvents: (sosData as SosEvent[]) ?? [],
  }
}

export function useRealtimeLocation(): UseRealtimeLocationReturn {
  const { user } = useAuth()
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const [partnerLocation, setPartnerLocation] = useState<LocationUpdate | null>(null)
  const [ownLocation, setOwnLocation] = useState<LocationUpdate | null>(null)
  const [sosEvents, setSosEvents] = useState<SosEvent[]>([])
  const [latestActivity, setLatestActivity] = useState<LocationUpdate | null>(null)
  const mountedRef = useRef(true)

  // Fetch couple ID and initial data
  useEffect(() => {
    mountedRef.current = true

    if (!user) {
      return
    }

    let cancelled = false

    async function load() {
      // Fetch couple ID
      const { data: membership } = await supabase
        .from('couple_members')
        .select('couple_id')
        .eq('user_id', user!.id)
        .single()

      if (cancelled || !membership) return

      const cId = membership.couple_id as string

      if (mountedRef.current) {
        setCoupleId(cId)
      }

      // Fetch initial data
      const data = await fetchInitialData(user!.id, cId)
      if (!cancelled && mountedRef.current) {
        setPartnerLocation(data.partnerLocation)
        setOwnLocation(data.ownLocation)
        setLatestActivity(data.latestActivity)
        setSosEvents(data.sosEvents)
      }
    }

    load()

    return () => {
      cancelled = true
      mountedRef.current = false
    }
  }, [user])

  // Manual refresh
  const refresh = useCallback(async () => {
    if (!user || !coupleId) return

    const data = await fetchInitialData(user.id, coupleId)
    if (mountedRef.current) {
      setPartnerLocation(data.partnerLocation)
      setOwnLocation(data.ownLocation)
      setLatestActivity(data.latestActivity)
      setSosEvents(data.sosEvents)
    }
  }, [user, coupleId])

  // Subscribe to realtime updates
  useEffect(() => {
    if (!coupleId) return

    const channel = supabase
      .channel(`couple-${coupleId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'location_updates',
          filter: `couple_id=eq.${coupleId}`,
        },
        (payload) => {
          const newUpdate = payload.new as LocationUpdate
          setLatestActivity(newUpdate)

          if (user) {
            if (newUpdate.user_id !== user.id) {
              setPartnerLocation(newUpdate)
            } else {
              setOwnLocation(newUpdate)
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sos_events',
          filter: `couple_id=eq.${coupleId}`,
        },
        (payload) => {
          const newEvent = payload.new as SosEvent
          if (!newEvent.resolved_at) {
            setSosEvents((prev) => [newEvent, ...prev])
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sos_events',
          filter: `couple_id=eq.${coupleId}`,
        },
        (payload) => {
          const updatedEvent = payload.new as SosEvent
          if (updatedEvent.resolved_at) {
            setSosEvents((prev) => prev.filter((e) => e.id !== updatedEvent.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [coupleId, user])

  return {
    partnerLocation,
    ownLocation,
    sosEvents,
    latestActivity,
    refresh,
  }
}
