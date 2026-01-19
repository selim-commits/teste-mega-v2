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

interface FinanceStats {
  totalRevenue: number;
  pendingAmount: number;
  overdueAmount: number;
  paidThisMonth: number;
  invoiceCount: number;
  paidInvoiceCount: number;
  overdueInvoiceCount: number;
  averageInvoiceValue: number;
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
  // Data
  invoices: Invoice[];
  quotes: Quote[];
  payments: Payment[];
  selectedInvoice: Invoice | null;
  selectedQuote: Quote | null;

  // Stats
  stats: FinanceStats;

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

  // Invoice actions
  setInvoices: (invoices: Invoice[]) => void;
  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  setSelectedInvoice: (invoice: Invoice | null) => void;

  // Quote actions
  setQuotes: (quotes: Quote[]) => void;
  addQuote: (quote: Quote) => void;
  updateQuote: (id: string, updates: Partial<Quote>) => void;
  deleteQuote: (id: string) => void;
  setSelectedQuote: (quote: Quote | null) => void;
  convertQuoteToInvoice: (quoteId: string, invoice: Invoice) => void;

  // Payment actions
  setPayments: (payments: Payment[]) => void;
  addPayment: (payment: Payment) => void;
  deletePayment: (id: string) => void;

  // Stats actions
  setStats: (stats: Partial<FinanceStats>) => void;
  calculateStats: () => void;

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

  // Clear actions
  clearFinanceData: () => void;
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

const defaultStats: FinanceStats = {
  totalRevenue: 0,
  pendingAmount: 0,
  overdueAmount: 0,
  paidThisMonth: 0,
  invoiceCount: 0,
  paidInvoiceCount: 0,
  overdueInvoiceCount: 0,
  averageInvoiceValue: 0,
};

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      // Initial data
      invoices: [],
      quotes: [],
      payments: [],
      selectedInvoice: null,
      selectedQuote: null,

      // Initial stats
      stats: defaultStats,

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

      // Invoice actions
      setInvoices: (invoices) => {
        set({
          invoices,
          error: null,
          pagination: {
            ...get().pagination,
            totalCount: invoices.length,
            totalPages: Math.ceil(invoices.length / get().pagination.pageSize),
          },
        });
        get().calculateStats();
      },

      addInvoice: (invoice) => {
        set((state) => ({
          invoices: [...state.invoices, invoice],
          pagination: {
            ...state.pagination,
            totalCount: state.pagination.totalCount + 1,
            totalPages: Math.ceil(
              (state.pagination.totalCount + 1) / state.pagination.pageSize
            ),
          },
          error: null,
        }));
        get().calculateStats();
      },

      updateInvoice: (id, updates) => {
        set((state) => ({
          invoices: state.invoices.map((invoice) =>
            invoice.id === id ? { ...invoice, ...updates } : invoice
          ),
          selectedInvoice:
            state.selectedInvoice?.id === id
              ? { ...state.selectedInvoice, ...updates }
              : state.selectedInvoice,
          error: null,
        }));
        get().calculateStats();
      },

      deleteInvoice: (id) => {
        set((state) => ({
          invoices: state.invoices.filter((invoice) => invoice.id !== id),
          selectedInvoice:
            state.selectedInvoice?.id === id ? null : state.selectedInvoice,
          pagination: {
            ...state.pagination,
            totalCount: state.pagination.totalCount - 1,
            totalPages: Math.ceil(
              (state.pagination.totalCount - 1) / state.pagination.pageSize
            ),
          },
          error: null,
        }));
        get().calculateStats();
      },

      setSelectedInvoice: (invoice) => set({ selectedInvoice: invoice }),

      // Quote actions
      setQuotes: (quotes) => set({ quotes, error: null }),

      addQuote: (quote) =>
        set((state) => ({
          quotes: [...state.quotes, quote],
          error: null,
        })),

      updateQuote: (id, updates) =>
        set((state) => ({
          quotes: state.quotes.map((quote) =>
            quote.id === id ? { ...quote, ...updates } : quote
          ),
          selectedQuote:
            state.selectedQuote?.id === id
              ? { ...state.selectedQuote, ...updates }
              : state.selectedQuote,
          error: null,
        })),

      deleteQuote: (id) =>
        set((state) => ({
          quotes: state.quotes.filter((quote) => quote.id !== id),
          selectedQuote:
            state.selectedQuote?.id === id ? null : state.selectedQuote,
          error: null,
        })),

      setSelectedQuote: (quote) => set({ selectedQuote: quote }),

      convertQuoteToInvoice: (quoteId, invoice) => {
        set((state) => ({
          quotes: state.quotes.map((quote) =>
            quote.id === quoteId ? { ...quote, status: 'accepted' as const } : quote
          ),
          invoices: [...state.invoices, invoice],
          selectedQuote: null,
          error: null,
        }));
        get().calculateStats();
      },

      // Payment actions
      setPayments: (payments) => {
        set({ payments, error: null });
        get().calculateStats();
      },

      addPayment: (payment) => {
        set((state) => ({
          payments: [...state.payments, payment],
          error: null,
        }));
        // Update the corresponding invoice's paid_amount
        const invoice = get().invoices.find((i) => i.id === payment.invoice_id);
        if (invoice) {
          get().updateInvoice(payment.invoice_id, {
            paid_amount: invoice.paid_amount + payment.amount,
            status:
              invoice.paid_amount + payment.amount >= invoice.total_amount
                ? 'paid'
                : invoice.status,
          });
        }
      },

      deletePayment: (id) => {
        const payment = get().payments.find((p) => p.id === id);
        set((state) => ({
          payments: state.payments.filter((p) => p.id !== id),
          error: null,
        }));
        // Update the corresponding invoice's paid_amount
        if (payment) {
          const invoice = get().invoices.find((i) => i.id === payment.invoice_id);
          if (invoice) {
            get().updateInvoice(payment.invoice_id, {
              paid_amount: Math.max(0, invoice.paid_amount - payment.amount),
            });
          }
        }
      },

      // Stats actions
      setStats: (stats) =>
        set((state) => ({
          stats: { ...state.stats, ...stats },
        })),

      calculateStats: () => {
        const { invoices, payments } = get();
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const totalRevenue = invoices
          .filter((i) => i.status === 'paid')
          .reduce((sum, i) => sum + i.total_amount, 0);

        const pendingAmount = invoices
          .filter((i) => i.status === 'sent')
          .reduce((sum, i) => sum + (i.total_amount - i.paid_amount), 0);

        const overdueAmount = invoices
          .filter((i) => i.status === 'overdue')
          .reduce((sum, i) => sum + (i.total_amount - i.paid_amount), 0);

        const paidThisMonth = payments
          .filter((p) => new Date(p.created_at) >= startOfMonth)
          .reduce((sum, p) => sum + p.amount, 0);

        const paidInvoiceCount = invoices.filter((i) => i.status === 'paid').length;
        const overdueInvoiceCount = invoices.filter(
          (i) => i.status === 'overdue'
        ).length;

        const averageInvoiceValue =
          invoices.length > 0
            ? invoices.reduce((sum, i) => sum + i.total_amount, 0) / invoices.length
            : 0;

        set({
          stats: {
            totalRevenue,
            pendingAmount,
            overdueAmount,
            paidThisMonth,
            invoiceCount: invoices.length,
            paidInvoiceCount,
            overdueInvoiceCount,
            averageInvoiceValue,
          },
        });
      },

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

      // Clear actions
      clearFinanceData: () =>
        set({
          invoices: [],
          quotes: [],
          payments: [],
          selectedInvoice: null,
          selectedQuote: null,
          stats: defaultStats,
          pagination: defaultPagination,
          error: null,
        }),
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

// Selectors
export const selectFilteredInvoices = (state: FinanceState): Invoice[] => {
  let filtered = state.invoices;

  if (state.invoiceFilters.status !== 'all') {
    filtered = filtered.filter((i) => i.status === state.invoiceFilters.status);
  }

  if (state.invoiceFilters.clientId) {
    filtered = filtered.filter(
      (i) => i.client_id === state.invoiceFilters.clientId
    );
  }

  if (state.invoiceFilters.dateFrom) {
    filtered = filtered.filter(
      (i) => i.issue_date >= state.invoiceFilters.dateFrom!
    );
  }

  if (state.invoiceFilters.dateTo) {
    filtered = filtered.filter(
      (i) => i.issue_date <= state.invoiceFilters.dateTo!
    );
  }

  if (state.invoiceFilters.searchQuery) {
    const query = state.invoiceFilters.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (i) =>
        i.invoice_number.toLowerCase().includes(query) ||
        i.notes?.toLowerCase().includes(query)
    );
  }

  return filtered;
};

export const selectPaginatedInvoices = (state: FinanceState): Invoice[] => {
  const filtered = selectFilteredInvoices(state);
  const { page, pageSize } = state.pagination;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return filtered.slice(start, end);
};

export const selectInvoicesByStatus = (
  state: FinanceState,
  status: InvoiceStatus
): Invoice[] => {
  return state.invoices.filter((i) => i.status === status);
};

export const selectOverdueInvoices = (state: FinanceState): Invoice[] => {
  return state.invoices.filter((i) => i.status === 'overdue');
};

export const selectRecentPayments = (
  state: FinanceState,
  limit: number = 10
): Payment[] => {
  return [...state.payments]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, limit);
};

export const selectPaymentsByInvoice = (
  state: FinanceState,
  invoiceId: string
): Payment[] => {
  return state.payments.filter((p) => p.invoice_id === invoiceId);
};
