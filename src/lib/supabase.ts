import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Demo mode when Supabase is not configured
export const isDemoMode = !supabaseUrl || !supabaseAnonKey

let supabaseClient: SupabaseClient<Database>

if (isDemoMode) {
  console.warn('Running in demo mode - Supabase not configured')
  // Create a mock client that won't make real API calls
  supabaseClient = createClient<Database>(
    'https://demo.supabase.co',
    'demo-anon-key',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
} else {
  supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  })
}

export const supabase = supabaseClient

// Helper to get the current user
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    console.error('Error fetching user:', error.message)
    return null
  }
  return user
}

// Helper to get the current session
export async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) {
    console.error('Error fetching session:', error.message)
    return null
  }
  return session
}

export default supabase
