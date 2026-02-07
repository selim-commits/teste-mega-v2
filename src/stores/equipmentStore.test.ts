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
    equipment: [],
    selectedEquipment: null,
    categories: [],
    locations: [],
    filters: { status: 'all', category: 'all', location: 'all', conditionMin: 0, searchQuery: '' },
    pagination: { page: 1, pageSize: 20, totalCount: 0, totalPages: 0 },
    isLoading: false,
    isSubmitting: false,
    error: null,
  });
});

describe('equipmentStore - setEquipment', () => {
  it('extrait les categories et locations', () => {
    useEquipmentStore.getState().setEquipment([
      mockEquip({ id: 'e-1', category: 'camera', location: 'Studio A' }),
      mockEquip({ id: 'e-2', category: 'lighting', location: 'Studio B' }),
      mockEquip({ id: 'e-3', category: 'camera', location: 'Studio A' }),
    ]);
    const state = useEquipmentStore.getState();
    expect(state.categories).toEqual(['camera', 'lighting']);
    expect(state.locations).toEqual(['Studio A', 'Studio B']);
    expect(state.pagination.totalCount).toBe(3);
  });
});

describe('equipmentStore - CRUD', () => {
  it('ajoute un equipement et met a jour categories', () => {
    useEquipmentStore.getState().addEquipment(mockEquip({ category: 'camera' }));
    useEquipmentStore.getState().addEquipment(mockEquip({ id: 'e-2', category: 'lighting' }));
    expect(useEquipmentStore.getState().equipment).toHaveLength(2);
    expect(useEquipmentStore.getState().categories).toContain('lighting');
  });

  it('supprime et met a jour les categories', () => {
    useEquipmentStore.getState().setEquipment([
      mockEquip({ id: 'e-1', category: 'camera' }),
      mockEquip({ id: 'e-2', category: 'lighting' }),
    ]);
    useEquipmentStore.getState().deleteEquipment('e-2');
    expect(useEquipmentStore.getState().categories).toEqual(['camera']);
  });
});

describe('selectFilteredEquipment', () => {
  const items = [
    mockEquip({ id: 'e-1', status: 'available', category: 'camera', condition: 5, name: 'Canon R5' }),
    mockEquip({ id: 'e-2', status: 'maintenance', category: 'lighting', condition: 2, name: 'Profoto B10' }),
    mockEquip({ id: 'e-3', status: 'available', category: 'camera', condition: 3, name: 'Sony A7' }),
  ];

  it('filtre par status', () => {
    useEquipmentStore.setState({
      equipment: items,
      filters: { status: 'available', category: 'all', location: 'all', conditionMin: 0, searchQuery: '' },
    });
    expect(selectFilteredEquipment(useEquipmentStore.getState())).toHaveLength(2);
  });

  it('filtre par condition minimum', () => {
    useEquipmentStore.setState({
      equipment: items,
      filters: { status: 'all', category: 'all', location: 'all', conditionMin: 4, searchQuery: '' },
    });
    expect(selectFilteredEquipment(useEquipmentStore.getState())).toHaveLength(1);
  });

  it('filtre par recherche', () => {
    useEquipmentStore.setState({
      equipment: items,
      filters: { status: 'all', category: 'all', location: 'all', conditionMin: 0, searchQuery: 'canon' },
    });
    expect(selectFilteredEquipment(useEquipmentStore.getState())).toHaveLength(1);
  });
});

describe('selectAvailableEquipment', () => {
  it('retourne uniquement les equipements disponibles', () => {
    useEquipmentStore.setState({
      equipment: [
        mockEquip({ id: 'e-1', status: 'available' }),
        mockEquip({ id: 'e-2', status: 'in_use' }),
        mockEquip({ id: 'e-3', status: 'available' }),
      ],
    });
    expect(selectAvailableEquipment(useEquipmentStore.getState())).toHaveLength(2);
  });
});

describe('selectEquipmentValue', () => {
  it('calcule la valeur totale (current_value prioritaire)', () => {
    useEquipmentStore.setState({
      equipment: [
        mockEquip({ id: 'e-1', current_value: 3800, purchase_price: 4500 }),
        mockEquip({ id: 'e-2', current_value: 1800, purchase_price: 2200 }),
      ],
    });
    expect(selectEquipmentValue(useEquipmentStore.getState())).toBe(5600);
  });

  it('fallback sur purchase_price si pas de current_value', () => {
    useEquipmentStore.setState({
      equipment: [
        mockEquip({ id: 'e-1', current_value: undefined as unknown as number, purchase_price: 4500 }),
      ],
    });
    // current_value est falsy (undefined), donc fallback sur purchase_price
    expect(selectEquipmentValue(useEquipmentStore.getState())).toBe(4500);
  });
});
