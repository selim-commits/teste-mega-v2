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

  // Selected items (UI state)
  selectedPack: Pack | null;
  setSelectedPack: (pack: Pack | null) => void;
  selectedPurchase: ClientPurchase | null;
  setSelectedPurchase: (purchase: ClientPurchase | null) => void;

  // Pack filters
  packFilters: PacksFilters;
  setPackFilters: (filters: Partial<PacksFilters>) => void;
  resetPackFilters: () => void;

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

  // Selected items
  selectedPack: null,
  setSelectedPack: (pack) => set({ selectedPack: pack }),
  selectedPurchase: null,
  setSelectedPurchase: (purchase) => set({ selectedPurchase: purchase }),

  // Pack filters
  packFilters: defaultPackFilters,
  setPackFilters: (filters) =>
    set((state) => ({
      packFilters: { ...state.packFilters, ...filters },
      pagination: { ...state.pagination, page: 1 },
    })),
  resetPackFilters: () => set({ packFilters: defaultPackFilters }),

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

// Selector for filtered packs - takes data as parameter
export const selectFilteredPacks = (packs: Pack[], packFilters: PacksFilters): Pack[] => {
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

// Selector for filtered purchases - takes data as parameter
export const selectFilteredPurchases = (
  purchases: ClientPurchase[],
  purchaseFilters: PurchaseFilters
): ClientPurchase[] => {
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
