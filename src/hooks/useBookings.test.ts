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

import { useBookings, useUpcomingBookings, useTodayBookings } from './useBookings';
import { mockBookings, getMockTodayBookings } from '../lib/mockData';

let queryClient: QueryClient;

const createWrapper = () => {
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useBookings (mode demo)', () => {
  beforeEach(() => {
    queryClient?.clear();
  });

  it('retourne tous les bookings mock sans filtres', async () => {
    const { result } = renderHook(() => useBookings(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(mockBookings.length);
  });

  it('les bookings sont tries par start_time ascendant', async () => {
    const { result } = renderHook(() => useBookings(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const data = result.current.data!;
    for (let i = 1; i < data.length; i++) {
      const prev = new Date(data[i - 1].start_time).getTime();
      const curr = new Date(data[i].start_time).getTime();
      expect(prev).toBeLessThanOrEqual(curr);
    }
  });

  it('commence en loading puis passe a success', async () => {
    const { result } = renderHook(() => useBookings(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading || result.current.isSuccess).toBe(true);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.isLoading).toBe(false);
  });

  it('filtre les bookings par status confirmed', async () => {
    const { result } = renderHook(
      () => useBookings({ status: 'confirmed' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const confirmedBookings = mockBookings.filter((b) => b.status === 'confirmed');
    expect(result.current.data).toHaveLength(confirmedBookings.length);
    result.current.data?.forEach((booking) => {
      expect(booking.status).toBe('confirmed');
    });
  });

  it('filtre les bookings par status completed', async () => {
    const { result } = renderHook(
      () => useBookings({ status: 'completed' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const completedBookings = mockBookings.filter((b) => b.status === 'completed');
    expect(result.current.data).toHaveLength(completedBookings.length);
    result.current.data?.forEach((booking) => {
      expect(booking.status).toBe('completed');
    });
  });

  it('filtre les bookings par startDate', async () => {
    const now = new Date();
    const startDate = now.toISOString();

    const { result } = renderHook(
      () => useBookings({ startDate }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Tous les bookings retournes doivent avoir start_time >= startDate
    result.current.data?.forEach((booking) => {
      expect(new Date(booking.start_time).getTime()).toBeGreaterThanOrEqual(
        new Date(startDate).getTime(),
      );
    });
  });

  it('filtre les bookings par endDate', async () => {
    const now = new Date();
    const endDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString();

    const { result } = renderHook(
      () => useBookings({ endDate }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Tous les bookings retournes doivent avoir end_time <= endDate
    result.current.data?.forEach((booking) => {
      expect(new Date(booking.end_time).getTime()).toBeLessThanOrEqual(
        new Date(endDate).getTime(),
      );
    });
  });

  it('combine les filtres status et startDate', async () => {
    const now = new Date();
    const startDate = now.toISOString();

    const { result } = renderHook(
      () => useBookings({ status: 'confirmed', startDate }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    result.current.data?.forEach((booking) => {
      expect(booking.status).toBe('confirmed');
      expect(new Date(booking.start_time).getTime()).toBeGreaterThanOrEqual(
        new Date(startDate).getTime(),
      );
    });
  });

  it('retourne les donnees sans erreur', async () => {
    const { result } = renderHook(() => useBookings(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.error).toBeNull();
    expect(result.current.data).toBeDefined();
  });

  it('les bookings mock ont les champs requis', async () => {
    const { result } = renderHook(() => useBookings(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    result.current.data?.forEach((booking) => {
      expect(booking.id).toBeDefined();
      expect(booking.title).toBeDefined();
      expect(booking.start_time).toBeDefined();
      expect(booking.end_time).toBeDefined();
      expect(booking.status).toBeDefined();
      expect(typeof booking.total_amount).toBe('number');
    });
  });
});

describe('useUpcomingBookings (mode demo)', () => {
  beforeEach(() => {
    queryClient?.clear();
  });

  it('retourne les bookings futurs non annules', async () => {
    const { result } = renderHook(
      () => useUpcomingBookings('11111111-1111-1111-1111-111111111111'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const now = new Date();
    result.current.data?.forEach((booking) => {
      expect(new Date(booking.start_time).getTime()).toBeGreaterThanOrEqual(now.getTime());
      expect(booking.status).not.toBe('cancelled');
    });
  });

  it('les bookings futurs sont tries par start_time ascendant', async () => {
    const { result } = renderHook(
      () => useUpcomingBookings('11111111-1111-1111-1111-111111111111'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const data = result.current.data!;
    for (let i = 1; i < data.length; i++) {
      const prev = new Date(data[i - 1].start_time).getTime();
      const curr = new Date(data[i].start_time).getTime();
      expect(prev).toBeLessThanOrEqual(curr);
    }
  });

  it('respecte la limite de resultats', async () => {
    const limit = 2;
    const { result } = renderHook(
      () => useUpcomingBookings('11111111-1111-1111-1111-111111111111', limit),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data!.length).toBeLessThanOrEqual(limit);
  });

  it('ne sexecute pas si studioId est vide', () => {
    const { result } = renderHook(() => useUpcomingBookings(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useTodayBookings (mode demo)', () => {
  beforeEach(() => {
    queryClient?.clear();
  });

  it('retourne les bookings du jour', async () => {
    const { result } = renderHook(
      () => useTodayBookings('11111111-1111-1111-1111-111111111111'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const todayBookings = getMockTodayBookings();
    expect(result.current.data).toHaveLength(todayBookings.length);
  });

  it('ne sexecute pas si studioId est vide', () => {
    const { result } = renderHook(() => useTodayBookings(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
  });
});
