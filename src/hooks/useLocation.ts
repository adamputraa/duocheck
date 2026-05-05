/**
 * Location sharing hook for DuoCheck.
 * Uses browser Geolocation API to get the current position and
 * inserts a check-in into the location_updates table.
 * Respects the sharing_enabled setting before inserting.
 */

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { getCurrentPosition, LocationError, LocationErrorCode } from '@/lib/location'
import { useAuth } from '@/hooks/useAuth'

interface UseLocationReturn {
  shareLocation: (status: string, source?: string) => Promise<{ success: boolean; message: string }>
  loading: boolean
  error: string | null
}

export function useLocation(): UseLocationReturn {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const shareLocation = useCallback(async (
    status: string,
    source: string = 'web'
  ): Promise<{ success: boolean; message: string }> => {
    if (!user) {
      const msg = 'You must be signed in to share your location.'
      setError(msg)
      return { success: false, message: msg }
    }

    setLoading(true)
    setError(null)

    try {
      // Check if sharing is enabled
      const { data: settings, error: settingsError } = await supabase
        .from('sharing_settings')
        .select('sharing_enabled')
        .eq('user_id', user.id)
        .single()

      if (settingsError) {
        const msg = 'Could not verify sharing settings. Please try again.'
        setError(msg)
        setLoading(false)
        return { success: false, message: msg }
      }

      if (!settings?.sharing_enabled) {
        const msg = 'Location sharing is currently turned off. Enable it in Settings to check in.'
        setError(msg)
        setLoading(false)
        return { success: false, message: msg }
      }

      // Get the user's couple_id
      const { data: membership, error: membershipError } = await supabase
        .from('couple_members')
        .select('couple_id')
        .eq('user_id', user.id)
        .single()

      if (membershipError || !membership) {
        const msg = 'You must be part of a couple to share your location.'
        setError(msg)
        setLoading(false)
        return { success: false, message: msg }
      }

      // Get current position from browser
      const position = await getCurrentPosition()
      const { latitude, longitude, accuracy } = position.coords

      // Insert into location_updates
      const { error: insertError } = await supabase.from('location_updates').insert({
        user_id: user.id,
        couple_id: membership.couple_id,
        latitude,
        longitude,
        accuracy,
        status,
        source,
      })

      if (insertError) {
        const msg = 'Failed to save your check-in. Please try again.'
        setError(msg)
        setLoading(false)
        return { success: false, message: msg }
      }

      setLoading(false)
      return { success: true, message: 'Check-in successful!' }
    } catch (err) {
      let msg = 'An unexpected error occurred while sharing your location.'

      if (err instanceof LocationError) {
        if (err.code === LocationErrorCode.PERMISSION_DENIED) {
          msg = err.message
        } else {
          msg = err.message
        }
      }

      setError(msg)
      setLoading(false)
      return { success: false, message: msg }
    }
  }, [user])

  return {
    shareLocation,
    loading,
    error,
  }
}
