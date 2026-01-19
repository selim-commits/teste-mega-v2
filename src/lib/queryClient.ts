import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

// Query key factory for consistent key management
export const queryKeys = {
  // Bookings
  bookings: {
    all: ['bookings'] as const,
    lists: () => [...queryKeys.bookings.all, 'list'] as const,
    list: (filters: object) => [...queryKeys.bookings.lists(), filters] as const,
    details: () => [...queryKeys.bookings.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.bookings.details(), id] as const,
  },

  // Clients
  clients: {
    all: ['clients'] as const,
    lists: () => [...queryKeys.clients.all, 'list'] as const,
    list: (filters: object) => [...queryKeys.clients.lists(), filters] as const,
    details: () => [...queryKeys.clients.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.clients.details(), id] as const,
    search: (studioId: string, query: string) => [...queryKeys.clients.all, 'search', studioId, query] as const,
  },

  // Equipment
  equipment: {
    all: ['equipment'] as const,
    lists: () => [...queryKeys.equipment.all, 'list'] as const,
    list: (filters: object) => [...queryKeys.equipment.lists(), filters] as const,
    details: () => [...queryKeys.equipment.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.equipment.details(), id] as const,
    categories: (studioId: string) => [...queryKeys.equipment.all, 'categories', studioId] as const,
  },

  // Invoices
  invoices: {
    all: ['invoices'] as const,
    lists: () => [...queryKeys.invoices.all, 'list'] as const,
    list: (filters: object) => [...queryKeys.invoices.lists(), filters] as const,
    details: () => [...queryKeys.invoices.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.invoices.details(), id] as const,
    overdue: (studioId: string) => [...queryKeys.invoices.all, 'overdue', studioId] as const,
    pending: (studioId: string) => [...queryKeys.invoices.all, 'pending', studioId] as const,
  },

  // Payments
  payments: {
    all: ['payments'] as const,
    lists: () => [...queryKeys.payments.all, 'list'] as const,
    list: (filters: object) => [...queryKeys.payments.lists(), filters] as const,
    details: () => [...queryKeys.payments.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.payments.details(), id] as const,
    byInvoice: (invoiceId: string) => [...queryKeys.payments.all, 'byInvoice', invoiceId] as const,
  },

  // Team
  team: {
    all: ['team'] as const,
    lists: () => [...queryKeys.team.all, 'list'] as const,
    list: (filters: object) => [...queryKeys.team.lists(), filters] as const,
    details: () => [...queryKeys.team.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.team.details(), id] as const,
    byUser: (userId: string) => [...queryKeys.team.all, 'byUser', userId] as const,
  },

  // Studios
  studios: {
    all: ['studios'] as const,
    lists: () => [...queryKeys.studios.all, 'list'] as const,
    details: () => [...queryKeys.studios.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.studios.details(), id] as const,
    bySlug: (slug: string) => [...queryKeys.studios.all, 'bySlug', slug] as const,
    byOwner: (ownerId: string) => [...queryKeys.studios.all, 'byOwner', ownerId] as const,
  },

  // Dashboard Stats
  stats: {
    all: ['stats'] as const,
    dashboard: (studioId: string, startDate?: string, endDate?: string) =>
      [...queryKeys.stats.all, 'dashboard', studioId, startDate, endDate] as const,
    revenue: (studioId: string, period: string) =>
      [...queryKeys.stats.all, 'revenue', studioId, period] as const,
    topClients: (studioId: string) => [...queryKeys.stats.all, 'topClients', studioId] as const,
  },
} as const;
