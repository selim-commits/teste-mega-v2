import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
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

  // Widget Configs
  widgetConfigs: {
    all: ['widgetConfigs'] as const,
    lists: () => [...queryKeys.widgetConfigs.all, 'list'] as const,
    details: () => [...queryKeys.widgetConfigs.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.widgetConfigs.details(), id] as const,
    byStudio: (studioId: string) => [...queryKeys.widgetConfigs.all, 'studio', studioId] as const,
    byType: (studioId: string, type: string) => [...queryKeys.widgetConfigs.all, 'type', studioId, type] as const,
  },

  // Pricing Products
  pricing: {
    all: ['pricing'] as const,
    lists: () => [...queryKeys.pricing.all, 'list'] as const,
    details: () => [...queryKeys.pricing.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.pricing.details(), id] as const,
    byStudio: (studioId: string) => [...queryKeys.pricing.all, 'studio', studioId] as const,
    active: (studioId: string) => [...queryKeys.pricing.all, 'active', studioId] as const,
    byType: (studioId: string, type: string) => [...queryKeys.pricing.all, 'type', studioId, type] as const,
  },

  // Wallets
  wallets: {
    all: ['wallets'] as const,
    details: () => [...queryKeys.wallets.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.wallets.details(), id] as const,
    byClient: (clientId: string, studioId: string) => [...queryKeys.wallets.all, 'client', clientId, studioId] as const,
    byStudio: (studioId: string) => [...queryKeys.wallets.all, 'studio', studioId] as const,
    transactions: (walletId: string) => [...queryKeys.wallets.all, 'transactions', walletId] as const,
  },

  // Purchases
  purchases: {
    all: ['purchases'] as const,
    lists: () => [...queryKeys.purchases.all, 'list'] as const,
    list: (filters: object) => [...queryKeys.purchases.lists(), filters] as const,
    details: () => [...queryKeys.purchases.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.purchases.details(), id] as const,
    byClient: (clientId: string) => [...queryKeys.purchases.all, 'client', clientId] as const,
    byStudio: (studioId: string) => [...queryKeys.purchases.all, 'studio', studioId] as const,
    activeByClient: (clientId: string) => [...queryKeys.purchases.all, 'active', clientId] as const,
  },

  // Subscriptions
  subscriptions: {
    all: ['subscriptions'] as const,
    detail: (id: string) => [...queryKeys.subscriptions.all, 'detail', id] as const,
    byClient: (clientId: string) => [...queryKeys.subscriptions.all, 'client', clientId] as const,
    active: (clientId: string) => [...queryKeys.subscriptions.all, 'active', clientId] as const,
  },

  // Gift Certificates
  giftCertificates: {
    all: ['giftCertificates'] as const,
    byStudio: (studioId: string) => [...queryKeys.giftCertificates.all, 'studio', studioId] as const,
    byCode: (studioId: string, code: string) => [...queryKeys.giftCertificates.all, 'code', studioId, code] as const,
  },

  // Chat
  chat: {
    all: ['chat'] as const,
    conversations: () => [...queryKeys.chat.all, 'conversations'] as const,
    conversationList: (studioId: string, filters?: object) =>
      [...queryKeys.chat.conversations(), 'list', studioId, filters] as const,
    conversationDetail: (id: string) =>
      [...queryKeys.chat.conversations(), 'detail', id] as const,
    conversationWithMessages: (id: string) =>
      [...queryKeys.chat.conversations(), 'withMessages', id] as const,
    messages: (conversationId: string) =>
      [...queryKeys.chat.all, 'messages', conversationId] as const,
    unreadCount: (studioId: string) =>
      [...queryKeys.chat.all, 'unread', studioId] as const,
    conversationCounts: (studioId: string) =>
      [...queryKeys.chat.all, 'counts', studioId] as const,
  },

  // Packs
  packs: {
    all: ['packs'] as const,
    lists: () => [...queryKeys.packs.all, 'list'] as const,
    list: (filters: object) => [...queryKeys.packs.lists(), filters] as const,
    details: () => [...queryKeys.packs.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.packs.details(), id] as const,
    stats: (studioId: string) => [...queryKeys.packs.all, 'stats', studioId] as const,
  },
} as const;
