import { describe, it, expect, beforeEach } from 'vitest';
import {
  useClientStore,
  selectFilteredClients,
  selectPaginatedClients,
  selectActiveClients,
} from './clientStore';
import type { Client } from '../types/database';

const mockClient = (overrides: Partial<Client> = {}): Client => ({
  id: 'c-1',
  studio_id: 'studio-1',
  name: 'Marie Dupont',
  email: 'marie@test.com',
  phone: '+33 6 12 34 56 78',
  company: 'Studio Pro',
  address: '123 Rue Test',
  city: 'Paris',
  country: 'France',
  postal_code: '75001',
  tier: 'standard',
  notes: null,
  tags: [],
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
} as Client);

beforeEach(() => {
  useClientStore.setState({
    selectedClient: null,
    filters: { tier: 'all', isActive: 'all', tags: [], searchQuery: '' },
    searchQuery: '',
    pagination: { page: 1, pageSize: 20, totalCount: 0, totalPages: 0 },
    isLoading: false,
    isSubmitting: false,
    error: null,
  });
});

describe('clientStore - UI state', () => {
  it('setFilters reset la page a 1', () => {
    useClientStore.setState({
      pagination: { page: 3, pageSize: 20, totalCount: 100, totalPages: 5 },
    });
    useClientStore.getState().setFilters({ tier: 'vip' });
    expect(useClientStore.getState().pagination.page).toBe(1);
    expect(useClientStore.getState().filters.tier).toBe('vip');
  });

  it('setPageSize reset la page a 1 et recalcule totalPages', () => {
    useClientStore.setState({
      pagination: { page: 3, pageSize: 20, totalCount: 100, totalPages: 5 },
    });
    useClientStore.getState().setPageSize(10);
    expect(useClientStore.getState().pagination.page).toBe(1);
    expect(useClientStore.getState().pagination.totalPages).toBe(10);
  });

  it('set le selectedClient', () => {
    const client = mockClient();
    useClientStore.getState().setSelectedClient(client);
    expect(useClientStore.getState().selectedClient?.id).toBe('c-1');

    useClientStore.getState().setSelectedClient(null);
    expect(useClientStore.getState().selectedClient).toBeNull();
  });
});

describe('selectFilteredClients', () => {
  const clients = [
    mockClient({ id: 'c-1', tier: 'vip', is_active: true, tags: ['photo'], name: 'Alice' }),
    mockClient({ id: 'c-2', tier: 'standard', is_active: false, tags: ['video'], name: 'Bob' }),
    mockClient({ id: 'c-3', tier: 'vip', is_active: true, tags: ['photo', 'video'], name: 'Charlie' }),
  ];

  it('filtre par tier', () => {
    const filters = { tier: 'vip' as const, isActive: 'all' as const, tags: [] as string[], searchQuery: '' };
    expect(selectFilteredClients(clients, filters)).toHaveLength(2);
  });

  it('filtre par isActive', () => {
    const filters = { tier: 'all' as const, isActive: true as const, tags: [] as string[], searchQuery: '' };
    expect(selectFilteredClients(clients, filters)).toHaveLength(2);
  });

  it('filtre par tags', () => {
    const filters = { tier: 'all' as const, isActive: 'all' as const, tags: ['video'], searchQuery: '' };
    expect(selectFilteredClients(clients, filters)).toHaveLength(2);
  });

  it('filtre par recherche', () => {
    const filters = { tier: 'all' as const, isActive: 'all' as const, tags: [] as string[], searchQuery: 'alice' };
    expect(selectFilteredClients(clients, filters)).toHaveLength(1);
  });
});

describe('selectPaginatedClients', () => {
  it('pagine correctement', () => {
    const clients = Array.from({ length: 5 }, (_, i) => mockClient({ id: `c-${i}` }));
    const filters = { tier: 'all' as const, isActive: 'all' as const, tags: [] as string[], searchQuery: '' };
    const pagination = { page: 1, pageSize: 2, totalCount: 5, totalPages: 3 };
    expect(selectPaginatedClients(clients, filters, pagination)).toHaveLength(2);
  });
});

describe('selectActiveClients', () => {
  it('retourne uniquement les clients actifs', () => {
    const clients = [
      mockClient({ id: 'c-1', is_active: true }),
      mockClient({ id: 'c-2', is_active: false }),
    ];
    expect(selectActiveClients(clients)).toHaveLength(1);
  });
});
