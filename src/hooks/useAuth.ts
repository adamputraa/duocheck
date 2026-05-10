/**
 * Authentication hook for DuoCare.
 * Manages Supabase Auth state, sign-in, sign-up with role, OTP verification, and sign-out.
 * Creates profile and privacy_settings on first sign-up.
 */

import { createContext, createElement, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

interface UseAuthReturn extends AuthState {
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName: string, role: 'wife' | 'husband') => Promise<{ otpSent: boolean }>
  verifyOtp: (email: string, token: string) => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void
}

function generateShortcutToken(): string {
  return crypto.randomUUID().replace(/-/g, '')
}

const AuthContext = createContext<UseAuthReturn | null>(null)

function useAuthState(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  })

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }))
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({ user: session?.user ?? null, loading: false, error: null })
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setState({ user: session?.user ?? null, loading: false, error: null })
      }
    )

    return () => { subscription.unsubscribe() }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setState((prev) => ({ ...prev, loading: false, error: error.message }))
      throw error
    }
  }, [])

  const signUp = useCallback(async (
    email: string, password: string, displayName: string, role: 'wife' | 'husband'
  ): Promise<{ otpSent: boolean }> => {
    setState((prev) => ({ ...prev, loading: true, error: null }))

    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { display_name: displayName, role } },
    })

    if (error) {
      setState((prev) => ({ ...prev, loading: false, error: error.message }))
      throw error
    }

    if (data.user && !data.session) {
      setState((prev) => ({ ...prev, loading: false }))
      return { otpSent: true }
    }

    if (data.user && data.session) {
      const shortcutToken = generateShortcutToken()

      await supabase.from('profiles').insert({
        id: data.user.id,
        display_name: displayName,
        role,
      })

      await supabase.from('privacy_settings').insert({
        user_id: data.user.id,
        share_status_with_partner: true,
        email_alerts_enabled: true,
        shortcut_token: shortcutToken,
      })
    }

    setState((prev) => ({ ...prev, loading: false }))
    return { otpSent: false }
  }, [])

  const verifyOtp = useCallback(async (email: string, token: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))

    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'signup' })

    if (error) {
      setState((prev) => ({ ...prev, loading: false, error: error.message }))
      throw error
    }

    if (data.user) {
      const displayName = data.user.user_metadata?.display_name || 'User'
      const role = data.user.user_metadata?.role || 'wife'
      const shortcutToken = generateShortcutToken()

      const { data: existingProfile } = await supabase
        .from('profiles').select('id').eq('id', data.user.id).maybeSingle()

      if (!existingProfile) {
        await supabase.from('profiles').insert({
          id: data.user.id, display_name: displayName, role,
        })
        await supabase.from('privacy_settings').insert({
          user_id: data.user.id,
          share_status_with_partner: true,
          email_alerts_enabled: true,
          shortcut_token: shortcutToken,
        })
      }
    }
  }, [])

  const signOut = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    const { error } = await supabase.auth.signOut()
    if (error) {
      setState((prev) => ({ ...prev, loading: false, error: error.message }))
      throw error
    }
    setState({ user: null, loading: false, error: null })
  }, [])

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    signIn, signUp, verifyOtp, signOut, clearError,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const value = useAuthState()
  return createElement(AuthContext.Provider, { value }, children)
}

export function useAuth(): UseAuthReturn {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
