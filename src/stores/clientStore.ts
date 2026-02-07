import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Client, ClientTier } from '../types/database';

interface ClientFilters {
  tier: ClientTier | 'all';
  isActive: boolean | 'all';
  tags: string[];
  searchQuery: string;
}

interface PaginationState {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

interface ClientState {
  // UI State
  selectedClient: Client | null;

  // Filters
  filters: ClientFilters;

  // Search
  searchQuery: string;

  // Pagination
  pagination: PaginationState;

  // Loading states
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  // Actions
  setSelectedClient: (client: Client | null) => void;
  setFilters: (filters: Partial<ClientFilters>) => void;
  resetFilters: () => void;
  setSearchQuery: (query: string) => void;
  setPagination: (pagination: Partial<PaginationState>) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setLoading: (loading: boolean) => void;
  setSubmitting: (submitting: boolean) => void;
  setError: (error: string | null) => void;
}

const defaultFilters: ClientFilters = {
  tier: 'all',
  isActive: 'all',
  tags: [],
  searchQuery: '',
};

const defaultPagination: PaginationState = {
  page: 1,
  pageSize: 20,
  totalCount: 0,
  totalPages: 0,
};

export const useClientStore = create<ClientState>()(
  persist(
    (set) => ({
      // Initial UI state
      selectedClient: null,

      // Initial filters
      filters: defaultFilters,

      // Initial search
      searchQuery: '',

      // Initial pagination
      pagination: defaultPagination,

      // Initial loading states
      isLoading: false,
      isSubmitting: false,
      error: null,

      // Actions
      setSelectedClient: (client) => set({ selectedClient: client }),

      setFilters: (filters) =>
        set((state) => ({
          filters: { ...state.filters, ...filters },
          pagination: { ...state.pagination, page: 1 },
        })),

      resetFilters: () =>
        set({
          filters: defaultFilters,
          pagination: { ...defaultPagination },
        }),

      setSearchQuery: (searchQuery) =>
        set((state) => ({
          searchQuery,
          filters: { ...state.filters, searchQuery },
          pagination: { ...state.pagination, page: 1 },
        })),

      setPagination: (pagination) =>
        set((state) => ({
          pagination: { ...state.pagination, ...pagination },
        })),

      setPage: (page) =>
        set((state) => ({
          pagination: { ...state.pagination, page },
        })),

      setPageSize: (pageSize) =>
        set((state) => ({
          pagination: {
            ...state.pagination,
            pageSize,
            page: 1,
            totalPages: Math.ceil(state.pagination.totalCount / pageSize),
          },
        })),

      setLoading: (isLoading) => set({ isLoading }),

      setSubmitting: (isSubmitting) => set({ isSubmitting }),

      setError: (error) => set({ error }),
    }),
    {
      name: 'client-storage',
      partialize: (state) => ({
        filters: state.filters,
        pagination: { pageSize: state.pagination.pageSize },
      }),
    }
  )
);

// Selectors - take data as parameter, filters from store state
export const selectFilteredClients = (
  clients: Client[],
  filters: ClientFilters
): Client[] => {
  let filtered = clients;

  if (filters.tier !== 'all') {
    filtered = filtered.filter((c) => c.tier === filters.tier);
  }

  if (filters.isActive !== 'all') {
    filtered = filtered.filter((c) => c.is_active === filters.isActive);
  }

  if (filters.tags.length > 0) {
    filtered = filtered.filter((c) =>
      filters.tags.some((tag) => c.tags.includes(tag))
    );
  }

  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query) ||
        c.company?.toLowerCase().includes(query) ||
        c.phone?.includes(query)
    );
  }

  return filtered;
};

export const selectPaginatedClients = (
  clients: Client[],
  filters: ClientFilters,
  pagination: PaginationState
): Client[] => {
  const filtered = selectFilteredClients(clients, filters);
  const { page, pageSize } = pagination;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return filtered.slice(start, end);
};

export const selectClientsByTier = (
  clients: Client[],
  tier: ClientTier
): Client[] => {
  return clients.filter((c) => c.tier === tier);
};

export const selectActiveClients = (clients: Client[]): Client[] => {
  return clients.filter((c) => c.is_active);
};
