import { supabase } from '../lib/supabase';
import type {
  Pack,
  PackInsert,
  PackUpdate,
  ClientPurchase,
  ClientPurchaseInsert,
  ClientPurchaseUpdate,
  PricingProductType,
  SubscriptionStatus
} from '../types/database';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export interface PackFilters {
  studioId?: string;
  type?: PricingProductType;
  isActive?: boolean;
}

export interface ClientPurchaseFilters {
  studioId?: string;
  clientId?: string;
  packId?: string;
  status?: SubscriptionStatus;
}

export const packService = {
  // Pack/Pricing Product CRUD
  async getAll(filters?: PackFilters): Promise<Pack[]> {
    let query = db.from('pricing_products').select('*');

    if (filters?.studioId) {
      query = query.eq('studio_id', filters.studioId);
    }
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }

    const { data, error } = await query.order('display_order', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Pack | null> {
    const { data, error } = await db
      .from('pricing_products')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Pack;
  },

  async create(pack: PackInsert): Promise<Pack> {
    const { data, error } = await db
      .from('pricing_products')
      .insert(pack)
      .select()
      .single();
    if (error) throw error;
    return data as Pack;
  },

  async update(id: string, pack: PackUpdate): Promise<Pack> {
    const { data, error } = await db
      .from('pricing_products')
      .update({ ...pack, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Pack;
  },

  async delete(id: string): Promise<void> {
    const { error } = await db.from('pricing_products').delete().eq('id', id);
    if (error) throw error;
  },

  async getByStudioId(studioId: string): Promise<Pack[]> {
    const { data, error } = await db
      .from('pricing_products')
      .select('*')
      .eq('studio_id', studioId)
      .order('display_order', { ascending: true });
    if (error) throw error;
    return (data as Pack[]) || [];
  },

  async getActiveByStudioId(studioId: string): Promise<Pack[]> {
    const { data, error } = await db
      .from('pricing_products')
      .select('*')
      .eq('studio_id', studioId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    if (error) throw error;
    return (data as Pack[]) || [];
  },

  async getByType(studioId: string, type: PricingProductType): Promise<Pack[]> {
    const { data, error } = await db
      .from('pricing_products')
      .select('*')
      .eq('studio_id', studioId)
      .eq('type', type)
      .order('display_order', { ascending: true });
    if (error) throw error;
    return (data as Pack[]) || [];
  },

  async toggleActive(id: string, isActive: boolean): Promise<Pack> {
    const { data, error } = await db
      .from('pricing_products')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Pack;
  },

  async toggleFeatured(id: string, isFeatured: boolean): Promise<Pack> {
    const { data, error } = await db
      .from('pricing_products')
      .update({ is_featured: isFeatured, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Pack;
  },

  async updateDisplayOrder(id: string, displayOrder: number): Promise<Pack> {
    const { data, error } = await db
      .from('pricing_products')
      .update({ display_order: displayOrder, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Pack;
  },
};

export const clientPurchaseService = {
  // Client Purchase/Subscription CRUD
  async getAll(filters?: ClientPurchaseFilters): Promise<ClientPurchase[]> {
    let query = db.from('client_purchases').select(`
      *,
      client:clients(*),
      product:pricing_products(*)
    `);

    if (filters?.studioId) {
      query = query.eq('studio_id', filters.studioId);
    }
    if (filters?.clientId) {
      query = query.eq('client_id', filters.clientId);
    }
    if (filters?.packId) {
      query = query.eq('product_id', filters.packId);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query.order('purchased_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<ClientPurchase | null> {
    const { data, error } = await db
      .from('client_purchases')
      .select(`
        *,
        client:clients(*),
        product:pricing_products(*)
      `)
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as ClientPurchase;
  },

  async create(purchase: ClientPurchaseInsert): Promise<ClientPurchase> {
    const { data, error } = await db
      .from('client_purchases')
      .insert(purchase)
      .select()
      .single();
    if (error) throw error;
    return data as ClientPurchase;
  },

  async update(id: string, purchase: ClientPurchaseUpdate): Promise<ClientPurchase> {
    const { data, error } = await db
      .from('client_purchases')
      .update({ ...purchase, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as ClientPurchase;
  },

  async getByClientId(clientId: string): Promise<ClientPurchase[]> {
    const { data, error } = await db
      .from('client_purchases')
      .select(`
        *,
        product:pricing_products(*)
      `)
      .eq('client_id', clientId)
      .order('purchased_at', { ascending: false });
    if (error) throw error;
    return (data as ClientPurchase[]) || [];
  },

  async getActiveByClientId(clientId: string): Promise<ClientPurchase[]> {
    const { data, error } = await db
      .from('client_purchases')
      .select(`
        *,
        product:pricing_products(*)
      `)
      .eq('client_id', clientId)
      .eq('status', 'active')
      .order('purchased_at', { ascending: false });
    if (error) throw error;
    return (data as ClientPurchase[]) || [];
  },

  async updateStatus(id: string, status: SubscriptionStatus): Promise<ClientPurchase> {
    const updates: ClientPurchaseUpdate = {
      status,
      ...(status === 'cancelled' && { cancelled_at: new Date().toISOString() }),
    };

    const { data, error } = await db
      .from('client_purchases')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as ClientPurchase;
  },

  async pauseSubscription(id: string, pauseEndsAt?: string): Promise<ClientPurchase> {
    const { data, error } = await db
      .from('client_purchases')
      .update({
        status: 'paused',
        pause_started_at: new Date().toISOString(),
        pause_ends_at: pauseEndsAt || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as ClientPurchase;
  },

  async resumeSubscription(id: string): Promise<ClientPurchase> {
    const { data, error } = await db
      .from('client_purchases')
      .update({
        status: 'active',
        pause_started_at: null,
        pause_ends_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as ClientPurchase;
  },

  async getByStudioId(studioId: string): Promise<ClientPurchase[]> {
    const { data, error } = await db
      .from('client_purchases')
      .select(`
        *,
        client:clients(*),
        product:pricing_products(*)
      `)
      .eq('studio_id', studioId)
      .order('purchased_at', { ascending: false });
    if (error) throw error;
    return (data as ClientPurchase[]) || [];
  },

  async getActiveSubscriptions(studioId: string): Promise<ClientPurchase[]> {
    const { data, error } = await db
      .from('client_purchases')
      .select(`
        *,
        client:clients(*),
        product:pricing_products(*)
      `)
      .eq('studio_id', studioId)
      .eq('status', 'active')
      .order('current_period_end', { ascending: true });
    if (error) throw error;
    return (data as ClientPurchase[]) || [];
  },
};

export const packStatsService = {
  async getPackStats(studioId: string) {
    // Get all packs for the studio
    const packs = await packService.getByStudioId(studioId);

    // Get all purchases for the studio
    const purchases = await clientPurchaseService.getByStudioId(studioId);

    // Calculate stats
    const totalSold = purchases.length;
    const activeSubscriptions = purchases.filter(p => p.status === 'active').length;
    const totalRevenue = purchases.reduce((sum, p) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const product = (p as any).product as Pack | undefined;
      return sum + (product?.price || 0);
    }, 0);

    // Calculate this month's revenue
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyRevenue = purchases
      .filter(p => new Date(p.purchased_at) >= startOfMonth)
      .reduce((sum, p) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const product = (p as any).product as Pack | undefined;
        return sum + (product?.price || 0);
      }, 0);

    return {
      totalPacks: packs.length,
      activePacks: packs.filter(p => p.is_active).length,
      totalSold,
      activeSubscriptions,
      totalRevenue,
      monthlyRevenue,
    };
  },
};
