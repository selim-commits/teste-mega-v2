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
  // Data
  equipment: Equipment[];
  selectedEquipment: Equipment | null;
  categories: string[];
  locations: string[];

  // Filters
  filters: EquipmentFilters;

  // Pagination
  pagination: PaginationState;

  // Loading states
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  // Actions
  setEquipment: (equipment: Equipment[]) => void;
  addEquipment: (item: Equipment) => void;
  updateEquipment: (id: string, updates: Partial<Equipment>) => void;
  deleteEquipment: (id: string) => void;
  setSelectedEquipment: (item: Equipment | null) => void;
  setCategories: (categories: string[]) => void;
  setLocations: (locations: string[]) => void;
  setFilters: (filters: Partial<EquipmentFilters>) => void;
  resetFilters: () => void;
  setPagination: (pagination: Partial<PaginationState>) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setLoading: (loading: boolean) => void;
  setSubmitting: (submitting: boolean) => void;
  setError: (error: string | null) => void;
  clearEquipment: () => void;
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
    (set, get) => ({
      // Initial data
      equipment: [],
      selectedEquipment: null,
      categories: [],
      locations: [],

      // Initial filters
      filters: defaultFilters,

      // Initial pagination
      pagination: defaultPagination,

      // Initial loading states
      isLoading: false,
      isSubmitting: false,
      error: null,

      // Actions
      setEquipment: (equipment) => {
        // Extract unique categories and locations
        const categories = Array.from(new Set(equipment.map((e) => e.category)));
        const locations = Array.from(
          new Set(equipment.map((e) => e.location).filter(Boolean))
        ) as string[];

        set({
          equipment,
          categories,
          locations,
          error: null,
          pagination: {
            ...get().pagination,
            totalCount: equipment.length,
            totalPages: Math.ceil(equipment.length / get().pagination.pageSize),
          },
        });
      },

      addEquipment: (item) =>
        set((state) => {
          const newEquipment = [...state.equipment, item];
          const categories = Array.from(new Set(newEquipment.map((e) => e.category)));
          const locations = Array.from(
            new Set(newEquipment.map((e) => e.location).filter(Boolean))
          ) as string[];

          return {
            equipment: newEquipment,
            categories,
            locations,
            pagination: {
              ...state.pagination,
              totalCount: state.pagination.totalCount + 1,
              totalPages: Math.ceil(
                (state.pagination.totalCount + 1) / state.pagination.pageSize
              ),
            },
            error: null,
          };
        }),

      updateEquipment: (id, updates) =>
        set((state) => {
          const newEquipment = state.equipment.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          );
          const categories = Array.from(new Set(newEquipment.map((e) => e.category)));
          const locations = Array.from(
            new Set(newEquipment.map((e) => e.location).filter(Boolean))
          ) as string[];

          return {
            equipment: newEquipment,
            categories,
            locations,
            selectedEquipment:
              state.selectedEquipment?.id === id
                ? { ...state.selectedEquipment, ...updates }
                : state.selectedEquipment,
            error: null,
          };
        }),

      deleteEquipment: (id) =>
        set((state) => {
          const newEquipment = state.equipment.filter((item) => item.id !== id);
          const categories = Array.from(new Set(newEquipment.map((e) => e.category)));
          const locations = Array.from(
            new Set(newEquipment.map((e) => e.location).filter(Boolean))
          ) as string[];

          return {
            equipment: newEquipment,
            categories,
            locations,
            selectedEquipment:
              state.selectedEquipment?.id === id ? null : state.selectedEquipment,
            pagination: {
              ...state.pagination,
              totalCount: state.pagination.totalCount - 1,
              totalPages: Math.ceil(
                (state.pagination.totalCount - 1) / state.pagination.pageSize
              ),
            },
            error: null,
          };
        }),

      setSelectedEquipment: (item) => set({ selectedEquipment: item }),

      setCategories: (categories) => set({ categories }),

      setLocations: (locations) => set({ locations }),

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

      clearEquipment: () =>
        set({
          equipment: [],
          selectedEquipment: null,
          categories: [],
          locations: [],
          pagination: defaultPagination,
          error: null,
        }),
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

// Selectors
export const selectFilteredEquipment = (state: EquipmentState): Equipment[] => {
  let filtered = state.equipment;

  if (state.filters.status !== 'all') {
    filtered = filtered.filter((e) => e.status === state.filters.status);
  }

  if (state.filters.category !== 'all') {
    filtered = filtered.filter((e) => e.category === state.filters.category);
  }

  if (state.filters.location !== 'all') {
    filtered = filtered.filter((e) => e.location === state.filters.location);
  }

  if (state.filters.conditionMin > 0) {
    filtered = filtered.filter((e) => e.condition >= state.filters.conditionMin);
  }

  if (state.filters.searchQuery) {
    const query = state.filters.searchQuery.toLowerCase();
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

export const selectPaginatedEquipment = (state: EquipmentState): Equipment[] => {
  const filtered = selectFilteredEquipment(state);
  const { page, pageSize } = state.pagination;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return filtered.slice(start, end);
};

export const selectEquipmentByStatus = (
  state: EquipmentState,
  status: EquipmentStatus
): Equipment[] => {
  return state.equipment.filter((e) => e.status === status);
};

export const selectEquipmentByCategory = (
  state: EquipmentState,
  category: string
): Equipment[] => {
  return state.equipment.filter((e) => e.category === category);
};

export const selectAvailableEquipment = (state: EquipmentState): Equipment[] => {
  return state.equipment.filter((e) => e.status === 'available');
};

export const selectEquipmentValue = (state: EquipmentState): number => {
  return state.equipment.reduce(
    (total, e) => total + (e.current_value || e.purchase_price || 0),
    0
  );
};
