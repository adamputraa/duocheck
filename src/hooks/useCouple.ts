/**
 * Couple management hook for DuoCare.
 * Handles creating a couple group, joining with an invite code,
 * fetching couple/partner data, and pregnancy profile status.
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
  role: string | null
  phone: string | null
  created_at: string
}

interface PrivacySettings {
  id: string
  user_id: string
  share_status_with_partner: boolean
  email_alerts_enabled: boolean
  shortcut_token: string | null
  updated_at: string
}

interface UseCoupleReturn {
  couple: Couple | null
  partner: Partner | null
  partnerSettings: PrivacySettings | null
  userRole: string | null
  hasPregnancyProfile: boolean
  loading: boolean
  error: string | null
  createGroup: (role: 'wife' | 'husband') => Promise<{ inviteCode: string } | null>
  joinWithCode: (code: string, role: 'wife' | 'husband') => Promise<{ success: boolean; message: string }>
  regenerateInviteCode: () => Promise<{ inviteCode: string } | null>
  isInCouple: boolean
  refreshCouple: () => Promise<void>
}

const INVITE_CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

function generateInviteCode(): string {
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += INVITE_CODE_CHARS[Math.floor(Math.random() * INVITE_CODE_CHARS.length)]
  }
  return code
}

async function fetchCoupleData(userId: string): Promise<{
  couple: Couple | null
  partner: Partner | null
  partnerSettings: PrivacySettings | null
  userRole: string | null
  hasPregnancyProfile: boolean
}> {
  const { data: membership } = await supabase
    .from('couple_members').select('couple_id, role')
    .eq('user_id', userId).maybeSingle()

  if (!membership) {
    return { couple: null, partner: null, partnerSettings: null, userRole: null, hasPregnancyProfile: false }
  }

  const userRole = membership.role as string | null

  const { data: coupleData } = await supabase
    .from('couples').select('*').eq('id', membership.couple_id).single()

  if (!coupleData) {
    return { couple: null, partner: null, partnerSettings: null, userRole, hasPregnancyProfile: false }
  }

  // Fetch partner
  const { data: partnerMemberships } = await supabase
    .from('couple_members').select('user_id')
    .eq('couple_id', membership.couple_id).neq('user_id', userId)

  let partner: Partner | null = null
  let partnerSettings: PrivacySettings | null = null

  if (partnerMemberships && partnerMemberships.length > 0) {
    const partnerId = partnerMemberships[0].user_id
    const { data: partnerProfile } = await supabase
      .from('profiles').select('*').eq('id', partnerId).single()
    partner = (partnerProfile as Partner) ?? null

    const { data: pSettings } = await supabase
      .from('privacy_settings').select('*').eq('user_id', partnerId).single()
    partnerSettings = (pSettings as PrivacySettings) ?? null
  }

  // Check pregnancy profile
  const { data: pregProfile } = await supabase
    .from('pregnancy_profiles').select('id').eq('couple_id', membership.couple_id).maybeSingle()

  return {
    couple: coupleData as Couple,
    partner,
    partnerSettings,
    userRole,
    hasPregnancyProfile: !!pregProfile,
  }
}

export function useCouple(): UseCoupleReturn {
  const { user } = useAuth()
  const [couple, setCouple] = useState<Couple | null>(null)
  const [partner, setPartner] = useState<Partner | null>(null)
  const [partnerSettings, setPartnerSettings] = useState<PrivacySettings | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [hasPregnancyProfile, setHasPregnancyProfile] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fetchTrigger, setFetchTrigger] = useState(0)
  const mountedRef = useRef(true)
  const prevUserIdRef = useRef<string | null>(null)

  const isInCouple = couple !== null

  useEffect(() => {
    mountedRef.current = true
    const userId = user?.id ?? null
    const userChanged = prevUserIdRef.current !== userId
    prevUserIdRef.current = userId

    if (!user) {
      if (userChanged) {
        setCouple(null); setPartner(null); setPartnerSettings(null)
        setUserRole(null); setHasPregnancyProfile(false); setLoading(false)
      }
      return
    }

    let cancelled = false
    async function load() {
      setLoading(true); setError(null)
      try {
        const data = await fetchCoupleData(user!.id)
        if (!cancelled && mountedRef.current) {
          setCouple(data.couple); setPartner(data.partner)
          setPartnerSettings(data.partnerSettings); setUserRole(data.userRole)
          setHasPregnancyProfile(data.hasPregnancyProfile)
        }
      } catch {
        if (!cancelled && mountedRef.current) setError('Failed to load couple data.')
      } finally {
        if (!cancelled && mountedRef.current) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true; mountedRef.current = false }
  }, [user, fetchTrigger])

  const refreshCouple = useCallback(async () => {
    setFetchTrigger((k) => k + 1)
  }, [])

  const createGroup = useCallback(async (role: 'wife' | 'husband'): Promise<{ inviteCode: string } | null> => {
    if (!user) { setError('You must be signed in.'); return null }
    setLoading(true); setError(null)

    try {
      const inviteCode = generateInviteCode()
      const { data: coupleData, error: coupleError } = await supabase
        .from('couples').insert({ invite_code: inviteCode, created_by: user.id })
        .select().single()

      if (coupleError || !coupleData) {
        setError('Failed to create group.'); setLoading(false); return null
      }

      const { error: memberError } = await supabase
        .from('couple_members').insert({ couple_id: coupleData.id, user_id: user.id, role })

      if (memberError) {
        setError('Failed to join created group.'); setLoading(false); return null
      }

      // Update profile role
      await supabase.from('profiles').update({ role }).eq('id', user.id)

      setCouple(coupleData as Couple); setUserRole(role); setLoading(false)
      return { inviteCode }
    } catch {
      setError('An unexpected error occurred.'); setLoading(false); return null
    }
  }, [user])

  const joinWithCode = useCallback(async (code: string, role: 'wife' | 'husband'): Promise<{ success: boolean; message: string }> => {
    if (!user) return { success: false, message: 'You must be signed in.' }

    const trimmedCode = code.trim().toUpperCase()
    if (trimmedCode.length !== 6) return { success: false, message: 'Invite code must be 6 characters.' }

    setLoading(true); setError(null)

    try {
      const { data: coupleData, error: coupleError } = await supabase
        .from('couples').select('*').eq('invite_code', trimmedCode).single()

      if (coupleError || !coupleData) {
        setLoading(false); return { success: false, message: 'Invalid invite code.' }
      }

      // Check member count
      const { count } = await supabase
        .from('couple_members').select('*', { count: 'exact', head: true })
        .eq('couple_id', coupleData.id)

      if (count !== null && count >= 2) {
        setLoading(false); return { success: false, message: 'This group already has 2 members.' }
      }

      // Check role uniqueness
      const { data: existingMembers } = await supabase
        .from('couple_members').select('role').eq('couple_id', coupleData.id)

      if (existingMembers && existingMembers.some(m => m.role === role)) {
        setLoading(false)
        return { success: false, message: `This group already has a ${role}. Please select the other role.` }
      }

      // Add member
      const { error: memberError } = await supabase
        .from('couple_members').insert({ couple_id: coupleData.id, user_id: user.id, role })

      if (memberError) {
        setLoading(false); return { success: false, message: 'Failed to join group.' }
      }

      // Update profile role
      await supabase.from('profiles').update({ role }).eq('id', user.id)

      // Set couple name and null invite code
      const { data: creatorMember } = await supabase
        .from('couple_members').select('user_id')
        .eq('couple_id', coupleData.id).neq('user_id', user.id).single()

      let coupleName: string | null = null
      if (creatorMember) {
        const { data: creatorProfile } = await supabase
          .from('profiles').select('display_name, role')
          .eq('id', creatorMember.user_id).single()
        const { data: joinerProfile } = await supabase
          .from('profiles').select('display_name')
          .eq('id', user.id).single()

        const wifeName = role === 'wife' ? (joinerProfile?.display_name || 'Wife') : (creatorProfile?.display_name || 'Wife')
        const husbandName = role === 'husband' ? (joinerProfile?.display_name || 'Husband') : (creatorProfile?.display_name || 'Husband')
        coupleName = `${wifeName} & ${husbandName}`
      }

      await supabase.from('couples').update({ invite_code: null, name: coupleName }).eq('id', coupleData.id)
      await refreshCouple()
      setLoading(false)
      return { success: true, message: 'Successfully joined!' }
    } catch {
      setError('An unexpected error occurred.'); setLoading(false)
      return { success: false, message: 'An unexpected error occurred.' }
    }
  }, [user, refreshCouple])

  const regenerateInviteCode = useCallback(async (): Promise<{ inviteCode: string } | null> => {
    if (!user || !couple) { setError('No couple found.'); return null }
    if (partner) { setError('Cannot regenerate — partner already joined.'); return null }

    try {
      const newCode = generateInviteCode()
      const { error: updateError } = await supabase
        .from('couples').update({ invite_code: newCode }).eq('id', couple.id)
      if (updateError) { setError('Failed to regenerate code.'); return null }
      setCouple({ ...couple, invite_code: newCode })
      return { inviteCode: newCode }
    } catch {
      setError('An unexpected error occurred.'); return null
    }
  }, [user, couple, partner])

  return {
    couple, partner, partnerSettings, userRole, hasPregnancyProfile,
    loading, error, createGroup, joinWithCode, regenerateInviteCode,
    isInCouple, refreshCouple,
  }
}
