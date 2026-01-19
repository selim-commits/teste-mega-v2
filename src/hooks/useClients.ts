import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientService } from '../services';
import { queryKeys } from '../lib/queryClient';
import type { ClientInsert, ClientUpdate, ClientTier } from '../types/database';

export interface ClientFilters {
  studioId?: string;
  tier?: ClientTier;
  isActive?: boolean;
  tags?: string[];
}

// Get all clients with optional filters
export function useClients(filters?: ClientFilters) {
  return useQuery({
    queryKey: queryKeys.clients.list(filters || {}),
    queryFn: async () => {
      if (filters?.studioId && filters?.tier) {
        return clientService.getByTier(filters.studioId, filters.tier);
      }
      if (filters?.studioId && filters?.tags && filters.tags.length > 0) {
        return clientService.getByTags(filters.studioId, filters.tags);
      }
      if (filters?.studioId && filters?.isActive !== undefined) {
        return filters.isActive
          ? clientService.getActiveByStudioId(filters.studioId)
          : clientService.getByStudioId(filters.studioId);
      }
      if (filters?.studioId) {
        return clientService.getByStudioId(filters.studioId);
      }
      return clientService.getAll();
    },
  });
}

// Get active clients only
export function useActiveClients(studioId: string) {
  return useQuery({
    queryKey: [...queryKeys.clients.list({ studioId }), 'active'],
    queryFn: () => clientService.getActiveByStudioId(studioId),
    enabled: !!studioId,
  });
}

// Get a single client by ID
export function useClient(id: string) {
  return useQuery({
    queryKey: queryKeys.clients.detail(id),
    queryFn: () => clientService.getById(id),
    enabled: !!id,
  });
}

// Search clients
export function useSearchClients(studioId: string, query: string) {
  return useQuery({
    queryKey: queryKeys.clients.search(studioId, query),
    queryFn: () => clientService.search(studioId, query),
    enabled: !!studioId && !!query && query.length >= 2,
    staleTime: 1000 * 30, // 30 seconds for search results
  });
}

// Get client by email
export function useClientByEmail(studioId: string, email: string) {
  return useQuery({
    queryKey: [...queryKeys.clients.all, 'byEmail', studioId, email],
    queryFn: () => clientService.getByEmail(studioId, email),
    enabled: !!studioId && !!email,
  });
}

// Create client mutation
export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (client: Omit<ClientInsert, 'id' | 'created_at' | 'updated_at'>) =>
      clientService.create(client),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all });
    },
  });
}

// Update client mutation
export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ClientUpdate }) =>
      clientService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(variables.id) });
    },
  });
}

// Delete client mutation
export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => clientService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all });
    },
  });
}

// Update client tier mutation
export function useUpdateClientTier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, tier }: { id: string; tier: ClientTier }) =>
      clientService.updateTier(id, tier),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(variables.id) });
    },
  });
}

// Update client score mutation
export function useUpdateClientScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, score }: { id: string; score: number }) =>
      clientService.updateScore(id, score),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(variables.id) });
    },
  });
}

// Add tags mutation
export function useAddClientTags() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, tags }: { id: string; tags: string[] }) =>
      clientService.addTags(id, tags),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(variables.id) });
    },
  });
}

// Remove tags mutation
export function useRemoveClientTags() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, tags }: { id: string; tags: string[] }) =>
      clientService.removeTags(id, tags),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(variables.id) });
    },
  });
}

// Deactivate client mutation
export function useDeactivateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => clientService.deactivate(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(id) });
    },
  });
}

// Activate client mutation
export function useActivateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => clientService.activate(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(id) });
    },
  });
}
