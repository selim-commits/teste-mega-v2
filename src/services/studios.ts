import { supabase } from '../lib/supabase';
import type { Studio, StudioInsert, StudioUpdate, Json } from '../types/database';

export const studioService = {
  async getAll(): Promise<Studio[]> {
    const { data, error } = await supabase.from('studios').select('*');
    if (error) throw error;
    return (data as Studio[]) || [];
  },

  async getById(id: string): Promise<Studio | null> {
    const { data, error } = await supabase
      .from('studios')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Studio;
  },

  async create(studio: StudioInsert): Promise<Studio> {
    const { data, error } = await supabase
      .from('studios')
      .insert(studio)
      .select()
      .single();
    if (error) throw error;
    return data as Studio;
  },

  async update(id: string, studio: StudioUpdate): Promise<Studio> {
    const { data, error } = await supabase
      .from('studios')
      .update(studio)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Studio;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('studios').delete().eq('id', id);
    if (error) throw error;
  },

  async getBySlug(slug: string): Promise<Studio | null> {
    const { data, error } = await supabase
      .from('studios')
      .select('*')
      .eq('slug', slug)
      .single();
    if (error) throw error;
    return data as Studio;
  },

  async getByOwnerId(ownerId: string): Promise<Studio[]> {
    const { data, error } = await supabase
      .from('studios')
      .select('*')
      .eq('owner_id', ownerId);
    if (error) throw error;
    return (data as Studio[]) || [];
  },

  async updateSettings(id: string, settings: Json): Promise<Studio> {
    const { data, error } = await supabase
      .from('studios')
      .update({ settings })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Studio;
  },

  async checkSlugAvailability(slug: string, excludeId?: string): Promise<boolean> {
    let query = supabase
      .from('studios')
      .select('id')
      .eq('slug', slug);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return ((data as { id: string }[]) || []).length === 0;
  },
};
