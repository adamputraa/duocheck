/**
 * Hook to manage baby kicks tracking in real-time.
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useCouple } from '@/hooks/useCouple'

export interface BabyKick {
  id: string
  couple_id: string
  user_id: string
  created_at: string
}

export function useKicks() {
  const { user } = useAuth()
  const { couple, isInCouple } = useCouple()
  const [kicks, setKicks] = useState<BabyKick[]>([])
  const [loading, setLoading] = useState(true)

  const fetchKicks = useCallback(async () => {
    if (!isInCouple || !couple) {
      setKicks([])
      setLoading(false)
      return
    }

    setLoading(true)
    const { data, error } = await supabase
      .from('baby_kicks')
      .select('*')
      .eq('couple_id', couple.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setKicks(data)
    }
    setLoading(false)
  }, [isInCouple, couple])

  useEffect(() => {
    fetchKicks()
  }, [fetchKicks])

  useEffect(() => {
    if (!isInCouple || !couple) return

    const subscription = supabase
      .channel('baby_kicks_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'baby_kicks',
          filter: `couple_id=eq.${couple.id}`
        },
        (payload) => {
          setKicks(current => [payload.new as BabyKick, ...current])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [isInCouple, couple])

  const addKick = async () => {
    if (!user || !couple) return false
    const { error } = await supabase
      .from('baby_kicks')
      .insert({ couple_id: couple.id, user_id: user.id })
    return !error
  }

  return { kicks, loading, addKick, refetch: fetchKicks }
}
