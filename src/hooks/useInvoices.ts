import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoiceService } from '../services';
import { queryKeys } from '../lib/queryClient';
import type { InvoiceInsert, InvoiceUpdate, InvoiceStatus } from '../types/database';

export interface InvoiceFilters {
  studioId?: string;
  clientId?: string;
  status?: InvoiceStatus;
  startDate?: string;
  endDate?: string;
}

// Get all invoices with optional filters
export function useInvoices(filters?: InvoiceFilters) {
  return useQuery({
    queryKey: queryKeys.invoices.list(filters || {}),
    queryFn: async () => {
      if (filters?.studioId && filters?.status) {
        return invoiceService.getByStatus(filters.studioId, filters.status);
      }
      if (filters?.studioId && filters?.startDate && filters?.endDate) {
        return invoiceService.getByDateRange(filters.studioId, filters.startDate, filters.endDate);
      }
      if (filters?.studioId) {
        return invoiceService.getByStudioId(filters.studioId);
      }
      if (filters?.clientId) {
        return invoiceService.getByClientId(filters.clientId);
      }
      return invoiceService.getAll();
    },
  });
}

// Get overdue invoices
export function useOverdueInvoices(studioId: string) {
  return useQuery({
    queryKey: queryKeys.invoices.overdue(studioId),
    queryFn: () => invoiceService.getOverdue(studioId),
    enabled: !!studioId,
  });
}

// Get pending invoices
export function usePendingInvoices(studioId: string) {
  return useQuery({
    queryKey: queryKeys.invoices.pending(studioId),
    queryFn: () => invoiceService.getPending(studioId),
    enabled: !!studioId,
  });
}

// Get a single invoice by ID
export function useInvoice(id: string) {
  return useQuery({
    queryKey: queryKeys.invoices.detail(id),
    queryFn: () => invoiceService.getById(id),
    enabled: !!id,
  });
}

// Get invoice with relations (client and booking)
export function useInvoiceWithRelations(id: string) {
  return useQuery({
    queryKey: [...queryKeys.invoices.detail(id), 'relations'],
    queryFn: () => invoiceService.getWithRelations(id),
    enabled: !!id,
  });
}

// Get invoice by booking ID
export function useInvoiceByBooking(bookingId: string) {
  return useQuery({
    queryKey: [...queryKeys.invoices.all, 'byBooking', bookingId],
    queryFn: () => invoiceService.getByBookingId(bookingId),
    enabled: !!bookingId,
  });
}

// Get invoice by invoice number
export function useInvoiceByNumber(studioId: string, invoiceNumber: string) {
  return useQuery({
    queryKey: [...queryKeys.invoices.all, 'byNumber', studioId, invoiceNumber],
    queryFn: () => invoiceService.getByInvoiceNumber(studioId, invoiceNumber),
    enabled: !!studioId && !!invoiceNumber,
  });
}

// Get total revenue
export function useTotalRevenue(studioId: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: [...queryKeys.invoices.all, 'revenue', studioId, startDate, endDate],
    queryFn: () => invoiceService.getTotalRevenue(studioId, startDate, endDate),
    enabled: !!studioId,
  });
}

// Generate invoice number
export function useGenerateInvoiceNumber(studioId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: [...queryKeys.invoices.all, 'generateNumber', studioId],
    queryFn: () => invoiceService.generateInvoiceNumber(studioId),
    enabled: !!studioId && enabled,
    staleTime: 0, // Always refetch to get latest number
  });
}

// Create invoice mutation
export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invoice: Omit<InvoiceInsert, 'id' | 'created_at' | 'updated_at'>) =>
      invoiceService.create(invoice),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
    },
  });
}

// Update invoice mutation
export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: InvoiceUpdate }) =>
      invoiceService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.detail(variables.id) });
    },
  });
}

// Delete invoice mutation
export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => invoiceService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
    },
  });
}

// Update invoice status mutation
export function useUpdateInvoiceStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: InvoiceStatus }) =>
      invoiceService.updateStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.detail(variables.id) });
    },
  });
}

// Mark invoice as paid mutation
export function useMarkInvoiceAsPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, paidAmount }: { id: string; paidAmount?: number }) =>
      invoiceService.markAsPaid(id, paidAmount),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
    },
  });
}

// Mark invoice as sent mutation
export function useMarkInvoiceAsSent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => invoiceService.markAsSent(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.detail(id) });
    },
  });
}

// Mark invoice as overdue mutation
export function useMarkInvoiceAsOverdue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => invoiceService.markAsOverdue(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.detail(id) });
    },
  });
}

// Cancel invoice mutation
export function useCancelInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => invoiceService.cancel(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.detail(id) });
    },
  });
}

// Update paid amount mutation
export function useUpdatePaidAmount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, paidAmount }: { id: string; paidAmount: number }) =>
      invoiceService.updatePaidAmount(id, paidAmount),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
    },
  });
}
