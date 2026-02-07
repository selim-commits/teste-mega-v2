import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Equipment, EquipmentStatus } from '../types/database';

interface EquipmentFilters {
  status: EquipmentStatus | 'all';
  category: string | 'all';
  location: string | 'all';
  conditionMin: number;
  searchQuery: string;
}

interface PaginationState {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

interface EquipmentState {
  // UI State
  selectedEquipment: Equipment | null;

  // Filters
  filters: EquipmentFilters;

  // Pagination
  pagination: PaginationState;

  // Loading states
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  // Actions
  setSelectedEquipment: (item: Equipment | null) => void;
  setFilters: (filters: Partial<EquipmentFilters>) => void;
  resetFilters: () => void;
  setPagination: (pagination: Partial<PaginationState>) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setLoading: (loading: boolean) => void;
  setSubmitting: (submitting: boolean) => void;
  setError: (error: string | null) => void;
}

const defaultFilters: EquipmentFilters = {
  status: 'all',
  category: 'all',
  location: 'all',
  conditionMin: 0,
  searchQuery: '',
};

const defaultPagination: PaginationState = {
  page: 1,
  pageSize: 20,
  totalCount: 0,
  totalPages: 0,
};

export const useEquipmentStore = create<EquipmentState>()(
  persist(
    (set) => ({
      // Initial UI state
      selectedEquipment: null,

      // Initial filters
      filters: defaultFilters,

      // Initial pagination
      pagination: defaultPagination,

      // Initial loading states
      isLoading: false,
      isSubmitting: false,
      error: null,

      // Actions
      setSelectedEquipment: (item) => set({ selectedEquipment: item }),

      setFilters: (filters) =>
        set((state) => ({
          filters: { ...state.filters, ...filters },
          pagination: { ...state.pagination, page: 1 },
        })),

      resetFilters: () =>
        set({
          filters: defaultFilters,
          pagination: { ...defaultPagination },
        }),

      setPagination: (pagination) =>
        set((state) => ({
          pagination: { ...state.pagination, ...pagination },
        })),

      setPage: (page) =>
        set((state) => ({
          pagination: { ...state.pagination, page },
        })),

      setPageSize: (pageSize) =>
        set((state) => ({
          pagination: {
            ...state.pagination,
            pageSize,
            page: 1,
            totalPages: Math.ceil(state.pagination.totalCount / pageSize),
          },
        })),

      setLoading: (isLoading) => set({ isLoading }),

      setSubmitting: (isSubmitting) => set({ isSubmitting }),

      setError: (error) => set({ error }),
    }),
    {
      name: 'equipment-storage',
      partialize: (state) => ({
        filters: state.filters,
        pagination: { pageSize: state.pagination.pageSize },
      }),
    }
  )
);

// Selectors - take data as parameter
export const selectFilteredEquipment = (
  equipment: Equipment[],
  filters: EquipmentFilters
): Equipment[] => {
  let filtered = equipment;

  if (filters.status !== 'all') {
    filtered = filtered.filter((e) => e.status === filters.status);
  }

  if (filters.category !== 'all') {
    filtered = filtered.filter((e) => e.category === filters.category);
  }

  if (filters.location !== 'all') {
    filtered = filtered.filter((e) => e.location === filters.location);
  }

  if (filters.conditionMin > 0) {
    filtered = filtered.filter((e) => e.condition >= filters.conditionMin);
  }

  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (e) =>
        e.name.toLowerCase().includes(query) ||
        e.description?.toLowerCase().includes(query) ||
        e.brand?.toLowerCase().includes(query) ||
        e.model?.toLowerCase().includes(query) ||
        e.serial_number?.toLowerCase().includes(query)
    );
  }

  return filtered;
};

export const selectPaginatedEquipment = (
  equipment: Equipment[],
  filters: EquipmentFilters,
  pagination: PaginationState
): Equipment[] => {
  const filtered = selectFilteredEquipment(equipment, filters);
  const { page, pageSize } = pagination;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return filtered.slice(start, end);
};

export const selectEquipmentByStatus = (
  equipment: Equipment[],
  status: EquipmentStatus
): Equipment[] => {
  return equipment.filter((e) => e.status === status);
};

export const selectEquipmentByCategory = (
  equipment: Equipment[],
  category: string
): Equipment[] => {
  return equipment.filter((e) => e.category === category);
};

export const selectAvailableEquipment = (equipment: Equipment[]): Equipment[] => {
  return equipment.filter((e) => e.status === 'available');
};

export const selectEquipmentValue = (equipment: Equipment[]): number => {
  return equipment.reduce(
    (total, e) => total + (e.current_value || e.purchase_price || 0),
    0
  );
};
