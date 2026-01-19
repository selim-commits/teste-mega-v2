import { supabase } from '../lib/supabase';
import type { Payment, PaymentInsert, PaymentUpdate, PaymentMethod } from '../types/database';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export interface PaymentFilters {
  studioId?: string;
  invoiceId?: string;
  method?: PaymentMethod;
  startDate?: string;
  endDate?: string;
}

export const paymentService = {
  async getAll(filters?: PaymentFilters): Promise<Payment[]> {
    let query = db.from('payments').select('*');

    if (filters?.studioId) {
      query = query.eq('studio_id', filters.studioId);
    }
    if (filters?.invoiceId) {
      query = query.eq('invoice_id', filters.invoiceId);
    }
    if (filters?.method) {
      query = query.eq('method', filters.method);
    }
    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Payment | null> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Payment;
  },

  async create(payment: PaymentInsert): Promise<Payment> {
    const { data, error } = await supabase
      .from('payments')
      .insert(payment)
      .select()
      .single();
    if (error) throw error;
    return data as Payment;
  },

  async update(id: string, payment: PaymentUpdate): Promise<Payment> {
    const { data, error } = await supabase
      .from('payments')
      .update(payment)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Payment;
  },

  async delete(id: string): Promise<void> {
    const { error } = await db.from('payments').delete().eq('id', id);
    if (error) throw error;
  },

  async getByStudioId(studioId: string): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('studio_id', studioId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as Payment[]) || [];
  },

  async getByInvoiceId(invoiceId: string): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as Payment[]) || [];
  },

  async getByMethod(studioId: string, method: PaymentMethod): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('studio_id', studioId)
      .eq('method', method)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as Payment[]) || [];
  },

  async getByDateRange(studioId: string, startDate: string, endDate: string): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('studio_id', studioId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as Payment[]) || [];
  },

  async getTotalReceived(studioId: string, startDate?: string, endDate?: string): Promise<number> {
    let query = supabase
      .from('payments')
      .select('amount')
      .eq('studio_id', studioId);

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;
    if (error) throw error;

    const items = (data as { amount: number }[]) || [];
    return items.reduce((sum, payment) => sum + payment.amount, 0);
  },

  async getRecentPayments(studioId: string, limit: number = 10): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('studio_id', studioId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data as Payment[]) || [];
  },

  async getWithInvoice(id: string): Promise<Payment | null> {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        invoice:invoices(*)
      `)
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Payment;
  },
};
