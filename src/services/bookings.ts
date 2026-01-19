import { supabase } from '../lib/supabase';
import type { Booking, BookingInsert, BookingUpdate, BookingStatus } from '../types/database';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export interface BookingFilters {
  studioId?: string;
  spaceId?: string;
  clientId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  status?: BookingStatus;
}

export const bookingService = {
  async getAll(filters?: BookingFilters): Promise<Booking[]> {
    let query = db.from('bookings').select('*');

    if (filters?.studioId) {
      query = query.eq('studio_id', filters.studioId);
    }
    if (filters?.spaceId) {
      query = query.eq('space_id', filters.spaceId);
    }
    if (filters?.clientId) {
      query = query.eq('client_id', filters.clientId);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.date) {
      query = query.gte('start_time', `${filters.date}T00:00:00`)
                   .lte('start_time', `${filters.date}T23:59:59`);
    }
    if (filters?.startDate) {
      query = query.gte('start_time', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('end_time', filters.endDate);
    }

    const { data, error } = await query.order('start_time', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Booking | null> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Booking;
  },

  async create(booking: BookingInsert): Promise<Booking> {
    const { data, error } = await supabase
      .from('bookings')
      .insert(booking)
      .select()
      .single();
    if (error) throw error;
    return data as Booking;
  },

  async update(id: string, booking: BookingUpdate): Promise<Booking> {
    const { data, error } = await supabase
      .from('bookings')
      .update(booking)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Booking;
  },

  async delete(id: string): Promise<void> {
    const { error } = await db.from('bookings').delete().eq('id', id);
    if (error) throw error;
  },

  async getByStudioId(studioId: string): Promise<Booking[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('studio_id', studioId)
      .order('start_time', { ascending: true });
    if (error) throw error;
    return (data as Booking[]) || [];
  },

  async getByClientId(clientId: string): Promise<Booking[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('client_id', clientId)
      .order('start_time', { ascending: true });
    if (error) throw error;
    return (data as Booking[]) || [];
  },

  async getBySpaceId(spaceId: string): Promise<Booking[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('space_id', spaceId)
      .order('start_time', { ascending: true });
    if (error) throw error;
    return (data as Booking[]) || [];
  },

  async getByDateRange(studioId: string, startDate: string, endDate: string): Promise<Booking[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('studio_id', studioId)
      .gte('start_time', startDate)
      .lte('end_time', endDate)
      .order('start_time', { ascending: true });
    if (error) throw error;
    return (data as Booking[]) || [];
  },

  async getByStatus(studioId: string, status: BookingStatus): Promise<Booking[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('studio_id', studioId)
      .eq('status', status)
      .order('start_time', { ascending: true });
    if (error) throw error;
    return (data as Booking[]) || [];
  },

  async getUpcoming(studioId: string, limit: number = 10): Promise<Booking[]> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('studio_id', studioId)
      .gte('start_time', now)
      .neq('status', 'cancelled')
      .order('start_time', { ascending: true })
      .limit(limit);
    if (error) throw error;
    return (data as Booking[]) || [];
  },

  async getToday(studioId: string): Promise<Booking[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();

    return this.getByDateRange(studioId, startOfDay, endOfDay);
  },

  async updateStatus(id: string, status: BookingStatus): Promise<Booking> {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Booking;
  },

  async checkAvailability(
    spaceId: string,
    startTime: string,
    endTime: string,
    excludeBookingId?: string
  ): Promise<boolean> {
    let query = supabase
      .from('bookings')
      .select('id')
      .eq('space_id', spaceId)
      .neq('status', 'cancelled')
      .or(`and(start_time.lt.${endTime},end_time.gt.${startTime})`);

    if (excludeBookingId) {
      query = query.neq('id', excludeBookingId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return ((data as { id: string }[]) || []).length === 0;
  },

  async getWithRelations(id: string): Promise<Booking | null> {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        client:clients(*),
        space:spaces(*)
      `)
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Booking;
  },
};
