import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TeamMember, TeamRole } from '../types/database';

interface TeamFilters {
  role: TeamRole | 'all';
  isActive: boolean | 'all';
  searchQuery: string;
}

interface TeamState {
  // UI State
  selectedMember: TeamMember | null;

  // Filters
  filters: TeamFilters;

  // Loading states
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  // Actions
  setSelectedMember: (member: TeamMember | null) => void;
  setFilters: (filters: Partial<TeamFilters>) => void;
  resetFilters: () => void;
  setLoading: (loading: boolean) => void;
  setSubmitting: (submitting: boolean) => void;
  setError: (error: string | null) => void;
}

const defaultFilters: TeamFilters = {
  role: 'all',
  isActive: 'all',
  searchQuery: '',
};

export const useTeamStore = create<TeamState>()(
  persist(
    (set) => ({
      // Initial UI state
      selectedMember: null,

      // Initial filters
      filters: defaultFilters,

      // Initial loading states
      isLoading: false,
      isSubmitting: false,
      error: null,

      // Actions
      setSelectedMember: (member) => set({ selectedMember: member }),

      setFilters: (filters) =>
        set((state) => ({
          filters: { ...state.filters, ...filters },
        })),

      resetFilters: () => set({ filters: defaultFilters }),

      setLoading: (isLoading) => set({ isLoading }),

      setSubmitting: (isSubmitting) => set({ isSubmitting }),

      setError: (error) => set({ error }),
    }),
    {
      name: 'team-storage',
      partialize: (state) => ({
        filters: state.filters,
      }),
    }
  )
);

// Selectors - take data as parameter
export const selectFilteredMembers = (
  members: TeamMember[],
  filters: TeamFilters
): TeamMember[] => {
  let filtered = members;

  if (filters.role !== 'all') {
    filtered = filtered.filter((m) => m.role === filters.role);
  }

  if (filters.isActive !== 'all') {
    filtered = filtered.filter((m) => m.is_active === filters.isActive);
  }

  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        m.email.toLowerCase().includes(query) ||
        m.job_title?.toLowerCase().includes(query) ||
        m.phone?.includes(query)
    );
  }

  return filtered;
};

export const selectMembersByRole = (
  members: TeamMember[],
  role: TeamRole
): TeamMember[] => {
  return members.filter((m) => m.role === role);
};

export const selectActiveMembers = (members: TeamMember[]): TeamMember[] => {
  return members.filter((m) => m.is_active);
};

export const selectMemberByUserId = (
  members: TeamMember[],
  userId: string
): TeamMember | undefined => {
  return members.find((m) => m.user_id === userId);
};

export const selectOwners = (members: TeamMember[]): TeamMember[] => {
  return members.filter((m) => m.role === 'owner');
};

export const selectAdmins = (members: TeamMember[]): TeamMember[] => {
  return members.filter((m) => m.role === 'admin' || m.role === 'owner');
};
