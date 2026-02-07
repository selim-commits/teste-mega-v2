import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { spaceService } from '../services/spaces';
import { withDemoMode } from '../lib/supabase';
import { mockSpaces } from '../lib/mockData';
import type { Space, SpaceInsert, SpaceUpdate } from '../types/database';

export interface SpaceFilters {
  studioId?: string;
  isActive?: boolean;
}

// Query keys for spaces
export const spaceQueryKeys = {
  all: ['spaces'] as const,
  lists: () => [...spaceQueryKeys.all, 'list'] as const,
  list: (filters: object) => [...spaceQueryKeys.lists(), filters] as const,
  details: () => [...spaceQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...spaceQueryKeys.details(), id] as const,
};

// Get all spaces with optional filters
export function useSpaces(filters?: SpaceFilters) {
  return useQuery({
    queryKey: spaceQueryKeys.list(filters || {}),
    queryFn: async () => {
      if (filters?.studioId && filters?.isActive !== undefined) {
        return filters.isActive
          ? spaceService.getActiveByStudioId(filters.studioId)
          : spaceService.getByStudioId(filters.studioId);
      }
      if (filters?.studioId) {
        return spaceService.getByStudioId(filters.studioId);
      }
      return spaceService.getAll(filters);
    },
    enabled: !filters?.studioId || !!filters.studioId,
  });
}

// Get active spaces for a studio
export function useActiveSpaces(studioId: string) {
  return useQuery({
    queryKey: [...spaceQueryKeys.list({ studioId }), 'active'],
    queryFn: withDemoMode((mockSpaces as Space[]).filter(s => s.is_active))(
      () => spaceService.getActiveByStudioId(studioId)
    ),
    enabled: !!studioId,
  });
}

// Get a single space by ID
export function useSpace(id: string) {
  return useQuery({
    queryKey: spaceQueryKeys.detail(id),
    queryFn: () => spaceService.getById(id),
    enabled: !!id,
  });
}

// Create space mutation
export function useCreateSpace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (space: Omit<SpaceInsert, 'id' | 'created_at' | 'updated_at'>) =>
      spaceService.create(space),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: spaceQueryKeys.all });
    },
    onError: (error: Error) => {
      console.error('Mutation failed:', error.message);
    },
  });
}

// Update space mutation
export function useUpdateSpace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SpaceUpdate }) =>
      spaceService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: spaceQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: spaceQueryKeys.detail(variables.id) });
    },
    onError: (error: Error) => {
      console.error('Mutation failed:', error.message);
    },
  });
}

// Delete space mutation
export function useDeleteSpace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => spaceService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: spaceQueryKeys.all });
    },
    onError: (error: Error) => {
      console.error('Mutation failed:', error.message);
    },
  });
}

// Toggle space active status
export function useToggleSpaceActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      spaceService.toggleActive(id, isActive),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: spaceQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: spaceQueryKeys.detail(variables.id) });
    },
    onError: (error: Error) => {
      console.error('Mutation failed:', error.message);
    },
  });
}
