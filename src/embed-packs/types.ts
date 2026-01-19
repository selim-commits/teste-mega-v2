// src/embed-packs/types.ts

// Config passed to packs widget
export interface PacksConfig {
  studioId: string;
  theme: 'light' | 'dark';
  accentColor: string;
  locale: string;
  showGiftCertificates?: boolean;
  showSubscriptions?: boolean;
}

// Studio info from API
export interface PacksStudio {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  timezone: string;
  currency: string;
  settings: {
    allow_gift_certificates: boolean;
    allow_subscriptions: boolean;
  };
}

// Hour pack definition
export interface HourPack {
  id: string;
  name: string;
  description: string | null;
  hours: number;
  price: number;
  regular_price: number; // Price without discount for comparison
  savings_percent: number;
  validity_days: number;
  is_featured: boolean;
  is_popular: boolean;
  benefits: string[];
  image_url: string | null;
}

// Subscription definition
export interface Subscription {
  id: string;
  name: string;
  description: string | null;
  hours_per_month: number;
  price_per_month: number;
  billing_cycle: 'monthly' | 'yearly';
  yearly_price?: number; // Total price if billed yearly
  savings_percent: number;
  benefits: string[];
  rollover_hours: boolean; // Can unused hours roll over
  max_rollover_hours?: number;
  is_featured: boolean;
  cancellation_notice_days: number;
}

// Gift certificate
export interface GiftCertificate {
  id: string;
  amount: number;
  is_custom: boolean;
  min_amount?: number;
  max_amount?: number;
}

// Gift certificate form data
export interface GiftCertificateFormData {
  amount: number;
  recipientName: string;
  recipientEmail: string;
  senderName: string;
  message: string;
  deliveryDate: string | null; // null = immediate
  design: 'classic' | 'modern' | 'festive';
}

// Client wallet info
export interface ClientWallet {
  clientId: string;
  clientName: string;
  email: string;
  balance: {
    hours: number;
    credits: number; // monetary credits in cents
  };
  activePacks: ActivePack[];
  activeSubscription: ActiveSubscription | null;
}

// Active pack on client account
export interface ActivePack {
  id: string;
  packId: string;
  packName: string;
  hoursRemaining: number;
  hoursTotal: number;
  purchasedAt: string;
  expiresAt: string;
}

// Active subscription on client account
export interface ActiveSubscription {
  id: string;
  subscriptionId: string;
  subscriptionName: string;
  hoursRemaining: number;
  hoursPerMonth: number;
  nextBillingDate: string;
  status: 'active' | 'paused' | 'cancelled';
}

// Purchase request
export interface PurchaseRequest {
  type: 'pack' | 'subscription' | 'gift_certificate';
  itemId: string;
  clientEmail?: string;
  giftData?: GiftCertificateFormData;
  promoCode?: string;
}

// Purchase result
export interface PurchaseResult {
  id: string;
  reference: string;
  status: 'pending' | 'completed';
  type: 'pack' | 'subscription' | 'gift_certificate';
  itemName: string;
  amount: number;
  paymentUrl: string | null; // Stripe checkout URL
  giftCertificateCode?: string; // For gift certificates
}

// Widget view/step
export type PacksView =
  | 'browse' // Main grid view
  | 'pack_detail' // Pack details
  | 'subscription_detail' // Subscription details
  | 'gift_form' // Gift certificate form
  | 'login' // Login/register prompt
  | 'checkout' // Payment modal
  | 'confirmation'; // Success screen

// Tab for main view
export type PacksTab = 'packs' | 'subscriptions' | 'gifts';

// PostMessage types
export type PacksPostMessageType =
  | 'ROOOM_PACKS_READY'
  | 'ROOOM_PACKS_RESIZE'
  | 'ROOOM_PACKS_PURCHASE_COMPLETE'
  | 'ROOOM_PACKS_ERROR'
  | 'ROOOM_PACKS_LOGIN_REQUIRED';

export interface PacksPostMessage {
  type: PacksPostMessageType;
  payload?: unknown;
}
