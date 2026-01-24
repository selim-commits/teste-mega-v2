import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { packService, clientPurchaseService, packStatsService } from '../services/packs';
import type { PackFilters, ClientPurchaseFilters } from '../services/packs';
import type { Pack, PackInsert, PackUpdate, ClientPurchase, ClientPurchaseInsert, ClientPurchaseUpdate, PricingProductType, SubscriptionStatus } from '../types/database';
import { isDemoMode } from '../lib/supabase';
import { mockPacks, mockClientPurchases, calculateMockPackStats } from '../lib/mockData';

// Query keys for packs
export const packQueryKeys = {
  all: ['packs'] as const,
  lists: () => [...packQueryKeys.all, 'list'] as const,
  list: (filters: object) => [...packQueryKeys.lists(), filters] as const,
  details: () => [...packQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...packQueryKeys.details(), id] as const,
  stats: (studioId: string) => [...packQueryKeys.all, 'stats', studioId] as const,
};

export const purchaseQueryKeys = {
  all: ['purchases'] as const,
  lists: () => [...purchaseQueryKeys.all, 'list'] as const,
  list: (filters: object) => [...purchaseQueryKeys.lists(), filters] as const,
  details: () => [...purchaseQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...purchaseQueryKeys.details(), id] as const,
  byClient: (clientId: string) => [...purchaseQueryKeys.all, 'client', clientId] as const,
};

// =====================
// PACK HOOKS
// =====================

// Get all packs with optional filters
export function usePacks(filters?: PackFilters) {
  return useQuery({
    queryKey: packQueryKeys.list(filters || {}),
    queryFn: async (): Promise<Pack[]> => {
      // Return mock data in demo mode
      if (isDemoMode) {
        let result = [...mockPacks] as Pack[];
        if (filters?.type) {
          result = result.filter(p => p.type === filters.type);
        }
        if (filters?.isActive === true) {
          result = result.filter(p => p.is_active);
        }
        return result;
      }

      if (filters?.studioId) {
        if (filters?.type) {
          return packService.getByType(filters.studioId, filters.type);
        }
        if (filters?.isActive === true) {
          return packService.getActiveByStudioId(filters.studioId);
        }
        return packService.getByStudioId(filters.studioId);
      }
      return packService.getAll(filters);
    },
    enabled: !filters?.studioId || !!filters.studioId,
  });
}

// Get packs by type
export function usePacksByType(studioId: string, type: PricingProductType) {
  return useQuery({
    queryKey: [...packQueryKeys.list({ studioId }), 'type', type],
    queryFn: (): Promise<Pack[]> => {
      if (isDemoMode) {
        return Promise.resolve((mockPacks as Pack[]).filter(p => p.type === type));
      }
      return packService.getByType(studioId, type);
    },
    enabled: !!studioId,
  });
}

// Get active packs for a studio
export function useActivePacks(studioId: string) {
  return useQuery({
    queryKey: [...packQueryKeys.list({ studioId }), 'active'],
    queryFn: (): Promise<Pack[]> => {
      if (isDemoMode) {
        return Promise.resolve((mockPacks as Pack[]).filter(p => p.is_active));
      }
      return packService.getActiveByStudioId(studioId);
    },
    enabled: !!studioId,
  });
}

// Get a single pack by ID
export function usePack(id: string) {
  return useQuery({
    queryKey: packQueryKeys.detail(id),
    queryFn: (): Promise<Pack | null> => {
      if (isDemoMode) {
        const pack = mockPacks.find(p => p.id === id);
        return Promise.resolve(pack as Pack | null);
      }
      return packService.getById(id);
    },
    enabled: !!id,
  });
}

// Get pack stats for a studio
export function usePackStats(studioId: string) {
  return useQuery({
    queryKey: packQueryKeys.stats(studioId),
    queryFn: () => {
      if (isDemoMode) {
        return Promise.resolve(calculateMockPackStats());
      }
      return packStatsService.getPackStats(studioId);
    },
    enabled: !!studioId,
  });
}

// Create pack mutation
export function useCreatePack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pack: Omit<PackInsert, 'id' | 'created_at' | 'updated_at'>) =>
      packService.create(pack),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: packQueryKeys.all });
    },
  });
}

// Update pack mutation
export function useUpdatePack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PackUpdate }) =>
      packService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: packQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: packQueryKeys.detail(variables.id) });
    },
  });
}

// Delete pack mutation
export function useDeletePack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => packService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: packQueryKeys.all });
    },
  });
}

// Toggle pack active status
export function useTogglePackActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      packService.toggleActive(id, isActive),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: packQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: packQueryKeys.detail(variables.id) });
    },
  });
}

// Toggle pack featured status
export function useTogglePackFeatured() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isFeatured }: { id: string; isFeatured: boolean }) =>
      packService.toggleFeatured(id, isFeatured),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: packQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: packQueryKeys.detail(variables.id) });
    },
  });
}

// Update pack display order
export function useUpdatePackOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, displayOrder }: { id: string; displayOrder: number }) =>
      packService.updateDisplayOrder(id, displayOrder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: packQueryKeys.all });
    },
  });
}

// =====================
// CLIENT PURCHASE HOOKS
// =====================

// Get all client purchases with optional filters
export function useClientPurchases(filters?: ClientPurchaseFilters) {
  return useQuery({
    queryKey: purchaseQueryKeys.list(filters || {}),
    queryFn: (): Promise<ClientPurchase[]> => {
      if (isDemoMode) {
        let result = [...mockClientPurchases] as ClientPurchase[];
        if (filters?.clientId) {
          result = result.filter(p => p.client_id === filters.clientId);
        }
        if (filters?.status) {
          result = result.filter(p => p.status === filters.status);
        }
        return Promise.resolve(result);
      }
      return clientPurchaseService.getAll(filters);
    },
    enabled: true,
  });
}

// Get purchases by client
export function usePurchasesByClient(clientId: string) {
  return useQuery({
    queryKey: purchaseQueryKeys.byClient(clientId),
    queryFn: (): Promise<ClientPurchase[]> => {
      if (isDemoMode) {
        return Promise.resolve(
          (mockClientPurchases as ClientPurchase[]).filter(p => p.client_id === clientId)
        );
      }
      return clientPurchaseService.getByClientId(clientId);
    },
    enabled: !!clientId,
  });
}

// Get active purchases by client
export function useActivePurchasesByClient(clientId: string) {
  return useQuery({
    queryKey: [...purchaseQueryKeys.byClient(clientId), 'active'],
    queryFn: (): Promise<ClientPurchase[]> => {
      if (isDemoMode) {
        return Promise.resolve(
          (mockClientPurchases as ClientPurchase[]).filter(
            p => p.client_id === clientId && p.status === 'active'
          )
        );
      }
      return clientPurchaseService.getActiveByClientId(clientId);
    },
    enabled: !!clientId,
  });
}

// Get a single purchase by ID
export function useClientPurchase(id: string) {
  return useQuery({
    queryKey: purchaseQueryKeys.detail(id),
    queryFn: (): Promise<ClientPurchase | null> => {
      if (isDemoMode) {
        const purchase = mockClientPurchases.find(p => p.id === id);
        return Promise.resolve(purchase as ClientPurchase | null);
      }
      return clientPurchaseService.getById(id);
    },
    enabled: !!id,
  });
}

// Get active subscriptions for a studio
export function useActiveSubscriptions(studioId: string) {
  return useQuery({
    queryKey: [...purchaseQueryKeys.list({ studioId }), 'active'],
    queryFn: (): Promise<ClientPurchase[]> => {
      if (isDemoMode) {
        return Promise.resolve(
          (mockClientPurchases as ClientPurchase[]).filter(p => p.status === 'active')
        );
      }
      return clientPurchaseService.getActiveSubscriptions(studioId);
    },
    enabled: !!studioId,
  });
}

// Create purchase mutation
export function useCreatePurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (purchase: Omit<ClientPurchaseInsert, 'id' | 'created_at' | 'updated_at'>) =>
      clientPurchaseService.create(purchase),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: packQueryKeys.all });
    },
  });
}

// Update purchase mutation
export function useUpdatePurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ClientPurchaseUpdate }) =>
      clientPurchaseService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: purchaseQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: purchaseQueryKeys.detail(variables.id) });
    },
  });
}

// Update purchase status mutation
export function useUpdatePurchaseStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: SubscriptionStatus }) =>
      clientPurchaseService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: packQueryKeys.all });
    },
  });
}

// Pause subscription mutation
export function usePauseSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, pauseEndsAt }: { id: string; pauseEndsAt?: string }) =>
      clientPurchaseService.pauseSubscription(id, pauseEndsAt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseQueryKeys.all });
    },
  });
}

// Resume subscription mutation
export function useResumeSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => clientPurchaseService.resumeSubscription(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseQueryKeys.all });
    },
  });
}
