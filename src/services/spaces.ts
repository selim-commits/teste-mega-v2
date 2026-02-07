import { supabase } from '../lib/supabase';
import type { Space, SpaceInsert, SpaceUpdate } from '../types/database';

export interface SpaceFilters {
  studioId?: string;
  isActive?: boolean;
}

export const spaceService = {
  async getAll(filters?: SpaceFilters): Promise<Space[]> {
    let query = supabase.from('spaces').select('*');

    if (filters?.studioId) {
      query = query.eq('studio_id', filters.studioId);
    }
    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }

    const { data, error } = await query.order('name', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Space | null> {
    const { data, error } = await supabase
      .from('spaces')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Space;
  },

  async create(space: SpaceInsert): Promise<Space> {
    const { data, error } = await supabase
      .from('spaces')
      .insert(space)
      .select()
      .single();
    if (error) throw error;
    return data as Space;
  },

  async update(id: string, space: SpaceUpdate): Promise<Space> {
    const { data, error } = await supabase
      .from('spaces')
      .update(space)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Space;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('spaces').delete().eq('id', id);
    if (error) throw error;
  },

  async getByStudioId(studioId: string): Promise<Space[]> {
    const { data, error } = await supabase
      .from('spaces')
      .select('*')
      .eq('studio_id', studioId)
      .order('name', { ascending: true });
    if (error) throw error;
    return (data as Space[]) || [];
  },

  async getActiveByStudioId(studioId: string): Promise<Space[]> {
    const { data, error } = await supabase
      .from('spaces')
      .select('*')
      .eq('studio_id', studioId)
      .eq('is_active', true)
      .order('name', { ascending: true });
    if (error) throw error;
    return (data as Space[]) || [];
  },

  async toggleActive(id: string, isActive: boolean): Promise<Space> {
    const { data, error } = await supabase
      .from('spaces')
      .update({ is_active: isActive })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Space;
  },
};
