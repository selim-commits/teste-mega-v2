import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { widgetConfigService, type WidgetTheme, type WidgetType } from '../services/widgetConfig';
import type { Json } from '../types/database';

// Type for creating widget configs
interface CreateWidgetConfigInput {
  studio_id: string;
  type: WidgetType;
  name: string;
  theme?: WidgetTheme;
  position?: Json;
  behavior?: Json;
  content?: Json;
  is_active?: boolean;
  allowed_domains?: string[];
  analytics_enabled?: boolean;
}

// Type for updating widget configs
interface UpdateWidgetConfigInput {
  name?: string;
  theme?: WidgetTheme;
  position?: Json;
  behavior?: Json;
  content?: Json;
  is_active?: boolean;
  allowed_domains?: string[];
  analytics_enabled?: boolean;
}

// Query keys for widget configs
export const widgetConfigKeys = {
  all: ['widgetConfigs'] as const,
  lists: () => [...widgetConfigKeys.all, 'list'] as const,
  details: () => [...widgetConfigKeys.all, 'detail'] as const,
  detail: (id: string) => [...widgetConfigKeys.details(), id] as const,
  byStudio: (studioId: string) => [...widgetConfigKeys.all, 'studio', studioId] as const,
  active: (studioId: string) => [...widgetConfigKeys.all, 'active', studioId] as const,
  byType: (studioId: string, type: WidgetType) => [...widgetConfigKeys.all, 'type', studioId, type] as const,
};

// Get all widget configs for a studio
export function useWidgetConfigs(studioId: string) {
  return useQuery({
    queryKey: widgetConfigKeys.byStudio(studioId),
    queryFn: () => widgetConfigService.getByStudioId(studioId),
    enabled: !!studioId,
  });
}

// Get active widget configs for a studio
export function useActiveWidgetConfigs(studioId: string) {
  return useQuery({
    queryKey: widgetConfigKeys.active(studioId),
    queryFn: () => widgetConfigService.getActiveByStudioId(studioId),
    enabled: !!studioId,
  });
}

// Get widget configs by type
export function useWidgetConfigsByType(studioId: string, type: WidgetType) {
  return useQuery({
    queryKey: widgetConfigKeys.byType(studioId, type),
    queryFn: () => widgetConfigService.getByType(studioId, type),
    enabled: !!studioId && !!type,
  });
}

// Get a single widget config by ID
export function useWidgetConfig(id: string) {
  return useQuery({
    queryKey: widgetConfigKeys.detail(id),
    queryFn: () => widgetConfigService.getById(id),
    enabled: !!id,
  });
}

// Create widget config mutation
export function useCreateWidgetConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (config: CreateWidgetConfigInput) => widgetConfigService.create(config),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: widgetConfigKeys.all });
      queryClient.invalidateQueries({ queryKey: widgetConfigKeys.byStudio(data.studio_id) });
    },
  });
}

// Update widget config mutation
export function useUpdateWidgetConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWidgetConfigInput }) =>
      widgetConfigService.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: widgetConfigKeys.all });
      queryClient.invalidateQueries({ queryKey: widgetConfigKeys.detail(variables.id) });
    },
  });
}

// Update widget theme mutation
export function useUpdateWidgetTheme() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, theme }: { id: string; theme: Partial<WidgetTheme> }) =>
      widgetConfigService.updateTheme(id, theme),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: widgetConfigKeys.all });
      queryClient.invalidateQueries({ queryKey: widgetConfigKeys.detail(variables.id) });
    },
  });
}

// Update widget custom CSS mutation (stored in theme.customCSS)
export function useUpdateWidgetCustomCSS() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, css }: { id: string; css: string | null }) => {
      return widgetConfigService.updateTheme(id, { customCSS: css || undefined });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: widgetConfigKeys.all });
      queryClient.invalidateQueries({ queryKey: widgetConfigKeys.detail(variables.id) });
    },
  });
}

// Delete widget config mutation
export function useDeleteWidgetConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => widgetConfigService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: widgetConfigKeys.all });
    },
  });
}

// Duplicate widget config mutation
export function useDuplicateWidgetConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, newName }: { id: string; newName: string }) =>
      widgetConfigService.duplicateConfig(id, newName),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: widgetConfigKeys.all });
      queryClient.invalidateQueries({ queryKey: widgetConfigKeys.byStudio(data.studio_id) });
    },
  });
}

// Toggle widget config active status
export function useToggleWidgetConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => widgetConfigService.toggleActive(id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: widgetConfigKeys.all });
      queryClient.invalidateQueries({ queryKey: widgetConfigKeys.detail(variables) });
    },
  });
}

// Increment embed count mutation (no-op for now, analytics tracked separately)
export function useIncrementEmbedCount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Embed count tracking is handled by analytics, return the current config
      return widgetConfigService.getById(id);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: widgetConfigKeys.detail(variables) });
    },
  });
}

// Update allowed domains mutation
export function useUpdateAllowedDomains() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, domains }: { id: string; domains: string[] }) =>
      widgetConfigService.updateAllowedDomains(id, domains),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: widgetConfigKeys.all });
      queryClient.invalidateQueries({ queryKey: widgetConfigKeys.detail(variables.id) });
    },
  });
}

// Helper hook to generate embed code (non-reactive)
export function useGenerateEmbedCode(id: string, type: WidgetType = 'booking', baseUrl?: string) {
  return {
    scriptEmbed: widgetConfigService.generateEmbedCode(id, type, baseUrl),
    iframeEmbed: widgetConfigService.generateIframeCode(id, type, baseUrl),
  };
}
