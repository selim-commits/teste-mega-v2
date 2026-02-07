import { describe, it, expect, beforeEach } from 'vitest';
import {
  useEquipmentStore,
  selectFilteredEquipment,
  selectAvailableEquipment,
  selectEquipmentValue,
} from './equipmentStore';
import type { Equipment } from '../types/database';

const mockEquip = (overrides: Partial<Equipment> = {}): Equipment => ({
  id: 'e-1',
  studio_id: 'studio-1',
  name: 'Canon EOS R5',
  category: 'camera',
  brand: 'Canon',
  model: 'EOS R5',
  description: 'Boitier mirrorless',
  serial_number: 'CN-001',
  status: 'available',
  condition: 5,
  purchase_date: '2023-01-01',
  purchase_price: 4500,
  current_value: 3800,
  qr_code: null,
  location: 'Studio A',
  last_maintenance_date: null,
  maintenance_interval_days: null,
  notes: null,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  ...overrides,
} as Equipment);

beforeEach(() => {
  useEquipmentStore.setState({
    selectedEquipment: null,
    filters: { status: 'all', category: 'all', location: 'all', conditionMin: 0, searchQuery: '' },
    pagination: { page: 1, pageSize: 20, totalCount: 0, totalPages: 0 },
    isLoading: false,
    isSubmitting: false,
    error: null,
  });
});

describe('equipmentStore - UI state', () => {
  it('set et reset les filtres', () => {
    useEquipmentStore.getState().setFilters({ status: 'available', category: 'camera' });
    expect(useEquipmentStore.getState().filters.status).toBe('available');
    expect(useEquipmentStore.getState().filters.category).toBe('camera');

    useEquipmentStore.getState().resetFilters();
    expect(useEquipmentStore.getState().filters.status).toBe('all');
    expect(useEquipmentStore.getState().filters.category).toBe('all');
  });

  it('setFilters reset la page a 1', () => {
    useEquipmentStore.setState({
      pagination: { page: 3, pageSize: 20, totalCount: 100, totalPages: 5 },
    });
    useEquipmentStore.getState().setFilters({ status: 'available' });
    expect(useEquipmentStore.getState().pagination.page).toBe(1);
  });

  it('set le selectedEquipment', () => {
    const equip = mockEquip();
    useEquipmentStore.getState().setSelectedEquipment(equip);
    expect(useEquipmentStore.getState().selectedEquipment?.id).toBe('e-1');

    useEquipmentStore.getState().setSelectedEquipment(null);
    expect(useEquipmentStore.getState().selectedEquipment).toBeNull();
  });
});

describe('selectFilteredEquipment', () => {
  const items = [
    mockEquip({ id: 'e-1', status: 'available', category: 'camera', condition: 5, name: 'Canon R5', brand: 'Canon', model: 'EOS R5' }),
    mockEquip({ id: 'e-2', status: 'maintenance', category: 'lighting', condition: 2, name: 'Profoto B10', brand: 'Profoto', model: 'B10' }),
    mockEquip({ id: 'e-3', status: 'available', category: 'camera', condition: 3, name: 'Sony A7', brand: 'Sony', model: 'A7 IV' }),
  ];

  it('filtre par status', () => {
    const filters = { status: 'available' as const, category: 'all', location: 'all', conditionMin: 0, searchQuery: '' };
    expect(selectFilteredEquipment(items, filters)).toHaveLength(2);
  });

  it('filtre par condition minimum', () => {
    const filters = { status: 'all' as const, category: 'all', location: 'all', conditionMin: 4, searchQuery: '' };
    expect(selectFilteredEquipment(items, filters)).toHaveLength(1);
  });

  it('filtre par recherche', () => {
    const filters = { status: 'all' as const, category: 'all', location: 'all', conditionMin: 0, searchQuery: 'canon' };
    expect(selectFilteredEquipment(items, filters)).toHaveLength(1);
  });
});

describe('selectAvailableEquipment', () => {
  it('retourne uniquement les equipements disponibles', () => {
    const items = [
      mockEquip({ id: 'e-1', status: 'available' }),
      mockEquip({ id: 'e-2', status: 'in_use' }),
      mockEquip({ id: 'e-3', status: 'available' }),
    ];
    expect(selectAvailableEquipment(items)).toHaveLength(2);
  });
});

describe('selectEquipmentValue', () => {
  it('calcule la valeur totale (current_value prioritaire)', () => {
    const items = [
      mockEquip({ id: 'e-1', current_value: 3800, purchase_price: 4500 }),
      mockEquip({ id: 'e-2', current_value: 1800, purchase_price: 2200 }),
    ];
    expect(selectEquipmentValue(items)).toBe(5600);
  });

  it('fallback sur purchase_price si pas de current_value', () => {
    const items = [
      mockEquip({ id: 'e-1', current_value: undefined as unknown as number, purchase_price: 4500 }),
    ];
    // current_value est falsy (undefined), donc fallback sur purchase_price
    expect(selectEquipmentValue(items)).toBe(4500);
  });
});
