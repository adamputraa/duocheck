/**
 * Couple management hook for DuoCheck.
 * Handles creating a couple group, joining with an invite code,
 * and fetching couple/partner data.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

interface Couple {
  id: string
  name: string | null
  invite_code: string | null
  created_at: string
}

interface Partner {
  id: string
  display_name: string | null
  created_at: string
}

interface PartnerSettings {
  id: string
  user_id: string
  sharing_enabled: boolean
  shortcut_token: string | null
  created_at: string
  updated_at: string
}

interface UseCoupleReturn {
  couple: Couple | null
  partner: Partner | null
  partnerSettings: PartnerSettings | null
  loading: boolean
  error: string | null
  createGroup: () => Promise<{ inviteCode: string } | null>
  joinWithCode: (code: string) => Promise<{ success: boolean; message: string }>
  isInCouple: boolean
  refreshCouple: () => Promise<void>
}

/**
 * Characters allowed in invite codes.
 * Excludes: 0, O (zero/O confusion), 1, I, L (one/I/L confusion)
 * Uses: A-Z (minus O,I,L) and 2-9
 */
const INVITE_CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

/**
 * Generates a random 6-character invite code.
 */
function generateInviteCode(): string {
  let code = ''
  for (let i = 0; i < 6; i++) {
    const idx = Math.floor(Math.random() * INVITE_CODE_CHARS.length)
    code += INVITE_CODE_CHARS[idx]
  }
  return code
}

async function fetchCoupleData(userId: string): Promise<{
  couple: Couple | null
  partner: Partner | null
  partnerSettings: PartnerSettings | null
}> {
  // Get user's couple membership
  const { data: membership, error: membershipError } = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (membershipError || !membership) {
    return { couple: null, partner: null, partnerSettings: null }
  }

  // Fetch couple details
  const { data: coupleData, error: coupleError } = await supabase
    .from('couples')
    .select('*')
    .eq('id', membership.couple_id)
    .single()

  if (coupleError || !coupleData) {
    return { couple: null, partner: null, partnerSettings: null }
  }

  // Fetch partner's profile (the other member of the couple)
  const { data: partnerMemberships, error: partnerError } = await supabase
    .from('couple_members')
    .select('user_id')
    .eq('couple_id', membership.couple_id)
    .neq('user_id', userId)

  if (partnerError || !partnerMemberships || partnerMemberships.length === 0) {
    return { couple: coupleData as Couple, partner: null, partnerSettings: null }
  }

  const partnerId = partnerMemberships[0].user_id

  const { data: partnerProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', partnerId)
    .single()

  // Fetch partner's sharing settings
  const { data: pSettings } = await supabase
    .from('sharing_settings')
    .select('*')
    .eq('user_id', partnerId)
    .single()

  return {
    couple: coupleData as Couple,
    partner: (partnerProfile as Partner) ?? null,
    partnerSettings: (pSettings as PartnerSettings) ?? null,
  }
}

export function useCouple(): UseCoupleReturn {
  const { user } = useAuth()
  const [couple, setCouple] = useState<Couple | null>(null)
  const [partner, setPartner] = useState<Partner | null>(null)
  const [partnerSettings, setPartnerSettings] = useState<PartnerSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fetchTrigger, setFetchTrigger] = useState(0)
  const mountedRef = useRef(true)
  const prevUserIdRef = useRef<string | null>(null)

  const isInCouple = couple !== null

  // Reset state when user logs out (detected by user becoming null)
  // and fetch data when user logs in or refresh is triggered
  useEffect(() => {
    mountedRef.current = true

    const userId = user?.id ?? null
    const userChanged = prevUserIdRef.current !== userId
    prevUserIdRef.current = userId

    if (!user) {
      // Only reset if user actually changed (not just a re-render)
      if (userChanged) {
        setCouple(null)
        setPartner(null)
        setPartnerSettings(null)
        setLoading(false)
      }
      return
    }

    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const data = await fetchCoupleData(user!.id)
        if (!cancelled && mountedRef.current) {
          setCouple(data.couple)
          setPartner(data.partner)
          setPartnerSettings(data.partnerSettings)
        }
      } catch {
        if (!cancelled && mountedRef.current) {
          setError('Failed to load couple data.')
        }
      } finally {
        if (!cancelled && mountedRef.current) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
      mountedRef.current = false
    }
  }, [user, fetchTrigger])

  const refreshCouple = useCallback(async () => {
    setFetchTrigger((k) => k + 1)
  }, [])

  const createGroup = useCallback(async (): Promise<{ inviteCode: string } | null> => {
    if (!user) {
      setError('You must be signed in to create a group.')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const inviteCode = generateInviteCode()

      // Create the couple record
      const { data: coupleData, error: coupleError } = await supabase
        .from('couples')
        .insert({
          invite_code: inviteCode,
          created_by: user.id,
        })
        .select()
        .single()

      if (coupleError || !coupleData) {
        console.error('Error creating couple:', coupleError)
        setError('Failed to create group. Please try again.')
        setLoading(false)
        return null
      }

      // Add creator as a couple member
      const { error: memberError } = await supabase.from('couple_members').insert({
        couple_id: coupleData.id,
        user_id: user.id,
      })

      if (memberError) {
        console.error('Error adding creator to couple:', memberError)
        setError('Failed to join the created group. Please try again.')
        setLoading(false)
        return null
      }

      setCouple(coupleData as Couple)
      setLoading(false)
      return { inviteCode }
    } catch (err) {
      console.error('Unexpected error in createGroup:', err)
      setError('An unexpected error occurred.')
      setLoading(false)
      return null
    }
  }, [user])

  const joinWithCode = useCallback(async (code: string): Promise<{ success: boolean; message: string }> => {
    if (!user) {
      return { success: false, message: 'You must be signed in to join a group.' }
    }

    const trimmedCode = code.trim().toUpperCase()

    if (trimmedCode.length !== 6) {
      return { success: false, message: 'Invite code must be 6 characters.' }
    }

    setLoading(true)
    setError(null)

    try {
      // Look up the couple by invite code
      const { data: coupleData, error: coupleError } = await supabase
        .from('couples')
        .select('*')
        .eq('invite_code', trimmedCode)
        .single()

      if (coupleError || !coupleData) {
        setLoading(false)
        return { success: false, message: 'Invalid invite code. Please check and try again.' }
      }

      // Check member count
      const { count, error: countError } = await supabase
        .from('couple_members')
        .select('*', { count: 'exact', head: true })
        .eq('couple_id', coupleData.id)

      if (countError) {
        setLoading(false)
        return { success: false, message: 'Failed to verify group. Please try again.' }
      }

      if (count !== null && count >= 2) {
        setLoading(false)
        return { success: false, message: 'This group already has 2 members.' }
      }

      // Add user as couple member
      const { error: memberError } = await supabase.from('couple_members').insert({
        couple_id: coupleData.id,
        user_id: user.id,
      })

      if (memberError) {
        console.error('Error joining couple:', memberError)
        setLoading(false)
        return { success: false, message: 'Failed to join the group. Please try again.' }
      }

      // Nullify invite code and set couple name
      const { data: creatorProfile } = await supabase
        .from('couple_members')
        .select('user_id')
        .eq('couple_id', coupleData.id)
        .neq('user_id', user.id)
        .single()

      let coupleName: string | null = null
      if (creatorProfile) {
        const { data: creatorProfileData } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', creatorProfile.user_id)
          .single()

        const { data: joinerProfileData } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .single()

        const name1 = creatorProfileData?.display_name || 'Partner 1'
        const name2 = joinerProfileData?.display_name || 'Partner 2'
        coupleName = `${name1} & ${name2}`
      }

      await supabase
        .from('couples')
        .update({
          invite_code: null,
          name: coupleName,
        })
        .eq('id', coupleData.id)

      // Refresh couple data
      await refreshCouple()

      setLoading(false)
      return { success: true, message: 'Successfully joined the group!' }
    } catch (err) {
      console.error('Unexpected error in joinWithCode:', err)
      setError('An unexpected error occurred.')
      setLoading(false)
      return { success: false, message: 'An unexpected error occurred.' }
    }
  }, [user, refreshCouple])

  return {
    couple,
    partner,
    partnerSettings,
    loading,
    error,
    createGroup,
    joinWithCode,
    isInCouple,
    refreshCouple,
  }
}
