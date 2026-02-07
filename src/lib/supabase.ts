import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'
import { env, isDemoMode as _isDemoMode } from './env'

// Re-export isDemoMode from env.ts (single source of truth)
export const isDemoMode = _isDemoMode

let supabaseClient: SupabaseClient<Database>

if (isDemoMode) {
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
  supabaseClient = createClient<Database>(env.VITE_SUPABASE_URL!, env.VITE_SUPABASE_ANON_KEY!, {
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

// Helper to centralize demo mode check in query functions
export function withDemoMode<T>(demoData: T): (queryFn: () => Promise<T>) => () => Promise<T> {
  return (queryFn) => async () => {
    if (isDemoMode) return demoData;
    return queryFn();
  };
}

export default supabase
