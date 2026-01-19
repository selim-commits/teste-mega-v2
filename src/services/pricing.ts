import { supabase } from '../lib/supabase';
import type {
  PricingProduct,
  PricingProductInsert,
  PricingProductUpdate,
  PricingProductType,
  BillingPeriod,
} from '../types/database';

// Re-export types for external use
export type {
  PricingProduct,
  PricingProductInsert,
  PricingProductUpdate,
  PricingProductType,
  BillingPeriod,
};

// Aliases for backwards compatibility
export type PricingType = PricingProductType;
export type BillingInterval = BillingPeriod;

export const pricingService = {
  // Get all pricing products for a studio
  async getByStudioId(studioId: string): Promise<PricingProduct[]> {
    const { data, error } = await supabase
      .from('pricing_products')
      .select('*')
      .eq('studio_id', studioId)
      .order('display_order', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  // Get active pricing products for a studio
  async getActiveByStudioId(studioId: string): Promise<PricingProduct[]> {
    const { data, error } = await supabase
      .from('pricing_products')
      .select('*')
      .eq('studio_id', studioId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  // Get pricing products by type
  async getByType(studioId: string, type: PricingProductType): Promise<PricingProduct[]> {
    const { data, error } = await supabase
      .from('pricing_products')
      .select('*')
      .eq('studio_id', studioId)
      .eq('type', type)
      .order('display_order', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  // Get single pricing product by ID
  async getById(id: string): Promise<PricingProduct | null> {
    const { data, error } = await supabase
      .from('pricing_products')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Create new pricing product
  async create(product: PricingProductInsert): Promise<PricingProduct> {
    const productWithDefaults: PricingProductInsert = {
      ...product,
      currency: product.currency || 'USD',
      billing_period: product.billing_period || 'once',
      is_active: product.is_active ?? true,
      is_featured: product.is_featured ?? false,
      display_order: product.display_order || 0,
      metadata: product.metadata || {},
    };

    const { data, error } = await supabase
      .from('pricing_products')
      .insert(productWithDefaults)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Update pricing product
  async update(id: string, updates: PricingProductUpdate): Promise<PricingProduct> {
    const { data, error } = await supabase
      .from('pricing_products')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Delete pricing product
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('pricing_products')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Toggle active status
  async toggleActive(id: string): Promise<PricingProduct> {
    const current = await this.getById(id);
    if (!current) throw new Error('Pricing product not found');

    const { data, error } = await supabase
      .from('pricing_products')
      .update({ is_active: !current.is_active, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Update sort order
  async updateSortOrder(id: string, displayOrder: number): Promise<PricingProduct> {
    const { data, error } = await supabase
      .from('pricing_products')
      .update({ display_order: displayOrder, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Bulk update sort order
  async bulkUpdateSortOrder(updates: { id: string; display_order: number }[]): Promise<void> {
    const promises = updates.map(({ id, display_order }) =>
      supabase
        .from('pricing_products')
        .update({ display_order, updated_at: new Date().toISOString() })
        .eq('id', id)
    );
    await Promise.all(promises);
  },

  // Get featured products
  async getFeatured(studioId: string): Promise<PricingProduct[]> {
    const { data, error } = await supabase
      .from('pricing_products')
      .select('*')
      .eq('studio_id', studioId)
      .eq('is_active', true)
      .eq('is_featured', true)
      .order('display_order', { ascending: true });
    if (error) throw error;
    return data || [];
  },
};
