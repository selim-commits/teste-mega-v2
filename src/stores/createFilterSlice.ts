import type { StateCreator } from 'zustand';

export interface PaginationState {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface FilterSlice<F> {
  filters: F;
  pagination: PaginationState;
  setFilters: (filters: Partial<F>) => void;
  resetFilters: (defaults: F) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
}

/**
 * Factory pour creer un slice Zustand avec filtres + pagination.
 *
 * Usage (futur store):
 * ```ts
 * interface MyFilters { status: string; search: string; }
 * const defaultFilters: MyFilters = { status: 'all', search: '' };
 *
 * const useMyStore = create<FilterSlice<MyFilters>>()(
 *   createFilterSlice(defaultFilters, 20)
 * );
 * ```
 *
 * Pour combiner avec d'autres slices, utiliser le pattern `...createFilterSlice(defaults)(set, get, api)`.
 */
export function createFilterSlice<F>(
  defaultFilters: F,
  defaultPageSize: number = 20
): StateCreator<FilterSlice<F>, [], [], FilterSlice<F>> {
  return (set) => ({
    filters: defaultFilters,
    pagination: { page: 1, pageSize: defaultPageSize, totalCount: 0, totalPages: 0 },
    setFilters: (filters) =>
      set((state) => ({
        filters: { ...state.filters, ...filters },
        pagination: { ...state.pagination, page: 1 },
      })),
    resetFilters: (defaults) =>
      set((state) => ({
        filters: defaults,
        pagination: { ...state.pagination, page: 1 },
      })),
    setPage: (page) =>
      set((state) => ({
        pagination: { ...state.pagination, page },
      })),
    setPageSize: (size) =>
      set((state) => ({
        pagination: {
          ...state.pagination,
          pageSize: size,
          page: 1,
          totalPages: Math.ceil(state.pagination.totalCount / size),
        },
      })),
  });
}
