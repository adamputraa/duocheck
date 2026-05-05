/**
 * Authentication hook for DuoCheck.
 * Manages Supabase Auth state, sign-in, sign-up, and sign-out.
 * Automatically creates profile and sharing_settings on first sign-up.
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

interface UseAuthReturn extends AuthState {
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName: string) => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void
}

/**
 * Generates a 32-character hex shortcut token using crypto.randomUUID.
 */
function generateShortcutToken(): string {
  return crypto.randomUUID().replace(/-/g, '')
}

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  })

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }))
  }, [])

  // Listen to auth state changes
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({
        user: session?.user ?? null,
        loading: false,
        error: null,
      })
    })

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setState({
          user: session?.user ?? null,
          loading: false,
          error: null,
        })
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message,
      }))
      throw error
    }
    // Auth state change listener will update user
  }, [])

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message,
      }))
      throw error
    }

    // Auto-create profile and sharing_settings for the new user
    if (data.user) {
      const shortcutToken = generateShortcutToken()

      // Create profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        display_name: displayName,
      })

      if (profileError) {
        console.error('Failed to create profile:', profileError)
      }

      // Create sharing settings
      const { error: settingsError } = await supabase.from('sharing_settings').insert({
        user_id: data.user.id,
        sharing_enabled: true,
        shortcut_token: shortcutToken,
      })

      if (settingsError) {
        console.error('Failed to create sharing settings:', settingsError)
      }
    }

    // Auth state change listener will update user
  }, [])

  const signOut = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))

    const { error } = await supabase.auth.signOut()

    if (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message,
      }))
      throw error
    }

    setState({ user: null, loading: false, error: null })
  }, [])

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    signIn,
    signUp,
    signOut,
    clearError,
  }
}
