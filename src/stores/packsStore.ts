import { create } from 'zustand';
import type { Pack, ClientPurchase, PricingProductType } from '../types/database';

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

// Selector for filtered packs
export const selectFilteredPacks = (state: PacksState): Pack[] => {
  const { packs, packFilters } = state;
  let filtered = [...packs];

  // Apply search filter
  if (packFilters.searchQuery) {
    const query = packFilters.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (pack) =>
        pack.name.toLowerCase().includes(query) ||
        (pack.description && pack.description.toLowerCase().includes(query))
    );
  }

  // Apply type filter
  if (packFilters.type !== 'all') {
    filtered = filtered.filter((pack) => pack.type === packFilters.type);
  }

  // Apply active filter
  if (packFilters.isActive !== 'all') {
    filtered = filtered.filter((pack) => pack.is_active === packFilters.isActive);
  }

  return filtered;
};

// Selector for filtered purchases
export const selectFilteredPurchases = (state: PacksState): ClientPurchase[] => {
  const { purchases, purchaseFilters } = state;
  let filtered = [...purchases];

  // Apply search filter
  if (purchaseFilters.searchQuery) {
    const query = purchaseFilters.searchQuery.toLowerCase();
    filtered = filtered.filter((purchase) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const client = (purchase as any).client;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const product = (purchase as any).product;
      return (
        (client?.name && client.name.toLowerCase().includes(query)) ||
        (client?.email && client.email.toLowerCase().includes(query)) ||
        (product?.name && product.name.toLowerCase().includes(query))
      );
    });
  }

  // Apply status filter
  if (purchaseFilters.status !== 'all') {
    filtered = filtered.filter((purchase) => purchase.status === purchaseFilters.status);
  }

  return filtered;
};
