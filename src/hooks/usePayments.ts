import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentService } from '../services/payments';
import { queryKeys } from '../lib/queryClient';
import { isDemoMode } from '../lib/supabase';
import { mockPayments } from '../lib/mockData';
import type { Payment, PaymentInsert, PaymentUpdate, PaymentMethod } from '../types/database';

export interface PaymentFilters {
  studioId?: string;
  invoiceId?: string;
  method?: PaymentMethod;
  startDate?: string;
  endDate?: string;
}

// Get all payments with optional filters
export function usePayments(filters?: PaymentFilters) {
  return useQuery({
    queryKey: queryKeys.payments.list(filters || {}),
    queryFn: async () => {
      if (filters?.studioId && filters?.method) {
        return paymentService.getByMethod(filters.studioId, filters.method);
      }
      if (filters?.studioId && filters?.startDate && filters?.endDate) {
        return paymentService.getByDateRange(filters.studioId, filters.startDate, filters.endDate);
      }
      if (filters?.studioId) {
        return paymentService.getByStudioId(filters.studioId);
      }
      if (filters?.invoiceId) {
        return paymentService.getByInvoiceId(filters.invoiceId);
      }
      return paymentService.getAll(filters);
    },
  });
}

// Get a single payment by ID
export function usePayment(id: string) {
  return useQuery({
    queryKey: queryKeys.payments.detail(id),
    queryFn: () => paymentService.getById(id),
    enabled: !!id,
  });
}

// Get payments by invoice ID
export function usePaymentsByInvoice(invoiceId: string) {
  return useQuery({
    queryKey: queryKeys.payments.byInvoice(invoiceId),
    queryFn: () => paymentService.getByInvoiceId(invoiceId),
    enabled: !!invoiceId,
  });
}

// Get payment with invoice details
export function usePaymentWithInvoice(id: string) {
  return useQuery({
    queryKey: [...queryKeys.payments.detail(id), 'withInvoice'],
    queryFn: () => paymentService.getWithInvoice(id),
    enabled: !!id,
  });
}

// Get recent payments
export function useRecentPayments(studioId: string, limit: number = 10) {
  return useQuery({
    queryKey: [...queryKeys.payments.all, 'recent', studioId, limit],
    queryFn: (): Promise<Payment[]> => {
      if (isDemoMode) {
        const sorted = [...mockPayments].sort((a, b) =>
          new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
        );
        return Promise.resolve(sorted.slice(0, limit) as Payment[]);
      }
      return paymentService.getRecentPayments(studioId, limit);
    },
    enabled: !!studioId,
  });
}

// Get total received
export function useTotalReceived(studioId: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: [...queryKeys.payments.all, 'totalReceived', studioId, startDate, endDate],
    queryFn: (): Promise<number> => {
      if (isDemoMode) {
        const total = mockPayments.reduce((sum, p) => sum + p.amount, 0);
        return Promise.resolve(total);
      }
      return paymentService.getTotalReceived(studioId, startDate, endDate);
    },
    enabled: !!studioId,
  });
}

// Create payment mutation
export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payment: Omit<PaymentInsert, 'id' | 'created_at'>) =>
      paymentService.create(payment),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.detail(variables.invoice_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
    },
  });
}

// Update payment mutation
export function useUpdatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PaymentUpdate }) =>
      paymentService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
    },
  });
}

// Delete payment mutation
export function useDeletePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => paymentService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
    },
  });
}
