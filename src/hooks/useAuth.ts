import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { User, Session, AuthError } from '@supabase/supabase-js'

export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: AuthError | null
}

export interface SignUpCredentials {
  email: string
  password: string
  options?: {
    data?: Record<string, unknown>
    emailRedirectTo?: string
  }
}

export interface SignInCredentials {
  email: string
  password: string
}

export interface ResetPasswordCredentials {
  email: string
  redirectTo?: string
}

export interface UpdatePasswordCredentials {
  password: string
}

export function useAuth() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const signUp = useCallback(async ({ email, password, options }: SignUpCredentials) => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: options?.data,
          emailRedirectTo: options?.emailRedirectTo,
        },
      })

      if (signUpError) {
        setError(signUpError)
        return { data: null, error: signUpError }
      }

      return { data, error: null }
    } catch (err) {
      const authError = err as AuthError
      setError(authError)
      return { data: null, error: authError }
    } finally {
      setLoading(false)
    }
  }, [])

  const signIn = useCallback(async ({ email, password }: SignInCredentials) => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError)
        return { data: null, error: signInError }
      }

      return { data, error: null }
    } catch (err) {
      const authError = err as AuthError
      setError(authError)
      return { data: null, error: authError }
    } finally {
      setLoading(false)
    }
  }, [])

  const signInWithOAuth = useCallback(async (provider: 'google' | 'github' | 'apple') => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (oauthError) {
        setError(oauthError)
        return { data: null, error: oauthError }
      }

      return { data, error: null }
    } catch (err) {
      const authError = err as AuthError
      setError(authError)
      return { data: null, error: authError }
    } finally {
      setLoading(false)
    }
  }, [])

  const signOut = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { error: signOutError } = await supabase.auth.signOut()

      if (signOutError) {
        setError(signOutError)
        return { error: signOutError }
      }

      return { error: null }
    } catch (err) {
      const authError = err as AuthError
      setError(authError)
      return { error: authError }
    } finally {
      setLoading(false)
    }
  }, [])

  const resetPassword = useCallback(async ({ email, redirectTo }: ResetPasswordCredentials) => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo ?? `${window.location.origin}/auth/reset-password`,
      })

      if (resetError) {
        setError(resetError)
        return { data: null, error: resetError }
      }

      return { data, error: null }
    } catch (err) {
      const authError = err as AuthError
      setError(authError)
      return { data: null, error: authError }
    } finally {
      setLoading(false)
    }
  }, [])

  const updatePassword = useCallback(async ({ password }: UpdatePasswordCredentials) => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: updateError } = await supabase.auth.updateUser({
        password,
      })

      if (updateError) {
        setError(updateError)
        return { data: null, error: updateError }
      }

      return { data, error: null }
    } catch (err) {
      const authError = err as AuthError
      setError(authError)
      return { data: null, error: authError }
    } finally {
      setLoading(false)
    }
  }, [])

  const getSession = useCallback(async () => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) {
      setError(sessionError)
      return null
    }
    return session
  }, [])

  const getUser = useCallback(async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) {
      setError(userError)
      return null
    }
    return user
  }, [])

  return {
    loading,
    error,
    clearError,
    signUp,
    signIn,
    signInWithOAuth,
    signOut,
    resetPassword,
    updatePassword,
    getSession,
    getUser,
  }
}

export default useAuth
