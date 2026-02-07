import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Invoice, Payment, InvoiceStatus } from '../types/database';

// Quote type (similar to Invoice but for estimates)
export interface Quote {
  id: string;
  created_at: string;
  updated_at: string;
  studio_id: string;
  client_id: string;
  quote_number: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  issue_date: string;
  valid_until: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  notes: string | null;
  terms: string | null;
  pdf_url: string | null;
}

interface InvoiceFilters {
  status: InvoiceStatus | 'all';
  clientId: string | null;
  dateFrom: string | null;
  dateTo: string | null;
  searchQuery: string;
}

interface PaginationState {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

interface FinanceState {
  // UI State
  selectedInvoice: Invoice | null;
  selectedQuote: Quote | null;

  // Filters
  invoiceFilters: InvoiceFilters;

  // Pagination
  pagination: PaginationState;

  // Date range for reports
  dateRange: {
    from: Date | null;
    to: Date | null;
  };

  // Loading states
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  // UI Actions
  setSelectedInvoice: (invoice: Invoice | null) => void;
  setSelectedQuote: (quote: Quote | null) => void;

  // Filter actions
  setInvoiceFilters: (filters: Partial<InvoiceFilters>) => void;
  resetInvoiceFilters: () => void;

  // Pagination actions
  setPagination: (pagination: Partial<PaginationState>) => void;
  setPage: (page: number) => void;

  // Date range actions
  setDateRange: (from: Date | null, to: Date | null) => void;

  // Loading actions
  setLoading: (loading: boolean) => void;
  setSubmitting: (submitting: boolean) => void;
  setError: (error: string | null) => void;
}

const defaultFilters: InvoiceFilters = {
  status: 'all',
  clientId: null,
  dateFrom: null,
  dateTo: null,
  searchQuery: '',
};

const defaultPagination: PaginationState = {
  page: 1,
  pageSize: 20,
  totalCount: 0,
  totalPages: 0,
};

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set) => ({
      // Initial UI state
      selectedInvoice: null,
      selectedQuote: null,

      // Initial filters
      invoiceFilters: defaultFilters,

      // Initial pagination
      pagination: defaultPagination,

      // Initial date range
      dateRange: {
        from: null,
        to: null,
      },

      // Initial loading states
      isLoading: false,
      isSubmitting: false,
      error: null,

      // UI Actions
      setSelectedInvoice: (invoice) => set({ selectedInvoice: invoice }),
      setSelectedQuote: (quote) => set({ selectedQuote: quote }),

      // Filter actions
      setInvoiceFilters: (filters) =>
        set((state) => ({
          invoiceFilters: { ...state.invoiceFilters, ...filters },
          pagination: { ...state.pagination, page: 1 },
        })),

      resetInvoiceFilters: () =>
        set({
          invoiceFilters: defaultFilters,
          pagination: { ...defaultPagination },
        }),

      // Pagination actions
      setPagination: (pagination) =>
        set((state) => ({
          pagination: { ...state.pagination, ...pagination },
        })),

      setPage: (page) =>
        set((state) => ({
          pagination: { ...state.pagination, page },
        })),

      // Date range actions
      setDateRange: (from, to) => set({ dateRange: { from, to } }),

      // Loading actions
      setLoading: (isLoading) => set({ isLoading }),

      setSubmitting: (isSubmitting) => set({ isSubmitting }),

      setError: (error) => set({ error }),
    }),
    {
      name: 'finance-storage',
      partialize: (state) => ({
        invoiceFilters: state.invoiceFilters,
        pagination: { pageSize: state.pagination.pageSize },
        dateRange: state.dateRange,
      }),
    }
  )
);

// Selectors - take data as parameter
export const selectFilteredInvoices = (
  invoices: Invoice[],
  invoiceFilters: InvoiceFilters
): Invoice[] => {
  let filtered = invoices;

  if (invoiceFilters.status !== 'all') {
    filtered = filtered.filter((i) => i.status === invoiceFilters.status);
  }

  if (invoiceFilters.clientId) {
    filtered = filtered.filter(
      (i) => i.client_id === invoiceFilters.clientId
    );
  }

  if (invoiceFilters.dateFrom) {
    filtered = filtered.filter(
      (i) => i.issue_date >= invoiceFilters.dateFrom!
    );
  }

  if (invoiceFilters.dateTo) {
    filtered = filtered.filter(
      (i) => i.issue_date <= invoiceFilters.dateTo!
    );
  }

  if (invoiceFilters.searchQuery) {
    const query = invoiceFilters.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (i) =>
        i.invoice_number.toLowerCase().includes(query) ||
        i.notes?.toLowerCase().includes(query)
    );
  }

  return filtered;
};

export const selectPaginatedInvoices = (
  invoices: Invoice[],
  invoiceFilters: InvoiceFilters,
  pagination: PaginationState
): Invoice[] => {
  const filtered = selectFilteredInvoices(invoices, invoiceFilters);
  const { page, pageSize } = pagination;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return filtered.slice(start, end);
};

export const selectInvoicesByStatus = (
  invoices: Invoice[],
  status: InvoiceStatus
): Invoice[] => {
  return invoices.filter((i) => i.status === status);
};

export const selectOverdueInvoices = (invoices: Invoice[]): Invoice[] => {
  return invoices.filter((i) => i.status === 'overdue');
};

export const selectRecentPayments = (
  payments: Payment[],
  limit: number = 10
): Payment[] => {
  return [...payments]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, limit);
};

export const selectPaymentsByInvoice = (
  payments: Payment[],
  invoiceId: string
): Payment[] => {
  return payments.filter((p) => p.invoice_id === invoiceId);
};
