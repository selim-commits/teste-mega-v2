import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TeamMember, TeamRole } from '../types/database';

interface TeamFilters {
  role: TeamRole | 'all';
  isActive: boolean | 'all';
  searchQuery: string;
}

interface TeamState {
  // Data
  members: TeamMember[];
  selectedMember: TeamMember | null;

  // Filters
  filters: TeamFilters;

  // Loading states
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  // Actions
  setMembers: (members: TeamMember[]) => void;
  addMember: (member: TeamMember) => void;
  updateMember: (id: string, updates: Partial<TeamMember>) => void;
  deleteMember: (id: string) => void;
  setSelectedMember: (member: TeamMember | null) => void;
  setFilters: (filters: Partial<TeamFilters>) => void;
  resetFilters: () => void;
  setLoading: (loading: boolean) => void;
  setSubmitting: (submitting: boolean) => void;
  setError: (error: string | null) => void;
  clearMembers: () => void;
}

const defaultFilters: TeamFilters = {
  role: 'all',
  isActive: 'all',
  searchQuery: '',
};

export const useTeamStore = create<TeamState>()(
  persist(
    (set) => ({
      // Initial data
      members: [],
      selectedMember: null,

      // Initial filters
      filters: defaultFilters,

      // Initial loading states
      isLoading: false,
      isSubmitting: false,
      error: null,

      // Actions
      setMembers: (members) => set({ members, error: null }),

      addMember: (member) =>
        set((state) => ({
          members: [...state.members, member],
          error: null,
        })),

      updateMember: (id, updates) =>
        set((state) => ({
          members: state.members.map((member) =>
            member.id === id ? { ...member, ...updates } : member
          ),
          selectedMember:
            state.selectedMember?.id === id
              ? { ...state.selectedMember, ...updates }
              : state.selectedMember,
          error: null,
        })),

      deleteMember: (id) =>
        set((state) => ({
          members: state.members.filter((member) => member.id !== id),
          selectedMember:
            state.selectedMember?.id === id ? null : state.selectedMember,
          error: null,
        })),

      setSelectedMember: (member) => set({ selectedMember: member }),

      setFilters: (filters) =>
        set((state) => ({
          filters: { ...state.filters, ...filters },
        })),

      resetFilters: () => set({ filters: defaultFilters }),

      setLoading: (isLoading) => set({ isLoading }),

      setSubmitting: (isSubmitting) => set({ isSubmitting }),

      setError: (error) => set({ error }),

      clearMembers: () =>
        set({
          members: [],
          selectedMember: null,
          error: null,
        }),
    }),
    {
      name: 'team-storage',
      partialize: (state) => ({
        filters: state.filters,
      }),
    }
  )
);

// Selectors
export const selectFilteredMembers = (state: TeamState): TeamMember[] => {
  let filtered = state.members;

  if (state.filters.role !== 'all') {
    filtered = filtered.filter((m) => m.role === state.filters.role);
  }

  if (state.filters.isActive !== 'all') {
    filtered = filtered.filter((m) => m.is_active === state.filters.isActive);
  }

  if (state.filters.searchQuery) {
    const query = state.filters.searchQuery.toLowerCase();
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
  state: TeamState,
  role: TeamRole
): TeamMember[] => {
  return state.members.filter((m) => m.role === role);
};

export const selectActiveMembers = (state: TeamState): TeamMember[] => {
  return state.members.filter((m) => m.is_active);
};

export const selectMemberByUserId = (
  state: TeamState,
  userId: string
): TeamMember | undefined => {
  return state.members.find((m) => m.user_id === userId);
};

export const selectOwners = (state: TeamState): TeamMember[] => {
  return state.members.filter((m) => m.role === 'owner');
};

export const selectAdmins = (state: TeamState): TeamMember[] => {
  return state.members.filter((m) => m.role === 'admin' || m.role === 'owner');
};
