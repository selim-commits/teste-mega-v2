import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@supabase/supabase-js';

// Demo studio ID for development - replace with real studio lookup in production
export const DEMO_STUDIO_ID = '11111111-1111-1111-1111-111111111111';

interface AuthState {
  user: User | null;
  studioId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setStudioId: (studioId: string | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      studioId: DEMO_STUDIO_ID, // Default to demo studio for development
      isAuthenticated: false,
      isLoading: true,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setStudioId: (studioId) => set({ studioId }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => set({ user: null, studioId: null, isAuthenticated: false }),
    }),
    { name: 'auth-storage' }
  )
);
