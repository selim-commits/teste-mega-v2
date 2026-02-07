import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';

// Mock isDemoMode a true AVANT d'importer les hooks
vi.mock('../lib/supabase', () => ({
  isDemoMode: true,
  withDemoMode: <T>(demoData: T) => () => async () => demoData,
  supabase: {},
}));

vi.mock('../lib/env', () => ({
  isDemoMode: true,
  env: {
    VITE_SUPABASE_URL: undefined,
    VITE_SUPABASE_ANON_KEY: undefined,
  },
}));

import { useInvoices } from './useInvoices';
import { mockInvoices } from '../lib/mockData';

let queryClient: QueryClient;

const createWrapper = () => {
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useInvoices (mode demo)', () => {
  beforeEach(() => {
    queryClient?.clear();
  });

  it('retourne toutes les factures mock sans filtres', async () => {
    const { result } = renderHook(() => useInvoices(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(mockInvoices.length);
  });

  it('commence en loading puis passe a success', async () => {
    const { result } = renderHook(() => useInvoices(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading || result.current.isSuccess).toBe(true);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.isLoading).toBe(false);
  });

  it('filtre les factures par status paid', async () => {
    const { result } = renderHook(
      () => useInvoices({ status: 'paid' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const paidInvoices = mockInvoices.filter((i) => i.status === 'paid');
    expect(result.current.data).toHaveLength(paidInvoices.length);
    result.current.data?.forEach((invoice) => {
      expect(invoice.status).toBe('paid');
    });
  });

  it('filtre les factures par status sent', async () => {
    const { result } = renderHook(
      () => useInvoices({ status: 'sent' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const sentInvoices = mockInvoices.filter((i) => i.status === 'sent');
    expect(result.current.data).toHaveLength(sentInvoices.length);
    result.current.data?.forEach((invoice) => {
      expect(invoice.status).toBe('sent');
    });
  });

  it('filtre les factures par status pending', async () => {
    const { result } = renderHook(
      () => useInvoices({ status: 'pending' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const pendingInvoices = mockInvoices.filter((i) => i.status === 'pending');
    expect(result.current.data).toHaveLength(pendingInvoices.length);
    result.current.data?.forEach((invoice) => {
      expect(invoice.status).toBe('pending');
    });
  });

  it('filtre les factures par status draft', async () => {
    const { result } = renderHook(
      () => useInvoices({ status: 'draft' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const draftInvoices = mockInvoices.filter((i) => i.status === 'draft');
    expect(result.current.data).toHaveLength(draftInvoices.length);
    result.current.data?.forEach((invoice) => {
      expect(invoice.status).toBe('draft');
    });
  });

  it('filtre les factures par clientId', async () => {
    const clientId = 'client-1';
    const { result } = renderHook(
      () => useInvoices({ clientId }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const clientInvoices = mockInvoices.filter((i) => i.client_id === clientId);
    expect(result.current.data).toHaveLength(clientInvoices.length);
    result.current.data?.forEach((invoice) => {
      expect(invoice.client_id).toBe(clientId);
    });
  });

  it('combine les filtres status et clientId', async () => {
    const clientId = 'client-1';
    const status = 'paid';

    const { result } = renderHook(
      () => useInvoices({ status, clientId }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const filtered = mockInvoices.filter(
      (i) => i.status === status && i.client_id === clientId,
    );
    expect(result.current.data).toHaveLength(filtered.length);
    result.current.data?.forEach((invoice) => {
      expect(invoice.status).toBe(status);
      expect(invoice.client_id).toBe(clientId);
    });
  });

  it('retourne un tableau vide pour un status sans correspondance', async () => {
    const { result } = renderHook(
      () => useInvoices({ status: 'cancelled' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const cancelledInvoices = mockInvoices.filter((i) => i.status === 'cancelled');
    expect(result.current.data).toHaveLength(cancelledInvoices.length);
  });

  it('retourne les donnees sans erreur', async () => {
    const { result } = renderHook(() => useInvoices(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.error).toBeNull();
    expect(result.current.data).toBeDefined();
  });

  it('les factures mock ont les champs requis', async () => {
    const { result } = renderHook(() => useInvoices(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    result.current.data?.forEach((invoice) => {
      expect(invoice.id).toBeDefined();
      expect(invoice.invoice_number).toBeDefined();
      expect(invoice.status).toBeDefined();
      expect(typeof invoice.total_amount).toBe('number');
      expect(typeof invoice.paid_amount).toBe('number');
      expect(invoice.client_id).toBeDefined();
    });
  });

  it('les montants sont coherents (paid_amount <= total_amount)', async () => {
    const { result } = renderHook(() => useInvoices(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    result.current.data?.forEach((invoice) => {
      expect(invoice.paid_amount).toBeLessThanOrEqual(invoice.total_amount);
    });
  });
});
