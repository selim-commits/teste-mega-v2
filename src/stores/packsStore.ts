import { create } from 'zustand';
import type { Pack, ClientPurchase, ClientPurchaseWithRelations, PricingProductType } from '../types/database';

export type PackTabType = 'packs' | 'subscriptions' | 'certificates' | 'clients';

interface PacksFilters {
  searchQuery: string;
  type: PricingProductType | 'all';
  isActive: boolean | 'all';
}

interface PurchaseFilters {
  searchQuery: string;
  status: 'active' | 'paused' | 'cancelled' | 'expired' | 'all';
}

interface PacksState {
  // UI State
  activeTab: PackTabType;
  setActiveTab: (tab: PackTabType) => void;

  // Packs state
  packs: Pack[];
  setPacks: (packs: Pack[]) => void;
  selectedPack: Pack | null;
  setSelectedPack: (pack: Pack | null) => void;

  // Pack filters
  packFilters: PacksFilters;
  setPackFilters: (filters: Partial<PacksFilters>) => void;
  resetPackFilters: () => void;

  // Purchases state
  purchases: ClientPurchase[];
  setPurchases: (purchases: ClientPurchase[]) => void;
  selectedPurchase: ClientPurchase | null;
  setSelectedPurchase: (purchase: ClientPurchase | null) => void;

  // Purchase filters
  purchaseFilters: PurchaseFilters;
  setPurchaseFilters: (filters: Partial<PurchaseFilters>) => void;
  resetPurchaseFilters: () => void;

  // Pagination
  pagination: {
    page: number;
    pageSize: number;
  };
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
}

const defaultPackFilters: PacksFilters = {
  searchQuery: '',
  type: 'all',
  isActive: 'all',
};

const defaultPurchaseFilters: PurchaseFilters = {
  searchQuery: '',
  status: 'all',
};

export const usePacksStore = create<PacksState>((set) => ({
  // UI State
  activeTab: 'packs',
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Packs state
  packs: [],
  setPacks: (packs) => set({ packs }),
  selectedPack: null,
  setSelectedPack: (pack) => set({ selectedPack: pack }),

  // Pack filters
  packFilters: defaultPackFilters,
  setPackFilters: (filters) =>
    set((state) => ({
      packFilters: { ...state.packFilters, ...filters },
      pagination: { ...state.pagination, page: 1 },
    })),
  resetPackFilters: () => set({ packFilters: defaultPackFilters }),

  // Purchases state
  purchases: [],
  setPurchases: (purchases) => set({ purchases }),
  selectedPurchase: null,
  setSelectedPurchase: (purchase) => set({ selectedPurchase: purchase }),

  // Purchase filters
  purchaseFilters: defaultPurchaseFilters,
  setPurchaseFilters: (filters) =>
    set((state) => ({
      purchaseFilters: { ...state.purchaseFilters, ...filters },
      pagination: { ...state.pagination, page: 1 },
    })),
  resetPurchaseFilters: () => set({ purchaseFilters: defaultPurchaseFilters }),

  // Pagination
  pagination: {
    page: 1,
    pageSize: 12,
  },
  setPage: (page) => set((state) => ({ pagination: { ...state.pagination, page } })),
  setPageSize: (pageSize) => set((state) => ({ pagination: { ...state.pagination, pageSize, page: 1 } })),
}));

// Selector for filtered packs - returns packs directly if no filters applied
export const selectFilteredPacks = (state: PacksState): Pack[] => {
  const { packs, packFilters } = state;

  // If no filters applied, return the original array to maintain reference stability
  const hasSearchFilter = packFilters.searchQuery !== '';
  const hasTypeFilter = packFilters.type !== 'all';
  const hasActiveFilter = packFilters.isActive !== 'all';

  if (!hasSearchFilter && !hasTypeFilter && !hasActiveFilter) {
    return packs;
  }

  // Only create a new array when filtering is actually needed
  return packs.filter((pack) => {
    // Apply search filter
    if (hasSearchFilter) {
      const query = packFilters.searchQuery.toLowerCase();
      if (!pack.name.toLowerCase().includes(query) &&
          !(pack.description && pack.description.toLowerCase().includes(query))) {
        return false;
      }
    }

    // Apply type filter
    if (hasTypeFilter && pack.type !== packFilters.type) {
      return false;
    }

    // Apply active filter
    if (hasActiveFilter && pack.is_active !== packFilters.isActive) {
      return false;
    }

    return true;
  });
};

// Selector for filtered purchases - returns purchases directly if no filters applied
export const selectFilteredPurchases = (state: PacksState): ClientPurchase[] => {
  const { purchases, purchaseFilters } = state;

  // If no filters applied, return the original array to maintain reference stability
  const hasSearchFilter = purchaseFilters.searchQuery !== '';
  const hasStatusFilter = purchaseFilters.status !== 'all';

  if (!hasSearchFilter && !hasStatusFilter) {
    return purchases;
  }

  // Only create a new array when filtering is actually needed
  return purchases.filter((purchase) => {
    // Apply search filter
    if (hasSearchFilter) {
      const query = purchaseFilters.searchQuery.toLowerCase();
      const purchaseWithRelations = purchase as ClientPurchaseWithRelations;
      const client = purchaseWithRelations.client;
      const product = purchaseWithRelations.product;
      if (!(client?.name && client.name.toLowerCase().includes(query)) &&
          !(client?.email && client.email.toLowerCase().includes(query)) &&
          !(product?.name && product.name.toLowerCase().includes(query))) {
        return false;
      }
    }

    // Apply status filter
    if (hasStatusFilter && purchase.status !== purchaseFilters.status) {
      return false;
    }

    return true;
  });
};
