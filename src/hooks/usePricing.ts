import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pricingService } from '../services/pricing';
import type { PricingProductInsert, PricingProductUpdate, PricingType } from '../services/pricing';

// Query keys for pricing
export const pricingKeys = {
  all: ['pricing'] as const,
  lists: () => [...pricingKeys.all, 'list'] as const,
  list: (filters: object) => [...pricingKeys.lists(), filters] as const,
  details: () => [...pricingKeys.all, 'detail'] as const,
  detail: (id: string) => [...pricingKeys.details(), id] as const,
  byStudio: (studioId: string) => [...pricingKeys.all, 'studio', studioId] as const,
  active: (studioId: string) => [...pricingKeys.all, 'active', studioId] as const,
  byType: (studioId: string, type: PricingType) => [...pricingKeys.all, 'type', studioId, type] as const,
};

// Get all pricing products for a studio
export function usePricingProducts(studioId: string) {
  return useQuery({
    queryKey: pricingKeys.byStudio(studioId),
    queryFn: () => pricingService.getByStudioId(studioId),
    enabled: !!studioId,
  });
}

// Get active pricing products for a studio
export function useActivePricingProducts(studioId: string) {
  return useQuery({
    queryKey: pricingKeys.active(studioId),
    queryFn: () => pricingService.getActiveByStudioId(studioId),
    enabled: !!studioId,
  });
}

// Get pricing products by type
export function usePricingProductsByType(studioId: string, type: PricingType) {
  return useQuery({
    queryKey: pricingKeys.byType(studioId, type),
    queryFn: () => pricingService.getByType(studioId, type),
    enabled: !!studioId && !!type,
  });
}

// Get a single pricing product by ID
export function usePricingProduct(id: string) {
  return useQuery({
    queryKey: pricingKeys.detail(id),
    queryFn: () => pricingService.getById(id),
    enabled: !!id,
  });
}

// Create pricing product mutation
export function useCreatePricingProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (product: PricingProductInsert) => pricingService.create(product),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: pricingKeys.all });
      queryClient.invalidateQueries({ queryKey: pricingKeys.byStudio(data.studio_id) });
    },
  });
}

// Update pricing product mutation
export function useUpdatePricingProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PricingProductUpdate }) =>
      pricingService.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: pricingKeys.all });
      queryClient.invalidateQueries({ queryKey: pricingKeys.detail(variables.id) });
    },
  });
}

// Delete pricing product mutation
export function useDeletePricingProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => pricingService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricingKeys.all });
    },
  });
}

// Toggle pricing product active status
export function useTogglePricingProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => pricingService.toggleActive(id),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: pricingKeys.all });
      queryClient.invalidateQueries({ queryKey: pricingKeys.detail(variables) });
    },
  });
}

// Update sort order for pricing products
export function useUpdatePricingSortOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: { id: string; display_order: number }[]) =>
      pricingService.bulkUpdateSortOrder(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricingKeys.all });
    },
  });
}
