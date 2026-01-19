// src/embed-packs/store/packsStore.ts
import { create } from 'zustand';
import type {
  PacksConfig,
  PacksStudio,
  HourPack,
  Subscription,
  GiftCertificate,
  GiftCertificateFormData,
  ClientWallet,
  PacksView,
  PacksTab,
  PurchaseResult,
} from '../types';

interface PacksState {
  // Config
  config: PacksConfig | null;

  // Data
  studio: PacksStudio | null;
  packs: HourPack[];
  subscriptions: Subscription[];
  giftCertificates: GiftCertificate[];
  clientWallet: ClientWallet | null;

  // Navigation
  currentView: PacksView;
  currentTab: PacksTab;
  selectedPack: HourPack | null;
  selectedSubscription: Subscription | null;
  selectedGiftAmount: number | null;

  // Gift certificate form
  giftFormData: Partial<GiftCertificateFormData>;

  // Purchase flow
  purchaseResult: PurchaseResult | null;
  promoCode: string;
  promoDiscount: number | null;

  // UI state
  isLoading: boolean;
  isProcessing: boolean;
  error: string | null;
  showPurchaseModal: boolean;

  // Actions
  setConfig: (config: PacksConfig) => void;
  setStudio: (studio: PacksStudio) => void;
  setPacks: (packs: HourPack[]) => void;
  setSubscriptions: (subscriptions: Subscription[]) => void;
  setGiftCertificates: (gifts: GiftCertificate[]) => void;
  setClientWallet: (wallet: ClientWallet | null) => void;

  setCurrentView: (view: PacksView) => void;
  setCurrentTab: (tab: PacksTab) => void;
  selectPack: (pack: HourPack | null) => void;
  selectSubscription: (subscription: Subscription | null) => void;
  selectGiftAmount: (amount: number | null) => void;

  updateGiftFormData: (data: Partial<GiftCertificateFormData>) => void;
  resetGiftFormData: () => void;

  setPromoCode: (code: string) => void;
  setPromoDiscount: (discount: number | null) => void;
  setPurchaseResult: (result: PurchaseResult | null) => void;

  openPurchaseModal: () => void;
  closePurchaseModal: () => void;

  setLoading: (loading: boolean) => void;
  setProcessing: (processing: boolean) => void;
  setError: (error: string | null) => void;

  reset: () => void;
}

const initialGiftFormData: Partial<GiftCertificateFormData> = {
  amount: 100,
  recipientName: '',
  recipientEmail: '',
  senderName: '',
  message: '',
  deliveryDate: null,
  design: 'classic',
};

export const usePacksStore = create<PacksState>((set) => ({
  // Initial state
  config: null,
  studio: null,
  packs: [],
  subscriptions: [],
  giftCertificates: [],
  clientWallet: null,

  currentView: 'browse',
  currentTab: 'packs',
  selectedPack: null,
  selectedSubscription: null,
  selectedGiftAmount: null,

  giftFormData: { ...initialGiftFormData },

  purchaseResult: null,
  promoCode: '',
  promoDiscount: null,

  isLoading: false,
  isProcessing: false,
  error: null,
  showPurchaseModal: false,

  // Actions
  setConfig: (config) => set({ config }),
  setStudio: (studio) => set({ studio }),
  setPacks: (packs) => set({ packs }),
  setSubscriptions: (subscriptions) => set({ subscriptions }),
  setGiftCertificates: (giftCertificates) => set({ giftCertificates }),
  setClientWallet: (clientWallet) => set({ clientWallet }),

  setCurrentView: (currentView) => set({ currentView }),
  setCurrentTab: (currentTab) => set({ currentTab }),

  selectPack: (pack) =>
    set({
      selectedPack: pack,
      selectedSubscription: null,
      selectedGiftAmount: null,
      currentView: pack ? 'pack_detail' : 'browse',
    }),

  selectSubscription: (subscription) =>
    set({
      selectedSubscription: subscription,
      selectedPack: null,
      selectedGiftAmount: null,
      currentView: subscription ? 'subscription_detail' : 'browse',
    }),

  selectGiftAmount: (amount) =>
    set((state) => ({
      selectedGiftAmount: amount,
      selectedPack: null,
      selectedSubscription: null,
      giftFormData: { ...state.giftFormData, amount: amount || 100 },
      currentView: amount !== null ? 'gift_form' : 'browse',
    })),

  updateGiftFormData: (data) =>
    set((state) => ({
      giftFormData: { ...state.giftFormData, ...data },
    })),

  resetGiftFormData: () =>
    set({
      giftFormData: { ...initialGiftFormData },
      selectedGiftAmount: null,
    }),

  setPromoCode: (promoCode) => set({ promoCode }),
  setPromoDiscount: (promoDiscount) => set({ promoDiscount }),
  setPurchaseResult: (purchaseResult) =>
    set({
      purchaseResult,
      currentView: purchaseResult ? 'confirmation' : 'browse',
      showPurchaseModal: false,
    }),

  openPurchaseModal: () => set({ showPurchaseModal: true }),
  closePurchaseModal: () => set({ showPurchaseModal: false }),

  setLoading: (isLoading) => set({ isLoading }),
  setProcessing: (isProcessing) => set({ isProcessing }),
  setError: (error) => set({ error }),

  reset: () =>
    set({
      currentView: 'browse',
      currentTab: 'packs',
      selectedPack: null,
      selectedSubscription: null,
      selectedGiftAmount: null,
      giftFormData: { ...initialGiftFormData },
      purchaseResult: null,
      promoCode: '',
      promoDiscount: null,
      error: null,
      showPurchaseModal: false,
    }),
}));
