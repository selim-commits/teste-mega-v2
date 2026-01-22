import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService, type StudioSettings } from '../services/settings';
import type { Studio } from '../types/database';

// Query keys for settings
export const settingsKeys = {
  all: ['settings'] as const,
  studio: (studioId: string) => [...settingsKeys.all, studioId] as const,
  settings: (studioId: string) => [...settingsKeys.studio(studioId), 'settings'] as const,
};

// Get studio with all settings
export function useStudioSettings(studioId: string) {
  return useQuery({
    queryKey: settingsKeys.studio(studioId),
    queryFn: () => settingsService.getStudioWithSettings(studioId),
    enabled: !!studioId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Get settings only
export function useSettings(studioId: string) {
  return useQuery({
    queryKey: settingsKeys.settings(studioId),
    queryFn: () => settingsService.getSettings(studioId),
    enabled: !!studioId,
    staleTime: 1000 * 60 * 5,
  });
}

// Update profile mutation
export function useUpdateProfile(studioId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (profile: Parameters<typeof settingsService.updateProfile>[1]) =>
      settingsService.updateProfile(studioId, profile),
    onMutate: async (newProfile) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: settingsKeys.studio(studioId) });

      // Snapshot previous value
      const previousStudio = queryClient.getQueryData<Studio>(settingsKeys.studio(studioId));

      // Optimistically update
      if (previousStudio) {
        queryClient.setQueryData<Studio>(settingsKeys.studio(studioId), {
          ...previousStudio,
          ...newProfile,
          settings: {
            ...(previousStudio.settings as StudioSettings),
            profile: {
              ...((previousStudio.settings as StudioSettings)?.profile || {}),
              description: newProfile.description,
              logoUrl: newProfile.logoUrl,
              coverUrl: newProfile.coverUrl,
              website: newProfile.website,
            },
          },
        });
      }

      return { previousStudio };
    },
    onError: (_err, _newProfile, context) => {
      // Rollback on error
      if (context?.previousStudio) {
        queryClient.setQueryData(settingsKeys.studio(studioId), context.previousStudio);
      }
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: settingsKeys.studio(studioId) });
    },
  });
}

// Update business hours mutation
export function useUpdateBusinessHours(studioId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (businessHours: StudioSettings['businessHours']) =>
      settingsService.updateBusinessHours(studioId, businessHours),
    onMutate: async (newBusinessHours) => {
      await queryClient.cancelQueries({ queryKey: settingsKeys.studio(studioId) });
      const previousStudio = queryClient.getQueryData<Studio>(settingsKeys.studio(studioId));

      if (previousStudio) {
        queryClient.setQueryData<Studio>(settingsKeys.studio(studioId), {
          ...previousStudio,
          settings: {
            ...(previousStudio.settings as StudioSettings),
            businessHours: newBusinessHours,
          },
        });
      }

      return { previousStudio };
    },
    onError: (_err, _data, context) => {
      if (context?.previousStudio) {
        queryClient.setQueryData(settingsKeys.studio(studioId), context.previousStudio);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.studio(studioId) });
    },
  });
}

// Update booking settings mutation
export function useUpdateBookingSettings(studioId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (booking: StudioSettings['booking']) =>
      settingsService.updateBookingSettings(studioId, booking),
    onMutate: async (newBooking) => {
      await queryClient.cancelQueries({ queryKey: settingsKeys.studio(studioId) });
      const previousStudio = queryClient.getQueryData<Studio>(settingsKeys.studio(studioId));

      if (previousStudio) {
        queryClient.setQueryData<Studio>(settingsKeys.studio(studioId), {
          ...previousStudio,
          settings: {
            ...(previousStudio.settings as StudioSettings),
            booking: newBooking,
          },
        });
      }

      return { previousStudio };
    },
    onError: (_err, _data, context) => {
      if (context?.previousStudio) {
        queryClient.setQueryData(settingsKeys.studio(studioId), context.previousStudio);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.studio(studioId) });
    },
  });
}

// Update notification settings mutation
export function useUpdateNotificationSettings(studioId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notifications: StudioSettings['notifications']) =>
      settingsService.updateNotificationSettings(studioId, notifications),
    onMutate: async (newNotifications) => {
      await queryClient.cancelQueries({ queryKey: settingsKeys.studio(studioId) });
      const previousStudio = queryClient.getQueryData<Studio>(settingsKeys.studio(studioId));

      if (previousStudio) {
        queryClient.setQueryData<Studio>(settingsKeys.studio(studioId), {
          ...previousStudio,
          settings: {
            ...(previousStudio.settings as StudioSettings),
            notifications: newNotifications,
          },
        });
      }

      return { previousStudio };
    },
    onError: (_err, _data, context) => {
      if (context?.previousStudio) {
        queryClient.setQueryData(settingsKeys.studio(studioId), context.previousStudio);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.studio(studioId) });
    },
  });
}

// Update billing settings mutation
export function useUpdateBillingSettings(studioId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (billing: StudioSettings['billing']) =>
      settingsService.updateBillingSettings(studioId, billing),
    onMutate: async (newBilling) => {
      await queryClient.cancelQueries({ queryKey: settingsKeys.studio(studioId) });
      const previousStudio = queryClient.getQueryData<Studio>(settingsKeys.studio(studioId));

      if (previousStudio) {
        queryClient.setQueryData<Studio>(settingsKeys.studio(studioId), {
          ...previousStudio,
          settings: {
            ...(previousStudio.settings as StudioSettings),
            billing: newBilling,
          },
        });
      }

      return { previousStudio };
    },
    onError: (_err, _data, context) => {
      if (context?.previousStudio) {
        queryClient.setQueryData(settingsKeys.studio(studioId), context.previousStudio);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.studio(studioId) });
    },
  });
}

// Update integrations mutation
export function useUpdateIntegrations(studioId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (integrations: StudioSettings['integrations']) =>
      settingsService.updateIntegrations(studioId, integrations),
    onMutate: async (newIntegrations) => {
      await queryClient.cancelQueries({ queryKey: settingsKeys.studio(studioId) });
      const previousStudio = queryClient.getQueryData<Studio>(settingsKeys.studio(studioId));

      if (previousStudio) {
        queryClient.setQueryData<Studio>(settingsKeys.studio(studioId), {
          ...previousStudio,
          settings: {
            ...(previousStudio.settings as StudioSettings),
            integrations: newIntegrations,
          },
        });
      }

      return { previousStudio };
    },
    onError: (_err, _data, context) => {
      if (context?.previousStudio) {
        queryClient.setQueryData(settingsKeys.studio(studioId), context.previousStudio);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.studio(studioId) });
    },
  });
}
