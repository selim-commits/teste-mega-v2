// src/embed-packs/services/packsApi.ts
import type {
  PacksStudio,
  HourPack,
  Subscription,
  GiftCertificate,
  ClientWallet,
  PurchaseRequest,
  PurchaseResult,
} from '../types';

const API_BASE = import.meta.env.VITE_SUPABASE_URL
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
  : '/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// ============================================
// Mock Data
// ============================================

const mockStudio: PacksStudio = {
  id: 'demo-studio',
  name: 'Studio Lumiere',
  slug: 'studio-lumiere',
  logo_url: null,
  timezone: 'Europe/Paris',
  currency: 'EUR',
  settings: {
    allow_gift_certificates: true,
    allow_subscriptions: true,
  },
};

const mockPacks: HourPack[] = [
  {
    id: 'pack-discovery',
    name: 'Decouverte',
    description: 'Ideal pour debuter et decouvrir notre espace',
    hours: 5,
    price: 225, // 45/h
    regular_price: 250, // 50/h standard
    savings_percent: 10,
    validity_days: 90,
    is_featured: false,
    is_popular: false,
    benefits: [
      'Acces a tous les espaces',
      'Reservation prioritaire',
      'Valide 3 mois',
    ],
    image_url: null,
  },
  {
    id: 'pack-pro',
    name: 'Pro',
    description: 'Le choix des professionnels reguliers',
    hours: 20,
    price: 800, // 40/h
    regular_price: 1000, // 50/h standard
    savings_percent: 20,
    validity_days: 180,
    is_featured: true,
    is_popular: true,
    benefits: [
      'Acces a tous les espaces',
      'Reservation prioritaire',
      'Support dedie',
      'Acces equipement premium',
      'Valide 6 mois',
    ],
    image_url: null,
  },
  {
    id: 'pack-enterprise',
    name: 'Enterprise',
    description: 'Pour les productions intensives',
    hours: 50,
    price: 1750, // 35/h
    regular_price: 2500, // 50/h standard
    savings_percent: 30,
    validity_days: 365,
    is_featured: false,
    is_popular: false,
    benefits: [
      'Acces a tous les espaces',
      'Reservation prioritaire garantie',
      'Support dedie 24/7',
      'Acces equipement premium inclus',
      'Assistant studio offert',
      'Valide 12 mois',
    ],
    image_url: null,
  },
];

const mockSubscriptions: Subscription[] = [
  {
    id: 'sub-monthly',
    name: 'Mensuel',
    description: 'Flexibilite maximale avec engagement mensuel',
    hours_per_month: 20,
    price_per_month: 750,
    billing_cycle: 'monthly',
    savings_percent: 25,
    benefits: [
      '20 heures par mois',
      'Heures cumulables (max 40h)',
      'Reservation prioritaire',
      'Annulation flexible',
      'Support prioritaire',
    ],
    rollover_hours: true,
    max_rollover_hours: 40,
    is_featured: false,
    cancellation_notice_days: 30,
  },
  {
    id: 'sub-yearly',
    name: 'Annuel',
    description: 'Engagement annuel pour les professionnels',
    hours_per_month: 20,
    price_per_month: 625,
    billing_cycle: 'yearly',
    yearly_price: 7500, // 625 * 12
    savings_percent: 37,
    benefits: [
      '240 heures par an (20h/mois)',
      'Heures cumulables illimitees',
      'Reservation garantie',
      'Equipement premium inclus',
      'Assistant studio 2h/mois offert',
      'Support VIP',
    ],
    rollover_hours: true,
    is_featured: true,
    cancellation_notice_days: 60,
  },
];

const mockGiftCertificates: GiftCertificate[] = [
  { id: 'gift-50', amount: 50, is_custom: false },
  { id: 'gift-100', amount: 100, is_custom: false },
  { id: 'gift-200', amount: 200, is_custom: false },
  { id: 'gift-custom', amount: 0, is_custom: true, min_amount: 25, max_amount: 1000 },
];

const mockClientWallet: ClientWallet = {
  clientId: 'client-demo',
  clientName: 'Jean Dupont',
  email: 'jean@example.com',
  balance: {
    hours: 12.5,
    credits: 5000, // 50 EUR
  },
  activePacks: [
    {
      id: 'active-pack-1',
      packId: 'pack-pro',
      packName: 'Pro',
      hoursRemaining: 12.5,
      hoursTotal: 20,
      purchasedAt: '2024-01-15T10:00:00Z',
      expiresAt: '2024-07-15T10:00:00Z',
    },
  ],
  activeSubscription: null,
};

function generateReference(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'PCK-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ============================================
// API Functions
// ============================================

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { error: errorData.message || `HTTP ${response.status}` };
    }

    const data = await response.json();
    return { data };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Network error' };
  }
}

export const packsApi = {
  // Get studio config
  getStudioConfig: async (studioId: string): Promise<ApiResponse<PacksStudio>> => {
    const result = await fetchApi<PacksStudio>(`/packs/config?studioId=${studioId}`);
    if (result.error) {
      return { data: mockStudio };
    }
    return result;
  },

  // Get available packs
  getPacks: async (studioId: string): Promise<ApiResponse<HourPack[]>> => {
    const result = await fetchApi<HourPack[]>(`/packs/list?studioId=${studioId}`);
    if (result.error) {
      return { data: mockPacks };
    }
    return result;
  },

  // Get available subscriptions
  getSubscriptions: async (studioId: string): Promise<ApiResponse<Subscription[]>> => {
    const result = await fetchApi<Subscription[]>(`/packs/subscriptions?studioId=${studioId}`);
    if (result.error) {
      return { data: mockSubscriptions };
    }
    return result;
  },

  // Get gift certificate options
  getGiftCertificates: async (studioId: string): Promise<ApiResponse<GiftCertificate[]>> => {
    const result = await fetchApi<GiftCertificate[]>(`/packs/gifts?studioId=${studioId}`);
    if (result.error) {
      return { data: mockGiftCertificates };
    }
    return result;
  },

  // Get client wallet (if logged in)
  getClientWallet: async (
    studioId: string,
    clientToken?: string
  ): Promise<ApiResponse<ClientWallet | null>> => {
    if (!clientToken) {
      return { data: null };
    }
    const result = await fetchApi<ClientWallet>(`/packs/wallet?studioId=${studioId}`, {
      headers: {
        Authorization: `Bearer ${clientToken}`,
      },
    });
    if (result.error) {
      // Return mock wallet for demo
      return { data: mockClientWallet };
    }
    return result;
  },

  // Validate promo code
  validatePromoCode: async (
    studioId: string,
    code: string,
    itemType: 'pack' | 'subscription' | 'gift_certificate',
    itemId: string
  ): Promise<ApiResponse<{ valid: boolean; discount_percent: number; message?: string }>> => {
    const result = await fetchApi<{ valid: boolean; discount_percent: number; message?: string }>(
      `/packs/promo/validate`,
      {
        method: 'POST',
        body: JSON.stringify({ studioId, code, itemType, itemId }),
      }
    );
    if (result.error) {
      // Mock: SAVE10 gives 10% off
      if (code.toUpperCase() === 'SAVE10') {
        return { data: { valid: true, discount_percent: 10 } };
      }
      if (code.toUpperCase() === 'WELCOME20') {
        return { data: { valid: true, discount_percent: 20 } };
      }
      return { data: { valid: false, discount_percent: 0, message: 'Code promo invalide' } };
    }
    return result;
  },

  // Create purchase (returns Stripe checkout URL)
  createPurchase: async (
    studioId: string,
    request: PurchaseRequest,
    clientToken?: string
  ): Promise<ApiResponse<PurchaseResult>> => {
    const headers: Record<string, string> = {};
    if (clientToken) {
      headers.Authorization = `Bearer ${clientToken}`;
    }

    const result = await fetchApi<PurchaseResult>(`/packs/purchase`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ studioId, ...request }),
    });

    if (result.error) {
      // Generate mock response
      let itemName = '';
      let amount = 0;

      if (request.type === 'pack') {
        const pack = mockPacks.find((p) => p.id === request.itemId);
        itemName = pack?.name || 'Pack';
        amount = pack?.price || 0;
      } else if (request.type === 'subscription') {
        const sub = mockSubscriptions.find((s) => s.id === request.itemId);
        itemName = sub?.name || 'Abonnement';
        amount = sub?.billing_cycle === 'yearly' ? sub.yearly_price || 0 : sub?.price_per_month || 0;
      } else if (request.type === 'gift_certificate' && request.giftData) {
        itemName = `Carte Cadeau ${request.giftData.amount}`;
        amount = request.giftData.amount;
      }

      return {
        data: {
          id: 'mock-purchase-' + Date.now(),
          reference: generateReference(),
          status: 'completed',
          type: request.type,
          itemName,
          amount,
          paymentUrl: null, // Mock: no payment needed
          giftCertificateCode:
            request.type === 'gift_certificate' ? `GIFT-${generateReference()}` : undefined,
        },
      };
    }
    return result;
  },

  // Verify payment after Stripe redirect
  verifyPayment: async (
    purchaseId: string,
    sessionId: string
  ): Promise<ApiResponse<PurchaseResult>> => {
    return fetchApi<PurchaseResult>(`/packs/verify-payment`, {
      method: 'POST',
      body: JSON.stringify({ purchaseId, sessionId }),
    });
  },
};
