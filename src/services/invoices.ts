import { supabase } from '../lib/supabase';
import type { Invoice, InvoiceInsert, InvoiceUpdate, InvoiceStatus } from '../types/database';

export interface InvoiceFilters {
  studioId?: string;
  clientId?: string;
  status?: InvoiceStatus;
  startDate?: string;
  endDate?: string;
}

export const invoiceService = {
  async getAll(filters?: InvoiceFilters): Promise<Invoice[]> {
    let query = supabase.from('invoices').select('*');

    if (filters?.studioId) {
      query = query.eq('studio_id', filters.studioId);
    }
    if (filters?.clientId) {
      query = query.eq('client_id', filters.clientId);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.startDate) {
      query = query.gte('issue_date', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('issue_date', filters.endDate);
    }

    const { data, error } = await query.order('issue_date', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Invoice | null> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Invoice;
  },

  async create(invoice: InvoiceInsert): Promise<Invoice> {
    const { data, error } = await supabase
      .from('invoices')
      .insert(invoice)
      .select()
      .single();
    if (error) throw error;
    return data as Invoice;
  },

  async update(id: string, invoice: InvoiceUpdate): Promise<Invoice> {
    const { data, error } = await supabase
      .from('invoices')
      .update(invoice)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Invoice;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (error) throw error;
  },

  async getByStudioId(studioId: string): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('studio_id', studioId)
      .order('issue_date', { ascending: false });
    if (error) throw error;
    return (data as Invoice[]) || [];
  },

  async getByClientId(clientId: string): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('client_id', clientId)
      .order('issue_date', { ascending: false });
    if (error) throw error;
    return (data as Invoice[]) || [];
  },

  async getByBookingId(bookingId: string): Promise<Invoice | null> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('booking_id', bookingId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data as Invoice | null;
  },

  async getByStatus(studioId: string, status: InvoiceStatus): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('studio_id', studioId)
      .eq('status', status)
      .order('issue_date', { ascending: false });
    if (error) throw error;
    return (data as Invoice[]) || [];
  },

  async getByInvoiceNumber(studioId: string, invoiceNumber: string): Promise<Invoice | null> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('studio_id', studioId)
      .eq('invoice_number', invoiceNumber)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data as Invoice | null;
  },

  async getOverdue(studioId: string): Promise<Invoice[]> {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('studio_id', studioId)
      .lt('due_date', today)
      .in('status', ['sent', 'overdue'])
      .order('due_date', { ascending: true });
    if (error) throw error;
    return (data as Invoice[]) || [];
  },

  async getPending(studioId: string): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('studio_id', studioId)
      .in('status', ['draft', 'sent'])
      .order('due_date', { ascending: true });
    if (error) throw error;
    return (data as Invoice[]) || [];
  },

  async getByDateRange(studioId: string, startDate: string, endDate: string): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('studio_id', studioId)
      .gte('issue_date', startDate)
      .lte('issue_date', endDate)
      .order('issue_date', { ascending: false });
    if (error) throw error;
    return (data as Invoice[]) || [];
  },

  async updateStatus(id: string, status: InvoiceStatus): Promise<Invoice> {
    const { data, error } = await supabase
      .from('invoices')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Invoice;
  },

  async markAsPaid(id: string, paidAmount?: number): Promise<Invoice> {
    const invoice = await this.getById(id);
    if (!invoice) throw new Error('Invoice not found');

    const { data, error } = await supabase
      .from('invoices')
      .update({
        status: 'paid' as InvoiceStatus,
        paid_amount: paidAmount ?? invoice.total_amount
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Invoice;
  },

  async markAsSent(id: string): Promise<Invoice> {
    return this.updateStatus(id, 'sent');
  },

  async markAsOverdue(id: string): Promise<Invoice> {
    return this.updateStatus(id, 'overdue');
  },

  async cancel(id: string): Promise<Invoice> {
    return this.updateStatus(id, 'cancelled');
  },

  async updatePaidAmount(id: string, paidAmount: number): Promise<Invoice> {
    const { data, error } = await supabase
      .from('invoices')
      .update({ paid_amount: paidAmount })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Invoice;
  },

  async getWithRelations(id: string): Promise<Invoice | null> {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(*),
        booking:bookings(*)
      `)
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Invoice;
  },

  async generateInvoiceNumber(studioId: string): Promise<string> {
    const year = new Date().getFullYear();
    const { data, error } = await supabase
      .from('invoices')
      .select('invoice_number')
      .eq('studio_id', studioId)
      .ilike('invoice_number', `INV-${year}-%`)
      .order('invoice_number', { ascending: false })
      .limit(1);

    if (error) throw error;

    const items = (data as { invoice_number: string }[]) || [];
    let nextNumber = 1;
    if (items.length > 0) {
      const lastNumber = parseInt(items[0].invoice_number.split('-')[2], 10);
      nextNumber = lastNumber + 1;
    }

    return `INV-${year}-${nextNumber.toString().padStart(5, '0')}`;
  },

  async getTotalRevenue(studioId: string, startDate?: string, endDate?: string): Promise<number> {
    let query = supabase
      .from('invoices')
      .select('paid_amount')
      .eq('studio_id', studioId)
      .eq('status', 'paid');

    if (startDate) {
      query = query.gte('issue_date', startDate);
    }
    if (endDate) {
      query = query.lte('issue_date', endDate);
    }

    const { data, error } = await query;
    if (error) throw error;

    const items = (data as { paid_amount: number }[]) || [];
    return items.reduce((sum, invoice) => sum + invoice.paid_amount, 0);
  },
};
