import { supabase } from '../lib/supabase';
import type {
  WidgetConfig,
  WidgetConfigInsert,
  WidgetConfigUpdate,
  WidgetType,
  Json
} from '../types/database';

// Re-export types for external use
export type { WidgetConfig, WidgetType };

// Widget theme configuration (stored in JSON theme field)
export interface WidgetTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  borderRadius: number;
  buttonStyle: 'solid' | 'outline' | 'ghost';
  customCSS?: string;
}

// Default theme
const DEFAULT_THEME: WidgetTheme = {
  primaryColor: '#6366f1',
  secondaryColor: '#818cf8',
  backgroundColor: '#ffffff',
  textColor: '#1f2937',
  fontFamily: 'Inter, system-ui, sans-serif',
  borderRadius: 8,
  buttonStyle: 'solid',
};

export const widgetConfigService = {
  // Get all widget configs for a studio
  async getByStudioId(studioId: string): Promise<WidgetConfig[]> {
    const { data, error } = await supabase
      .from('widget_configs')
      .select('*')
      .eq('studio_id', studioId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  // Get widget configs by type
  async getByType(studioId: string, type: WidgetType): Promise<WidgetConfig[]> {
    const { data, error } = await supabase
      .from('widget_configs')
      .select('*')
      .eq('studio_id', studioId)
      .eq('type', type)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  // Get active widget configs for a studio
  async getActiveByStudioId(studioId: string): Promise<WidgetConfig[]> {
    const { data, error } = await supabase
      .from('widget_configs')
      .select('*')
      .eq('studio_id', studioId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  // Get single widget config by ID
  async getById(id: string): Promise<WidgetConfig | null> {
    const { data, error } = await supabase
      .from('widget_configs')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Create new widget config
  async create(config: {
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
  }): Promise<WidgetConfig> {
    const configWithDefaults: WidgetConfigInsert = {
      studio_id: config.studio_id,
      type: config.type,
      name: config.name,
      theme: (config.theme || DEFAULT_THEME) as unknown as Json,
      position: config.position || {},
      behavior: config.behavior || {},
      content: config.content || {},
      is_active: config.is_active ?? true,
      allowed_domains: config.allowed_domains || [],
      analytics_enabled: config.analytics_enabled ?? true,
    };

    const { data, error } = await supabase
      .from('widget_configs')
      .insert(configWithDefaults)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Update widget config
  async update(id: string, updates: Partial<{
    name: string;
    theme: WidgetTheme;
    position: Json;
    behavior: Json;
    content: Json;
    is_active: boolean;
    allowed_domains: string[];
    analytics_enabled: boolean;
  }>): Promise<WidgetConfig> {
    const updateData: WidgetConfigUpdate = {
      updated_at: new Date().toISOString(),
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.theme !== undefined) updateData.theme = updates.theme as unknown as Json;
    if (updates.position !== undefined) updateData.position = updates.position;
    if (updates.behavior !== undefined) updateData.behavior = updates.behavior;
    if (updates.content !== undefined) updateData.content = updates.content;
    if (updates.is_active !== undefined) updateData.is_active = updates.is_active;
    if (updates.allowed_domains !== undefined) updateData.allowed_domains = updates.allowed_domains;
    if (updates.analytics_enabled !== undefined) updateData.analytics_enabled = updates.analytics_enabled;

    const { data, error } = await supabase
      .from('widget_configs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Delete widget config
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('widget_configs').delete().eq('id', id);
    if (error) throw error;
  },

  // Duplicate a widget config with a new name
  async duplicateConfig(id: string, newName: string): Promise<WidgetConfig> {
    const original = await this.getById(id);
    if (!original) throw new Error('Widget config not found');

    return this.create({
      studio_id: original.studio_id,
      type: original.type,
      name: newName,
      theme: original.theme as unknown as WidgetTheme,
      position: original.position,
      behavior: original.behavior,
      content: original.content,
      is_active: false, // Start as inactive
      allowed_domains: original.allowed_domains,
      analytics_enabled: original.analytics_enabled,
    });
  },

  // Update theme only
  async updateTheme(id: string, theme: Partial<WidgetTheme>): Promise<WidgetConfig> {
    const current = await this.getById(id);
    if (!current) throw new Error('Widget config not found');

    const currentTheme = (current.theme || DEFAULT_THEME) as unknown as WidgetTheme;
    const mergedTheme = { ...currentTheme, ...theme };

    return this.update(id, { theme: mergedTheme });
  },

  // Toggle active status
  async toggleActive(id: string): Promise<WidgetConfig> {
    const current = await this.getById(id);
    if (!current) throw new Error('Widget config not found');

    return this.update(id, { is_active: !current.is_active });
  },

  // Generate embed code snippet
  generateEmbedCode(id: string, type: WidgetType, baseUrl: string = 'https://widget.rooom.io'): string {
    const widgetPath = type === 'booking' ? 'embed' : `embed-${type}`;
    return `<!-- Rooom ${type.charAt(0).toUpperCase() + type.slice(1)} Widget -->
<div id="rooom-widget-${id}" data-widget-id="${id}"></div>
<script src="${baseUrl}/${widgetPath}.js" async></script>
<!-- End Rooom Widget -->`;
  },

  // Generate iframe embed code
  generateIframeCode(id: string, type: WidgetType, baseUrl: string = 'https://widget.rooom.io'): string {
    return `<iframe
  src="${baseUrl}/widget/${type}/${id}"
  width="100%"
  height="600"
  frameborder="0"
  allow="payment"
  title="Rooom ${type.charAt(0).toUpperCase() + type.slice(1)} Widget"
></iframe>`;
  },

  // Update allowed domains for CORS
  async updateAllowedDomains(id: string, domains: string[]): Promise<WidgetConfig> {
    return this.update(id, { allowed_domains: domains });
  },

  // Helper to get theme from config
  getTheme(config: WidgetConfig): WidgetTheme {
    return (config.theme as unknown as WidgetTheme) || DEFAULT_THEME;
  },
};
