import { supabase } from '../lib/supabase';
import type {
  ClientPurchase,
  ClientPurchaseInsert,
  ClientPurchaseUpdate,
  SubscriptionStatus,
} from '../types/database';

// Re-export types for external use
export type {
  ClientPurchase,
  ClientPurchaseInsert,
  ClientPurchaseUpdate,
  SubscriptionStatus,
};

// Additional status type for purchases
export type PurchaseStatus = SubscriptionStatus;

// Extended types for subscriptions (uses same table)
export type ClientSubscription = ClientPurchase;
export type ClientSubscriptionInsert = ClientPurchaseInsert;

// Gift certificate is a purchase with gift fields populated
export interface GiftCertificate extends ClientPurchase {
  gift_code: string;
  gift_recipient_email: string | null;
  gift_message: string | null;
  gift_redeemed_at: string | null;
  gift_redeemed_by: string | null;
}

export interface GiftCertificateInsert extends Omit<ClientPurchaseInsert, 'gift_code'> {
  gift_code?: string;
  gift_recipient_email?: string | null;
  gift_message?: string | null;
}

export const purchaseService = {
  // Get all purchases for a client
  async getByClientId(clientId: string): Promise<ClientPurchase[]> {
    const { data, error } = await supabase
      .from('client_purchases')
      .select('*')
      .eq('client_id', clientId)
      .order('purchased_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  // Get all purchases for a studio
  async getByStudioId(studioId: string): Promise<ClientPurchase[]> {
    const { data, error } = await supabase
      .from('client_purchases')
      .select('*')
      .eq('studio_id', studioId)
      .order('purchased_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  // Get active purchases for a client
  async getActiveByClientId(clientId: string): Promise<ClientPurchase[]> {
    const { data, error } = await supabase
      .from('client_purchases')
      .select('*')
      .eq('client_id', clientId)
      .eq('status', 'active')
      .order('expires_at', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  // Get active (non-expired) packs for a client with remaining credits
  async getActivePacks(clientId: string): Promise<ClientPurchase[]> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('client_purchases')
      .select('*, product:pricing_products(*)')
      .eq('client_id', clientId)
      .eq('status', 'active')
      .gt('credits_remaining', 0)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order('expires_at', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  // Get purchase by ID
  async getById(id: string): Promise<ClientPurchase | null> {
    const { data, error } = await supabase
      .from('client_purchases')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Get purchase with product details
  async getWithProduct(id: string): Promise<ClientPurchase | null> {
    const { data, error } = await supabase
      .from('client_purchases')
      .select('*, product:pricing_products(*)')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Create new purchase
  async create(purchase: ClientPurchaseInsert): Promise<ClientPurchase> {
    const purchaseWithDefaults: ClientPurchaseInsert = {
      ...purchase,
      status: purchase.status || 'active',
      purchased_at: purchase.purchased_at || new Date().toISOString(),
      metadata: purchase.metadata || {},
    };

    const { data, error } = await supabase
      .from('client_purchases')
      .insert(purchaseWithDefaults)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Update purchase
  async update(id: string, updates: ClientPurchaseUpdate): Promise<ClientPurchase> {
    const { data, error } = await supabase
      .from('client_purchases')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Use credits from a purchase
  async useCredits(id: string, credits: number): Promise<ClientPurchase> {
    const purchase = await this.getById(id);
    if (!purchase) throw new Error('Purchase not found');
    if (purchase.credits_remaining === null) throw new Error('Purchase does not have credits');
    if (purchase.credits_remaining < credits) throw new Error('Insufficient credits');

    const newRemaining = purchase.credits_remaining - credits;

    const { data, error } = await supabase
      .from('client_purchases')
      .update({
        credits_remaining: newRemaining,
        status: newRemaining <= 0 ? 'expired' : 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Cancel purchase
  async cancel(id: string): Promise<ClientPurchase> {
    const { data, error } = await supabase
      .from('client_purchases')
      .update({
        status: 'cancelled' as SubscriptionStatus,
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Get active subscriptions for a client (subscriptions are purchases with stripe_subscription_id)
  async getActiveSubscriptions(clientId: string): Promise<ClientPurchase[]> {
    const { data, error } = await supabase
      .from('client_purchases')
      .select('*')
      .eq('client_id', clientId)
      .eq('status', 'active')
      .not('stripe_subscription_id', 'is', null)
      .order('current_period_end', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  // Get all subscriptions for a client
  async getSubscriptionsByClientId(clientId: string): Promise<ClientPurchase[]> {
    const { data, error } = await supabase
      .from('client_purchases')
      .select('*')
      .eq('client_id', clientId)
      .not('stripe_subscription_id', 'is', null)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  // Get subscription by ID
  async getSubscriptionById(id: string): Promise<ClientPurchase | null> {
    const { data, error } = await supabase
      .from('client_purchases')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Create subscription
  async createSubscription(subscription: ClientPurchaseInsert): Promise<ClientPurchase> {
    return this.create({
      ...subscription,
      status: subscription.status || 'active',
    });
  },

  // Cancel subscription
  async cancelSubscription(id: string, immediate: boolean = false): Promise<ClientPurchase> {
    const updateData: ClientPurchaseUpdate = {
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (immediate) {
      updateData.status = 'cancelled';
    }

    const { data, error } = await supabase
      .from('client_purchases')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Pause subscription
  async pauseSubscription(id: string): Promise<ClientPurchase> {
    const { data, error } = await supabase
      .from('client_purchases')
      .update({
        status: 'paused' as SubscriptionStatus,
        pause_started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Resume subscription
  async resumeSubscription(id: string): Promise<ClientPurchase> {
    const { data, error } = await supabase
      .from('client_purchases')
      .update({
        status: 'active' as SubscriptionStatus,
        pause_started_at: null,
        pause_ends_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Get gift certificate by code
  async getGiftCertificateByCode(studioId: string, code: string): Promise<GiftCertificate | null> {
    const { data, error } = await supabase
      .from('client_purchases')
      .select('*')
      .eq('studio_id', studioId)
      .eq('gift_code', code)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data as GiftCertificate | null;
  },

  // Create gift certificate (a purchase with gift fields)
  async createGiftCertificate(certificate: GiftCertificateInsert): Promise<GiftCertificate> {
    const purchaseWithGift: ClientPurchaseInsert = {
      ...certificate,
      gift_code: certificate.gift_code || this.generateGiftCode(),
      gift_recipient_email: certificate.gift_recipient_email || null,
      gift_message: certificate.gift_message || null,
      status: 'active',
    };

    const { data, error } = await supabase
      .from('client_purchases')
      .insert(purchaseWithGift)
      .select()
      .single();
    if (error) throw error;
    return data as GiftCertificate;
  },

  // Redeem gift certificate
  async redeemGiftCertificate(
    studioId: string,
    code: string,
    clientId: string
  ): Promise<GiftCertificate> {
    const certificate = await this.getGiftCertificateByCode(studioId, code);
    if (!certificate) throw new Error('Gift certificate not found');
    if (certificate.gift_redeemed_at) throw new Error('Gift certificate already redeemed');
    if (certificate.expires_at && new Date(certificate.expires_at) < new Date()) {
      throw new Error('Gift certificate has expired');
    }

    const { data, error } = await supabase
      .from('client_purchases')
      .update({
        gift_redeemed_by: clientId,
        gift_redeemed_at: new Date().toISOString(),
        activated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', certificate.id)
      .select()
      .single();
    if (error) throw error;
    return data as GiftCertificate;
  },

  // Generate a random gift code
  generateGiftCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const randomValues = crypto.getRandomValues(new Uint32Array(12));
    let code = '';
    for (let i = 0; i < 12; i++) {
      if (i > 0 && i % 4 === 0) code += '-';
      code += chars.charAt(randomValues[i] % chars.length);
    }
    return code;
  },

  // Get gift certificates by studio
  async getGiftCertificatesByStudioId(studioId: string): Promise<GiftCertificate[]> {
    const { data, error } = await supabase
      .from('client_purchases')
      .select('*')
      .eq('studio_id', studioId)
      .not('gift_code', 'is', null)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as GiftCertificate[];
  },
};
