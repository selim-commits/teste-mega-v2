import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamService } from '../services';
import { queryKeys } from '../lib/queryClient';
import { isDemoMode } from '../lib/supabase';
import { mockTeamMembers } from '../lib/mockData';
import type { TeamMember, TeamMemberInsert, TeamMemberUpdate, TeamRole, Json } from '../types/database';

export interface TeamFilters {
  studioId?: string;
  role?: TeamRole;
  isActive?: boolean;
}

// Get all team members with optional filters
export function useTeamMembers(filters?: TeamFilters) {
  return useQuery({
    queryKey: queryKeys.team.list(filters || {}),
    queryFn: async () => {
      if (filters?.studioId && filters?.role) {
        return teamService.getByRole(filters.studioId, filters.role);
      }
      if (filters?.studioId && filters?.isActive !== undefined) {
        return filters.isActive
          ? teamService.getActiveByStudioId(filters.studioId)
          : teamService.getByStudioId(filters.studioId);
      }
      if (filters?.studioId) {
        return teamService.getByStudioId(filters.studioId);
      }
      return teamService.getAll();
    },
  });
}

// Get active team members only
export function useActiveTeamMembers(studioId: string) {
  return useQuery({
    queryKey: [...queryKeys.team.list({ studioId }), 'active'],
    queryFn: () => teamService.getActiveByStudioId(studioId),
    enabled: !!studioId,
  });
}

// Get a single team member by ID
export function useTeamMember(id: string) {
  return useQuery({
    queryKey: queryKeys.team.detail(id),
    queryFn: () => teamService.getById(id),
    enabled: !!id,
  });
}

// Get team members by user ID (across all studios)
export function useTeamMembersByUser(userId: string) {
  return useQuery({
    queryKey: queryKeys.team.byUser(userId),
    queryFn: (): Promise<TeamMember[]> => {
      if (isDemoMode) {
        // Return the first mock team member (admin) for demo mode
        return Promise.resolve((mockTeamMembers as TeamMember[]).slice(0, 1));
      }
      return teamService.getByUserId(userId);
    },
    enabled: !!userId,
  });
}

// Get team member by studio and user
export function useTeamMemberByStudioAndUser(studioId: string, userId: string) {
  return useQuery({
    queryKey: [...queryKeys.team.all, 'byStudioAndUser', studioId, userId],
    queryFn: () => teamService.getByStudioAndUser(studioId, userId),
    enabled: !!studioId && !!userId,
  });
}

// Get team member by email
export function useTeamMemberByEmail(studioId: string, email: string) {
  return useQuery({
    queryKey: [...queryKeys.team.all, 'byEmail', studioId, email],
    queryFn: () => teamService.getByEmail(studioId, email),
    enabled: !!studioId && !!email,
  });
}

// Get studio owner
export function useStudioOwner(studioId: string) {
  return useQuery({
    queryKey: [...queryKeys.team.list({ studioId }), 'owner'],
    queryFn: () => teamService.getOwner(studioId),
    enabled: !!studioId,
  });
}

// Get studio admins
export function useStudioAdmins(studioId: string) {
  return useQuery({
    queryKey: [...queryKeys.team.list({ studioId }), 'admins'],
    queryFn: () => teamService.getAdmins(studioId),
    enabled: !!studioId,
  });
}

// Search team members
export function useSearchTeamMembers(studioId: string, query: string) {
  return useQuery({
    queryKey: [...queryKeys.team.all, 'search', studioId, query],
    queryFn: () => teamService.search(studioId, query),
    enabled: !!studioId && !!query && query.length >= 2,
    staleTime: 1000 * 30,
  });
}

// Check permission
export function useHasPermission(memberId: string, permission: string) {
  return useQuery({
    queryKey: [...queryKeys.team.detail(memberId), 'permission', permission],
    queryFn: () => teamService.hasPermission(memberId, permission),
    enabled: !!memberId && !!permission,
  });
}

// Create team member mutation
export function useCreateTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (member: Omit<TeamMemberInsert, 'id' | 'created_at' | 'updated_at'>) =>
      teamService.create(member),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.team.all });
    },
  });
}

// Update team member mutation
export function useUpdateTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TeamMemberUpdate }) =>
      teamService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.team.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.team.detail(variables.id) });
    },
  });
}

// Delete team member mutation
export function useDeleteTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => teamService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.team.all });
    },
  });
}

// Update team member role mutation
export function useUpdateTeamMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: TeamRole }) =>
      teamService.updateRole(id, role),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.team.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.team.detail(variables.id) });
    },
  });
}

// Update team member permissions mutation
export function useUpdateTeamMemberPermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, permissions }: { id: string; permissions: Json }) =>
      teamService.updatePermissions(id, permissions),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.team.detail(variables.id) });
    },
  });
}

// Deactivate team member mutation
export function useDeactivateTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => teamService.deactivate(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.team.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.team.detail(id) });
    },
  });
}

// Activate team member mutation
export function useActivateTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => teamService.activate(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.team.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.team.detail(id) });
    },
  });
}
