import { supabase } from '../lib/supabase';
import type { Studio, Json } from '../types/database';

// Settings structure stored in studios.settings JSON field
export interface StudioSettings {
  profile?: {
    description?: string;
    logoUrl?: string;
    coverUrl?: string;
    website?: string;
  };
  businessHours?: {
    [key: string]: {
      enabled: boolean;
      openTime: string;
      closeTime: string;
      splitEnabled?: boolean;
      splitStartTime?: string;
      splitEndTime?: string;
    };
  };
  booking?: {
    defaultDuration?: number;
    bufferTime?: number;
    minAdvanceTime?: number;
    maxAdvanceTime?: number;
    cancellationPolicy?: string;
  };
  notifications?: {
    emailEnabled?: boolean;
    smsEnabled?: boolean;
    reminder24h?: boolean;
    reminder48h?: boolean;
    reminder1Week?: boolean;
    newBookingAlert?: boolean;
    cancellationAlert?: boolean;
    paymentAlert?: boolean;
  };
  integrations?: {
    googleCalendar?: {
      enabled: boolean;
      syncEnabled?: boolean;
    };
    stripe?: {
      enabled: boolean;
      accountId?: string;
    };
    zapier?: {
      enabled: boolean;
      webhookUrl?: string;
    };
  };
  billing?: {
    companyName?: string;
    vatNumber?: string;
    vatRate?: string;
    siret?: string;
    billingEmail?: string;
    invoicePrefix?: string;
    paymentTerms?: string;
    legalMentions?: string;
  };
}

export const settingsService = {
  // Get studio with settings
  async getStudioWithSettings(studioId: string): Promise<Studio | null> {
    const { data, error } = await supabase
      .from('studios')
      .select('*')
      .eq('id', studioId)
      .single();
    if (error) throw error;
    return data as Studio;
  },

  // Get settings only
  async getSettings(studioId: string): Promise<StudioSettings> {
    const { data, error } = await supabase
      .from('studios')
      .select('settings')
      .eq('id', studioId)
      .single();
    if (error) throw error;
    return (data?.settings as StudioSettings) || {};
  },

  // Update entire settings
  async updateSettings(studioId: string, settings: StudioSettings): Promise<Studio> {
    const { data, error } = await supabase
      .from('studios')
      .update({ settings: settings as Json, updated_at: new Date().toISOString() })
      .eq('id', studioId)
      .select()
      .single();
    if (error) throw error;
    return data as Studio;
  },

  // Update profile settings + studio columns
  async updateProfile(
    studioId: string,
    profile: {
      name?: string;
      slug?: string;
      email?: string;
      phone?: string;
      address?: string;
      city?: string;
      postal_code?: string;
      country?: string;
      timezone?: string;
      currency?: string;
      description?: string;
      logoUrl?: string;
      coverUrl?: string;
      website?: string;
    }
  ): Promise<Studio> {
    // Separate studio columns from settings
    const { description, logoUrl, coverUrl, website, ...studioColumns } = profile;

    // Get current settings
    const currentSettings = await this.getSettings(studioId);

    // Update settings with profile data
    const newSettings: StudioSettings = {
      ...currentSettings,
      profile: {
        ...currentSettings.profile,
        description,
        logoUrl,
        coverUrl,
        website,
      },
    };

    // Update studio with columns and settings
    const { data, error } = await supabase
      .from('studios')
      .update({
        ...studioColumns,
        settings: newSettings as Json,
        updated_at: new Date().toISOString(),
      })
      .eq('id', studioId)
      .select()
      .single();

    if (error) throw error;
    return data as Studio;
  },

  // Update business hours
  async updateBusinessHours(
    studioId: string,
    businessHours: StudioSettings['businessHours']
  ): Promise<Studio> {
    const currentSettings = await this.getSettings(studioId);
    const newSettings: StudioSettings = {
      ...currentSettings,
      businessHours,
    };

    const { data, error } = await supabase
      .from('studios')
      .update({ settings: newSettings as Json, updated_at: new Date().toISOString() })
      .eq('id', studioId)
      .select()
      .single();

    if (error) throw error;
    return data as Studio;
  },

  // Update booking settings
  async updateBookingSettings(
    studioId: string,
    booking: StudioSettings['booking']
  ): Promise<Studio> {
    const currentSettings = await this.getSettings(studioId);
    const newSettings: StudioSettings = {
      ...currentSettings,
      booking,
    };

    const { data, error } = await supabase
      .from('studios')
      .update({ settings: newSettings as Json, updated_at: new Date().toISOString() })
      .eq('id', studioId)
      .select()
      .single();

    if (error) throw error;
    return data as Studio;
  },

  // Update notification settings
  async updateNotificationSettings(
    studioId: string,
    notifications: StudioSettings['notifications']
  ): Promise<Studio> {
    const currentSettings = await this.getSettings(studioId);
    const newSettings: StudioSettings = {
      ...currentSettings,
      notifications,
    };

    const { data, error } = await supabase
      .from('studios')
      .update({ settings: newSettings as Json, updated_at: new Date().toISOString() })
      .eq('id', studioId)
      .select()
      .single();

    if (error) throw error;
    return data as Studio;
  },

  // Update billing settings
  async updateBillingSettings(
    studioId: string,
    billing: StudioSettings['billing']
  ): Promise<Studio> {
    const currentSettings = await this.getSettings(studioId);
    const newSettings: StudioSettings = {
      ...currentSettings,
      billing,
    };

    const { data, error } = await supabase
      .from('studios')
      .update({ settings: newSettings as Json, updated_at: new Date().toISOString() })
      .eq('id', studioId)
      .select()
      .single();

    if (error) throw error;
    return data as Studio;
  },

  // Update integrations settings
  async updateIntegrations(
    studioId: string,
    integrations: StudioSettings['integrations']
  ): Promise<Studio> {
    const currentSettings = await this.getSettings(studioId);
    const newSettings: StudioSettings = {
      ...currentSettings,
      integrations,
    };

    const { data, error } = await supabase
      .from('studios')
      .update({ settings: newSettings as Json, updated_at: new Date().toISOString() })
      .eq('id', studioId)
      .select()
      .single();

    if (error) throw error;
    return data as Studio;
  },
};
