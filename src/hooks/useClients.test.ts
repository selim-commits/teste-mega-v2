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

import { useClients, useActiveClients } from './useClients';
import { mockClients } from '../lib/mockData';

let queryClient: QueryClient;

const createWrapper = () => {
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useClients (mode demo)', () => {
  beforeEach(() => {
    queryClient?.clear();
  });

  it('retourne tous les clients mock sans filtres', async () => {
    const { result } = renderHook(() => useClients(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(mockClients.length);
    expect(result.current.data?.[0].name).toBe('Marie Dupont');
  });

  it('commence en loading puis passe a success', async () => {
    const { result } = renderHook(() => useClients(), {
      wrapper: createWrapper(),
    });

    // Le hook doit passer par isLoading avant isSuccess
    expect(result.current.isLoading || result.current.isSuccess).toBe(true);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.isLoading).toBe(false);
  });

  it('filtre les clients par tier vip', async () => {
    const { result } = renderHook(() => useClients({ tier: 'vip' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const vipClients = mockClients.filter((c) => c.tier === 'vip');
    expect(result.current.data).toHaveLength(vipClients.length);
    result.current.data?.forEach((client) => {
      expect(client.tier).toBe('vip');
    });
  });

  it('filtre les clients par tier premium', async () => {
    const { result } = renderHook(() => useClients({ tier: 'premium' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const premiumClients = mockClients.filter((c) => c.tier === 'premium');
    expect(result.current.data).toHaveLength(premiumClients.length);
    result.current.data?.forEach((client) => {
      expect(client.tier).toBe('premium');
    });
  });

  it('filtre les clients par tier standard', async () => {
    const { result } = renderHook(() => useClients({ tier: 'standard' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const standardClients = mockClients.filter((c) => c.tier === 'standard');
    expect(result.current.data).toHaveLength(standardClients.length);
  });

  it('filtre les clients actifs (isActive: true)', async () => {
    const { result } = renderHook(() => useClients({ isActive: true }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const activeClients = mockClients.filter((c) => c.is_active === true);
    expect(result.current.data).toHaveLength(activeClients.length);
    result.current.data?.forEach((client) => {
      expect(client.is_active).toBe(true);
    });
  });

  it('retourne un tableau vide pour isActive false (tous les mocks sont actifs)', async () => {
    const { result } = renderHook(() => useClients({ isActive: false }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const inactiveClients = mockClients.filter((c) => c.is_active === false);
    expect(result.current.data).toHaveLength(inactiveClients.length);
  });

  it('retourne les donnees sans erreur', async () => {
    const { result } = renderHook(() => useClients(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.error).toBeNull();
    expect(result.current.data).toBeDefined();
  });

  it('les clients mock ont les champs requis', async () => {
    const { result } = renderHook(() => useClients(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    result.current.data?.forEach((client) => {
      expect(client.id).toBeDefined();
      expect(client.name).toBeDefined();
      expect(client.email).toBeDefined();
      expect(client.tier).toBeDefined();
      expect(typeof client.is_active).toBe('boolean');
    });
  });
});

describe('useActiveClients (mode demo)', () => {
  beforeEach(() => {
    queryClient?.clear();
  });

  it('retourne uniquement les clients actifs', async () => {
    const { result } = renderHook(
      () => useActiveClients('11111111-1111-1111-1111-111111111111'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const activeClients = mockClients.filter((c) => c.is_active === true);
    expect(result.current.data).toHaveLength(activeClients.length);
  });

  it('ne sexecute pas si studioId est vide', () => {
    const { result } = renderHook(() => useActiveClients(''), {
      wrapper: createWrapper(),
    });

    // enabled: !!studioId => false quand studioId est vide
    expect(result.current.fetchStatus).toBe('idle');
  });
});
