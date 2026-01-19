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
  // Data
  clients: Client[];
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
  setClients: (clients: Client[]) => void;
  addClient: (client: Client) => void;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;
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
  clearClients: () => void;
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
      // Initial data
      clients: [],
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
      setClients: (clients) =>
        set({
          clients,
          error: null,
          pagination: {
            ...defaultPagination,
            totalCount: clients.length,
            totalPages: Math.ceil(clients.length / defaultPagination.pageSize),
          },
        }),

      addClient: (client) =>
        set((state) => ({
          clients: [...state.clients, client],
          pagination: {
            ...state.pagination,
            totalCount: state.pagination.totalCount + 1,
            totalPages: Math.ceil(
              (state.pagination.totalCount + 1) / state.pagination.pageSize
            ),
          },
          error: null,
        })),

      updateClient: (id, updates) =>
        set((state) => ({
          clients: state.clients.map((client) =>
            client.id === id ? { ...client, ...updates } : client
          ),
          selectedClient:
            state.selectedClient?.id === id
              ? { ...state.selectedClient, ...updates }
              : state.selectedClient,
          error: null,
        })),

      deleteClient: (id) =>
        set((state) => ({
          clients: state.clients.filter((client) => client.id !== id),
          selectedClient:
            state.selectedClient?.id === id ? null : state.selectedClient,
          pagination: {
            ...state.pagination,
            totalCount: state.pagination.totalCount - 1,
            totalPages: Math.ceil(
              (state.pagination.totalCount - 1) / state.pagination.pageSize
            ),
          },
          error: null,
        })),

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

      clearClients: () =>
        set({
          clients: [],
          selectedClient: null,
          pagination: defaultPagination,
          error: null,
        }),
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

// Selectors
export const selectFilteredClients = (state: ClientState): Client[] => {
  let filtered = state.clients;

  if (state.filters.tier !== 'all') {
    filtered = filtered.filter((c) => c.tier === state.filters.tier);
  }

  if (state.filters.isActive !== 'all') {
    filtered = filtered.filter((c) => c.is_active === state.filters.isActive);
  }

  if (state.filters.tags.length > 0) {
    filtered = filtered.filter((c) =>
      state.filters.tags.some((tag) => c.tags.includes(tag))
    );
  }

  if (state.filters.searchQuery) {
    const query = state.filters.searchQuery.toLowerCase();
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

export const selectPaginatedClients = (state: ClientState): Client[] => {
  const filtered = selectFilteredClients(state);
  const { page, pageSize } = state.pagination;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return filtered.slice(start, end);
};

export const selectClientsByTier = (
  state: ClientState,
  tier: ClientTier
): Client[] => {
  return state.clients.filter((c) => c.tier === tier);
};

export const selectActiveClients = (state: ClientState): Client[] => {
  return state.clients.filter((c) => c.is_active);
};
