import { supabase } from '../lib/supabase';
import type { Equipment, EquipmentInsert, EquipmentUpdate, EquipmentStatus } from '../types/database';

const sanitizeSearchQuery = (query: string): string => {
  return query.trim().slice(0, 100).replace(/[%_\\]/g, '\\$&');
};

export interface EquipmentFilters {
  studioId?: string;
  status?: EquipmentStatus;
  category?: string;
  search?: string;
}

export const equipmentService = {
  async getAll(filters?: EquipmentFilters): Promise<Equipment[]> {
    let query = supabase.from('equipment').select('*');

    if (filters?.studioId) {
      query = query.eq('studio_id', filters.studioId);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.search) {
      const s = sanitizeSearchQuery(filters.search);
      query = query.or(`name.ilike.%${s}%,brand.ilike.%${s}%,model.ilike.%${s}%`);
    }

    const { data, error } = await query.order('name', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Equipment | null> {
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Equipment;
  },

  async create(equipment: EquipmentInsert): Promise<Equipment> {
    const { data, error } = await supabase
      .from('equipment')
      .insert(equipment)
      .select()
      .single();
    if (error) throw error;
    return data as Equipment;
  },

  async update(id: string, equipment: EquipmentUpdate): Promise<Equipment> {
    const { data, error } = await supabase
      .from('equipment')
      .update(equipment)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Equipment;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('equipment').delete().eq('id', id);
    if (error) throw error;
  },

  async getByStudioId(studioId: string): Promise<Equipment[]> {
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .eq('studio_id', studioId)
      .order('name', { ascending: true });
    if (error) throw error;
    return (data as Equipment[]) || [];
  },

  async getByStatus(studioId: string, status: EquipmentStatus): Promise<Equipment[]> {
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .eq('studio_id', studioId)
      .eq('status', status)
      .order('name', { ascending: true });
    if (error) throw error;
    return (data as Equipment[]) || [];
  },

  async getAvailable(studioId: string): Promise<Equipment[]> {
    return this.getByStatus(studioId, 'available');
  },

  async getByCategory(studioId: string, category: string): Promise<Equipment[]> {
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .eq('studio_id', studioId)
      .eq('category', category)
      .order('name', { ascending: true });
    if (error) throw error;
    return (data as Equipment[]) || [];
  },

  async search(studioId: string, query: string): Promise<Equipment[]> {
    const s = sanitizeSearchQuery(query);
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .eq('studio_id', studioId)
      .or(`name.ilike.%${s}%,brand.ilike.%${s}%,model.ilike.%${s}%,serial_number.ilike.%${s}%`)
      .order('name', { ascending: true });
    if (error) throw error;
    return (data as Equipment[]) || [];
  },

  async getByQrCode(qrCode: string): Promise<Equipment | null> {
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .eq('qr_code', qrCode)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data as Equipment | null;
  },

  async getBySerialNumber(studioId: string, serialNumber: string): Promise<Equipment | null> {
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .eq('studio_id', studioId)
      .eq('serial_number', serialNumber)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data as Equipment | null;
  },

  async updateStatus(id: string, status: EquipmentStatus): Promise<Equipment> {
    const { data, error } = await supabase
      .from('equipment')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Equipment;
  },

  async updateCondition(id: string, condition: number): Promise<Equipment> {
    const { data, error } = await supabase
      .from('equipment')
      .update({ condition })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Equipment;
  },

  async updateLocation(id: string, location: string): Promise<Equipment> {
    const { data, error } = await supabase
      .from('equipment')
      .update({ location })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Equipment;
  },

  async getCategories(studioId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('equipment')
      .select('category')
      .eq('studio_id', studioId);
    if (error) throw error;

    const items = (data as { category: string }[]) || [];
    const categories = [...new Set(items.map(item => item.category))];
    return categories.sort();
  },

  async getMaintenanceNeeded(studioId: string): Promise<Equipment[]> {
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .eq('studio_id', studioId)
      .lte('condition', 3)
      .neq('status', 'retired')
      .order('condition', { ascending: true });
    if (error) throw error;
    return (data as Equipment[]) || [];
  },

  async retire(id: string): Promise<Equipment> {
    return this.updateStatus(id, 'retired');
  },

  async setForMaintenance(id: string): Promise<Equipment> {
    return this.updateStatus(id, 'maintenance');
  },
};
