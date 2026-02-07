import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { equipmentService } from '../services';
import { queryKeys } from '../lib/queryClient';
import { isDemoMode, withDemoMode } from '../lib/supabase';
import { mockEquipment, getMockMaintenanceEquipment } from '../lib/mockData';
import type { Equipment, EquipmentInsert, EquipmentUpdate, EquipmentStatus } from '../types/database';

export interface EquipmentFilters {
  studioId?: string;
  category?: string;
  status?: EquipmentStatus;
}

// Get all equipment with optional filters
export function useEquipment(filters?: EquipmentFilters) {
  return useQuery({
    queryKey: queryKeys.equipment.list(filters || {}),
    queryFn: async (): Promise<Equipment[]> => {
      // Return mock data in demo mode
      if (isDemoMode) {
        let result = [...mockEquipment] as Equipment[];
        if (filters?.status) {
          result = result.filter(e => e.status === filters.status);
        }
        if (filters?.category) {
          result = result.filter(e => e.category === filters.category);
        }
        return result;
      }

      if (filters?.studioId && filters?.status) {
        return equipmentService.getByStatus(filters.studioId, filters.status);
      }
      if (filters?.studioId && filters?.category) {
        return equipmentService.getByCategory(filters.studioId, filters.category);
      }
      if (filters?.studioId) {
        return equipmentService.getByStudioId(filters.studioId);
      }
      return equipmentService.getAll();
    },
  });
}

// Get available equipment only
export function useAvailableEquipment(studioId: string) {
  return useQuery({
    queryKey: [...queryKeys.equipment.list({ studioId }), 'available'],
    queryFn: () => equipmentService.getAvailable(studioId),
    enabled: !!studioId,
  });
}

// Get equipment needing maintenance
export function useMaintenanceNeeded(studioId: string) {
  return useQuery({
    queryKey: [...queryKeys.equipment.list({ studioId }), 'maintenance'],
    queryFn: withDemoMode(getMockMaintenanceEquipment() as Equipment[])(
      () => equipmentService.getMaintenanceNeeded(studioId)
    ),
    enabled: !!studioId,
  });
}

// Get a single equipment item by ID
export function useEquipmentItem(id: string) {
  return useQuery({
    queryKey: queryKeys.equipment.detail(id),
    queryFn: () => equipmentService.getById(id),
    enabled: !!id,
  });
}

// Get equipment by QR code
export function useEquipmentByQrCode(qrCode: string) {
  return useQuery({
    queryKey: [...queryKeys.equipment.all, 'qr', qrCode],
    queryFn: () => equipmentService.getByQrCode(qrCode),
    enabled: !!qrCode,
  });
}

// Get equipment by serial number
export function useEquipmentBySerialNumber(studioId: string, serialNumber: string) {
  return useQuery({
    queryKey: [...queryKeys.equipment.all, 'serial', studioId, serialNumber],
    queryFn: () => equipmentService.getBySerialNumber(studioId, serialNumber),
    enabled: !!studioId && !!serialNumber,
  });
}

// Get equipment categories
export function useEquipmentCategories(studioId: string) {
  return useQuery({
    queryKey: queryKeys.equipment.categories(studioId),
    queryFn: () => equipmentService.getCategories(studioId),
    enabled: !!studioId,
  });
}

// Search equipment
export function useSearchEquipment(studioId: string, query: string) {
  return useQuery({
    queryKey: [...queryKeys.equipment.all, 'search', studioId, query],
    queryFn: () => equipmentService.search(studioId, query),
    enabled: !!studioId && !!query && query.length >= 2,
    staleTime: 1000 * 30,
  });
}

// Create equipment mutation
export function useCreateEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (equipment: Omit<EquipmentInsert, 'id' | 'created_at' | 'updated_at'>) =>
      equipmentService.create(equipment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.equipment.all });
    },
    onError: (error: Error) => {
      console.error('Mutation failed:', error.message);
    },
  });
}

// Update equipment mutation
export function useUpdateEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EquipmentUpdate }) =>
      equipmentService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.equipment.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.equipment.detail(variables.id) });
    },
    onError: (error: Error) => {
      console.error('Mutation failed:', error.message);
    },
  });
}

// Delete equipment mutation
export function useDeleteEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => equipmentService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.equipment.all });
    },
    onError: (error: Error) => {
      console.error('Mutation failed:', error.message);
    },
  });
}

// Update equipment status mutation
export function useUpdateEquipmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: EquipmentStatus }) =>
      equipmentService.updateStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.equipment.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.equipment.detail(variables.id) });
    },
    onError: (error: Error) => {
      console.error('Mutation failed:', error.message);
    },
  });
}

// Update equipment condition mutation
export function useUpdateEquipmentCondition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, condition }: { id: string; condition: number }) =>
      equipmentService.updateCondition(id, condition),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.equipment.detail(variables.id) });
    },
    onError: (error: Error) => {
      console.error('Mutation failed:', error.message);
    },
  });
}

// Update equipment location mutation
export function useUpdateEquipmentLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, location }: { id: string; location: string }) =>
      equipmentService.updateLocation(id, location),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.equipment.detail(variables.id) });
    },
    onError: (error: Error) => {
      console.error('Mutation failed:', error.message);
    },
  });
}

// Retire equipment mutation
export function useRetireEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => equipmentService.retire(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.equipment.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.equipment.detail(id) });
    },
    onError: (error: Error) => {
      console.error('Mutation failed:', error.message);
    },
  });
}

// Set equipment for maintenance mutation
export function useSetEquipmentForMaintenance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => equipmentService.setForMaintenance(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.equipment.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.equipment.detail(id) });
    },
    onError: (error: Error) => {
      console.error('Mutation failed:', error.message);
    },
  });
}
