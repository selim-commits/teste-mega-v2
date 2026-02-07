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
    clients: [],
    selectedClient: null,
    filters: { tier: 'all', isActive: 'all', tags: [], searchQuery: '' },
    searchQuery: '',
    pagination: { page: 1, pageSize: 20, totalCount: 0, totalPages: 0 },
    isLoading: false,
    isSubmitting: false,
    error: null,
  });
});

describe('clientStore - CRUD', () => {
  it('set les clients et met a jour la pagination', () => {
    const clients = [mockClient({ id: 'c-1' }), mockClient({ id: 'c-2' })];
    useClientStore.getState().setClients(clients);
    expect(useClientStore.getState().clients).toHaveLength(2);
    expect(useClientStore.getState().pagination.totalCount).toBe(2);
  });

  it('ajoute un client et incremente la pagination', () => {
    useClientStore.getState().setClients([mockClient()]);
    useClientStore.getState().addClient(mockClient({ id: 'c-2', name: 'Jean' }));
    expect(useClientStore.getState().clients).toHaveLength(2);
    expect(useClientStore.getState().pagination.totalCount).toBe(2);
  });

  it('met a jour un client', () => {
    useClientStore.getState().setClients([mockClient()]);
    useClientStore.getState().updateClient('c-1', { name: 'Marie Updated' });
    expect(useClientStore.getState().clients[0].name).toBe('Marie Updated');
  });

  it('supprime un client et decremente la pagination', () => {
    useClientStore.getState().setClients([mockClient(), mockClient({ id: 'c-2' })]);
    useClientStore.getState().deleteClient('c-1');
    expect(useClientStore.getState().clients).toHaveLength(1);
    expect(useClientStore.getState().pagination.totalCount).toBe(1);
  });
});

describe('clientStore - filtres', () => {
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
});

describe('selectFilteredClients', () => {
  const clients = [
    mockClient({ id: 'c-1', tier: 'vip', is_active: true, tags: ['photo'], name: 'Alice' }),
    mockClient({ id: 'c-2', tier: 'standard', is_active: false, tags: ['video'], name: 'Bob' }),
    mockClient({ id: 'c-3', tier: 'vip', is_active: true, tags: ['photo', 'video'], name: 'Charlie' }),
  ];

  it('filtre par tier', () => {
    useClientStore.setState({ clients, filters: { tier: 'vip', isActive: 'all', tags: [], searchQuery: '' } });
    expect(selectFilteredClients(useClientStore.getState())).toHaveLength(2);
  });

  it('filtre par isActive', () => {
    useClientStore.setState({ clients, filters: { tier: 'all', isActive: true, tags: [], searchQuery: '' } });
    expect(selectFilteredClients(useClientStore.getState())).toHaveLength(2);
  });

  it('filtre par tags', () => {
    useClientStore.setState({ clients, filters: { tier: 'all', isActive: 'all', tags: ['video'], searchQuery: '' } });
    expect(selectFilteredClients(useClientStore.getState())).toHaveLength(2);
  });

  it('filtre par recherche', () => {
    useClientStore.setState({ clients, filters: { tier: 'all', isActive: 'all', tags: [], searchQuery: 'alice' } });
    expect(selectFilteredClients(useClientStore.getState())).toHaveLength(1);
  });
});

describe('selectPaginatedClients', () => {
  it('pagine correctement', () => {
    const clients = Array.from({ length: 5 }, (_, i) => mockClient({ id: `c-${i}` }));
    useClientStore.setState({
      clients,
      filters: { tier: 'all', isActive: 'all', tags: [], searchQuery: '' },
      pagination: { page: 1, pageSize: 2, totalCount: 5, totalPages: 3 },
    });
    expect(selectPaginatedClients(useClientStore.getState())).toHaveLength(2);
  });
});

describe('selectActiveClients', () => {
  it('retourne uniquement les clients actifs', () => {
    useClientStore.setState({
      clients: [
        mockClient({ id: 'c-1', is_active: true }),
        mockClient({ id: 'c-2', is_active: false }),
      ],
    });
    expect(selectActiveClients(useClientStore.getState())).toHaveLength(1);
  });
});
