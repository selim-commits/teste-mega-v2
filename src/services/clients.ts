import { supabase } from '../lib/supabase';
import type { Client, ClientInsert, ClientUpdate, ClientTier } from '../types/database';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export interface ClientFilters {
  studioId?: string;
  tier?: ClientTier;
  isActive?: boolean;
  tags?: string[];
  search?: string;
}

export const clientService = {
  async getAll(filters?: ClientFilters): Promise<Client[]> {
    let query = db.from('clients').select('*');

    if (filters?.studioId) {
      query = query.eq('studio_id', filters.studioId);
    }
    if (filters?.tier) {
      query = query.eq('tier', filters.tier);
    }
    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }
    if (filters?.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags);
    }
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,company.ilike.%${filters.search}%`);
    }

    const { data, error } = await query.order('name', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Client | null> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Client;
  },

  async create(client: ClientInsert): Promise<Client> {
    const { data, error } = await supabase
      .from('clients')
      .insert(client)
      .select()
      .single();
    if (error) throw error;
    return data as Client;
  },

  async update(id: string, client: ClientUpdate): Promise<Client> {
    const { data, error } = await supabase
      .from('clients')
      .update(client)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Client;
  },

  async delete(id: string): Promise<void> {
    const { error } = await db.from('clients').delete().eq('id', id);
    if (error) throw error;
  },

  async getByStudioId(studioId: string): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('studio_id', studioId)
      .order('name', { ascending: true });
    if (error) throw error;
    return (data as Client[]) || [];
  },

  async getActiveByStudioId(studioId: string): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('studio_id', studioId)
      .eq('is_active', true)
      .order('name', { ascending: true });
    if (error) throw error;
    return (data as Client[]) || [];
  },

  async search(studioId: string, query: string): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('studio_id', studioId)
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,company.ilike.%${query}%,phone.ilike.%${query}%`)
      .order('name', { ascending: true });
    if (error) throw error;
    return (data as Client[]) || [];
  },

  async getByEmail(studioId: string, email: string): Promise<Client | null> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('studio_id', studioId)
      .eq('email', email)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data as Client | null;
  },

  async getByTier(studioId: string, tier: ClientTier): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('studio_id', studioId)
      .eq('tier', tier)
      .order('name', { ascending: true });
    if (error) throw error;
    return (data as Client[]) || [];
  },

  async getByTags(studioId: string, tags: string[]): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('studio_id', studioId)
      .overlaps('tags', tags)
      .order('name', { ascending: true });
    if (error) throw error;
    return (data as Client[]) || [];
  },

  async updateScore(id: string, score: number): Promise<Client> {
    const { data, error } = await supabase
      .from('clients')
      .update({ score })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Client;
  },

  async updateTier(id: string, tier: ClientTier): Promise<Client> {
    const { data, error } = await supabase
      .from('clients')
      .update({ tier })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Client;
  },

  async addTags(id: string, newTags: string[]): Promise<Client> {
    const client = await this.getById(id);
    if (!client) throw new Error('Client not found');

    const existingTags = client.tags || [];
    const uniqueTags = [...new Set([...existingTags, ...newTags])];

    const { data, error } = await supabase
      .from('clients')
      .update({ tags: uniqueTags })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Client;
  },

  async removeTags(id: string, tagsToRemove: string[]): Promise<Client> {
    const client = await this.getById(id);
    if (!client) throw new Error('Client not found');

    const existingTags = client.tags || [];
    const filteredTags = existingTags.filter(tag => !tagsToRemove.includes(tag));

    const { data, error } = await supabase
      .from('clients')
      .update({ tags: filteredTags })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Client;
  },

  async deactivate(id: string): Promise<Client> {
    const { data, error } = await supabase
      .from('clients')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Client;
  },

  async activate(id: string): Promise<Client> {
    const { data, error } = await supabase
      .from('clients')
      .update({ is_active: true })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Client;
  },
};
