/**
 * Pregnancy data hook for DuoCare.
 * Manages pregnancy profile, check-ins, and pregnancy calculations.
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useCouple } from '@/hooks/useCouple'
import { calculatePregnancyInfo, type PregnancyInfo, type PregnancyCheckin } from '@/lib/pregnancy'

interface PregnancyProfile {
  id: string
  couple_id: string
  due_date: string
  last_menstrual_period: string | null
  pregnancy_type: string
  hospital_name: string | null
  clinic_name: string | null
  doctor_name: string | null
  doctor_phone: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  blood_type: string | null
  risk_notes: string | null
  created_by: string
  created_at: string
  updated_at: string
}

interface UsePregnancyReturn {
  profile: PregnancyProfile | null
  pregnancyInfo: PregnancyInfo | null
  latestCheckin: PregnancyCheckin | null
  checkinHistory: PregnancyCheckin[]
  loading: boolean
  error: string | null
  createProfile: (data: Partial<PregnancyProfile>) => Promise<boolean>
  updateProfile: (data: Partial<PregnancyProfile>) => Promise<boolean>
  submitCheckin: (data: Partial<PregnancyCheckin>) => Promise<boolean>
  fetchHistory: (limit?: number) => Promise<void>
  refresh: () => Promise<void>
}

export function usePregnancy(): UsePregnancyReturn {
  const { user } = useAuth()
  const { couple } = useCouple()
  const [profile, setProfile] = useState<PregnancyProfile | null>(null)
  const [pregnancyInfo, setPregnancyInfo] = useState<PregnancyInfo | null>(null)
  const [latestCheckin, setLatestCheckin] = useState<PregnancyCheckin | null>(null)
  const [checkinHistory, setCheckinHistory] = useState<PregnancyCheckin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!user || !couple) { setLoading(false); return }
    setLoading(true); setError(null)

    try {
      const { data: profileData } = await supabase
        .from('pregnancy_profiles').select('*')
        .eq('couple_id', couple.id).maybeSingle()

      if (profileData) {
        setProfile(profileData as PregnancyProfile)
        setPregnancyInfo(calculatePregnancyInfo(profileData.due_date))
      }

      const { data: checkinData } = await supabase
        .from('pregnancy_checkins').select('*')
        .eq('couple_id', couple.id)
        .order('created_at', { ascending: false })
        .limit(1).maybeSingle()

      setLatestCheckin((checkinData as PregnancyCheckin) ?? null)
    } catch {
      setError('Failed to load pregnancy data.')
    } finally {
      setLoading(false)
    }
  }, [user, couple])

  useEffect(() => { fetchData() }, [fetchData])

  const createProfile = useCallback(async (data: Partial<PregnancyProfile>): Promise<boolean> => {
    if (!user || !couple) return false
    setError(null)

    const { error: insertError } = await supabase.from('pregnancy_profiles').insert({
      couple_id: couple.id, created_by: user.id, ...data,
    })

    if (insertError) {
      setError('Failed to create pregnancy profile.')
      return false
    }
    await fetchData()
    return true
  }, [user, couple, fetchData])

  const updateProfile = useCallback(async (data: Partial<PregnancyProfile>): Promise<boolean> => {
    if (!profile) return false
    setError(null)

    const { error: updateError } = await supabase
      .from('pregnancy_profiles').update(data).eq('id', profile.id)

    if (updateError) {
      setError('Failed to update pregnancy profile.')
      return false
    }
    await fetchData()
    return true
  }, [profile, fetchData])

  const submitCheckin = useCallback(async (data: Partial<PregnancyCheckin>): Promise<boolean> => {
    if (!user || !couple) return false
    setError(null)

    const { error: insertError } = await supabase.from('pregnancy_checkins').insert({
      couple_id: couple.id, user_id: user.id, ...data,
    })

    if (insertError) {
      setError('Failed to submit check-in.')
      return false
    }
    await fetchData()
    return true
  }, [user, couple, fetchData])

  const fetchHistory = useCallback(async (limit = 30) => {
    if (!couple) return

    const { data } = await supabase
      .from('pregnancy_checkins').select('*')
      .eq('couple_id', couple.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    setCheckinHistory((data as PregnancyCheckin[]) ?? [])
  }, [couple])

  return {
    profile, pregnancyInfo, latestCheckin, checkinHistory,
    loading, error, createProfile, updateProfile, submitCheckin,
    fetchHistory, refresh: fetchData,
  }
}
