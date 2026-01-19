/**
 * Database types for Rooom OS
 * These types represent the Supabase database schema
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Enums
export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
export type PaymentMethod = 'card' | 'bank_transfer' | 'cash' | 'check' | 'other'
export type EquipmentStatus = 'available' | 'reserved' | 'in_use' | 'maintenance' | 'retired'
export type TeamRole = 'owner' | 'admin' | 'manager' | 'staff' | 'viewer'
export type ClientTier = 'standard' | 'premium' | 'vip'

// Premium Expansion Enums
export type PricingProductType = 'pack' | 'subscription' | 'gift_certificate'
export type BillingPeriod = 'once' | 'monthly' | 'quarterly' | 'yearly'
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'expired'
export type WalletTransactionType = 'credit' | 'debit' | 'expire' | 'refund' | 'adjustment'
export type ChatStatus = 'active' | 'waiting_human' | 'with_human' | 'resolved' | 'closed'
export type ChatSenderType = 'visitor' | 'ai' | 'human'
export type ChatContentType = 'text' | 'image' | 'file' | 'booking_card' | 'availability_card' | 'pack_card' | 'system'
export type WidgetType = 'booking' | 'chat' | 'packs'

export interface Database {
  public: {
    Tables: {
      studios: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          slug: string
          description: string | null
          logo_url: string | null
          cover_url: string | null
          address: string | null
          city: string | null
          country: string | null
          postal_code: string | null
          phone: string | null
          email: string | null
          website: string | null
          timezone: string
          currency: string
          tax_rate: number
          owner_id: string
          settings: Json
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          slug: string
          description?: string | null
          logo_url?: string | null
          cover_url?: string | null
          address?: string | null
          city?: string | null
          country?: string | null
          postal_code?: string | null
          phone?: string | null
          email?: string | null
          website?: string | null
          timezone?: string
          currency?: string
          tax_rate?: number
          owner_id: string
          settings?: Json
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          slug?: string
          description?: string | null
          logo_url?: string | null
          cover_url?: string | null
          address?: string | null
          city?: string | null
          country?: string | null
          postal_code?: string | null
          phone?: string | null
          email?: string | null
          website?: string | null
          timezone?: string
          currency?: string
          tax_rate?: number
          owner_id?: string
          settings?: Json
        }
        Relationships: []
      }
      spaces: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          studio_id: string
          name: string
          description: string | null
          capacity: number
          hourly_rate: number
          half_day_rate: number | null
          full_day_rate: number | null
          color: string
          is_active: boolean
          amenities: string[]
          images: string[]
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          studio_id: string
          name: string
          description?: string | null
          capacity?: number
          hourly_rate: number
          half_day_rate?: number | null
          full_day_rate?: number | null
          color?: string
          is_active?: boolean
          amenities?: string[]
          images?: string[]
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          studio_id?: string
          name?: string
          description?: string | null
          capacity?: number
          hourly_rate?: number
          half_day_rate?: number | null
          full_day_rate?: number | null
          color?: string
          is_active?: boolean
          amenities?: string[]
          images?: string[]
        }
        Relationships: []
      }
      clients: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          studio_id: string
          name: string
          email: string | null
          phone: string | null
          company: string | null
          address: string | null
          city: string | null
          country: string | null
          postal_code: string | null
          tax_id: string | null
          notes: string | null
          tier: ClientTier
          score: number
          tags: string[]
          avatar_url: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          studio_id: string
          name: string
          email?: string | null
          phone?: string | null
          company?: string | null
          address?: string | null
          city?: string | null
          country?: string | null
          postal_code?: string | null
          tax_id?: string | null
          notes?: string | null
          tier?: ClientTier
          score?: number
          tags?: string[]
          avatar_url?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          studio_id?: string
          name?: string
          email?: string | null
          phone?: string | null
          company?: string | null
          address?: string | null
          city?: string | null
          country?: string | null
          postal_code?: string | null
          tax_id?: string | null
          notes?: string | null
          tier?: ClientTier
          score?: number
          tags?: string[]
          avatar_url?: string | null
          is_active?: boolean
        }
        Relationships: []
      }
      bookings: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          studio_id: string
          space_id: string
          client_id: string
          title: string
          description: string | null
          start_time: string
          end_time: string
          status: BookingStatus
          total_amount: number
          paid_amount: number
          notes: string | null
          internal_notes: string | null
          is_recurring: boolean
          recurrence_rule: string | null
          parent_booking_id: string | null
          created_by: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          studio_id: string
          space_id: string
          client_id: string
          title: string
          description?: string | null
          start_time: string
          end_time: string
          status?: BookingStatus
          total_amount?: number
          paid_amount?: number
          notes?: string | null
          internal_notes?: string | null
          is_recurring?: boolean
          recurrence_rule?: string | null
          parent_booking_id?: string | null
          created_by: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          studio_id?: string
          space_id?: string
          client_id?: string
          title?: string
          description?: string | null
          start_time?: string
          end_time?: string
          status?: BookingStatus
          total_amount?: number
          paid_amount?: number
          notes?: string | null
          internal_notes?: string | null
          is_recurring?: boolean
          recurrence_rule?: string | null
          parent_booking_id?: string | null
          created_by?: string
        }
        Relationships: []
      }
      equipment: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          studio_id: string
          name: string
          description: string | null
          category: string
          brand: string | null
          model: string | null
          serial_number: string | null
          purchase_date: string | null
          purchase_price: number | null
          current_value: number | null
          hourly_rate: number | null
          daily_rate: number | null
          status: EquipmentStatus
          condition: number
          location: string | null
          qr_code: string | null
          image_url: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          studio_id: string
          name: string
          description?: string | null
          category: string
          brand?: string | null
          model?: string | null
          serial_number?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          current_value?: number | null
          hourly_rate?: number | null
          daily_rate?: number | null
          status?: EquipmentStatus
          condition?: number
          location?: string | null
          qr_code?: string | null
          image_url?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          studio_id?: string
          name?: string
          description?: string | null
          category?: string
          brand?: string | null
          model?: string | null
          serial_number?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          current_value?: number | null
          hourly_rate?: number | null
          daily_rate?: number | null
          status?: EquipmentStatus
          condition?: number
          location?: string | null
          qr_code?: string | null
          image_url?: string | null
          notes?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          studio_id: string
          client_id: string
          booking_id: string | null
          invoice_number: string
          status: InvoiceStatus
          issue_date: string
          due_date: string
          subtotal: number
          tax_amount: number
          discount_amount: number
          total_amount: number
          paid_amount: number
          notes: string | null
          terms: string | null
          pdf_url: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          studio_id: string
          client_id: string
          booking_id?: string | null
          invoice_number: string
          status?: InvoiceStatus
          issue_date: string
          due_date: string
          subtotal?: number
          tax_amount?: number
          discount_amount?: number
          total_amount?: number
          paid_amount?: number
          notes?: string | null
          terms?: string | null
          pdf_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          studio_id?: string
          client_id?: string
          booking_id?: string | null
          invoice_number?: string
          status?: InvoiceStatus
          issue_date?: string
          due_date?: string
          subtotal?: number
          tax_amount?: number
          discount_amount?: number
          total_amount?: number
          paid_amount?: number
          notes?: string | null
          terms?: string | null
          pdf_url?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          id: string
          created_at: string
          studio_id: string
          invoice_id: string
          amount: number
          method: PaymentMethod
          reference: string | null
          notes: string | null
          stripe_payment_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          studio_id: string
          invoice_id: string
          amount: number
          method: PaymentMethod
          reference?: string | null
          notes?: string | null
          stripe_payment_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          studio_id?: string
          invoice_id?: string
          amount?: number
          method?: PaymentMethod
          reference?: string | null
          notes?: string | null
          stripe_payment_id?: string | null
        }
        Relationships: []
      }
      team_members: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          studio_id: string
          user_id: string
          role: TeamRole
          name: string
          email: string
          phone: string | null
          avatar_url: string | null
          job_title: string | null
          hourly_rate: number | null
          is_active: boolean
          permissions: Json
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          studio_id: string
          user_id: string
          role?: TeamRole
          name: string
          email: string
          phone?: string | null
          avatar_url?: string | null
          job_title?: string | null
          hourly_rate?: number | null
          is_active?: boolean
          permissions?: Json
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          studio_id?: string
          user_id?: string
          role?: TeamRole
          name?: string
          email?: string
          phone?: string | null
          avatar_url?: string | null
          job_title?: string | null
          hourly_rate?: number | null
          is_active?: boolean
          permissions?: Json
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          studio_id: string
          user_id: string
          agent: string
          title: string | null
          messages: Json
          metadata: Json
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          studio_id: string
          user_id: string
          agent: string
          title?: string | null
          messages?: Json
          metadata?: Json
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          studio_id?: string
          user_id?: string
          agent?: string
          title?: string | null
          messages?: Json
          metadata?: Json
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          created_at: string
          studio_id: string
          user_id: string | null
          type: string
          title: string
          message: string
          data: Json
          is_read: boolean
          read_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          studio_id: string
          user_id?: string | null
          type: string
          title: string
          message: string
          data?: Json
          is_read?: boolean
          read_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          studio_id?: string
          user_id?: string | null
          type?: string
          title?: string
          message?: string
          data?: Json
          is_read?: boolean
          read_at?: string | null
        }
        Relationships: []
      }
      // Premium Expansion Tables
      pricing_products: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          studio_id: string
          name: string
          description: string | null
          type: PricingProductType
          price: number
          currency: string
          billing_period: BillingPeriod
          credits_included: number | null
          credits_type: string | null
          valid_days: number | null
          valid_spaces: string[] | null
          valid_time_slots: Json | null
          stripe_product_id: string | null
          stripe_price_id: string | null
          is_active: boolean
          is_featured: boolean
          display_order: number
          max_purchases_per_client: number | null
          terms_and_conditions: string | null
          metadata: Json
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          studio_id: string
          name: string
          description?: string | null
          type: PricingProductType
          price: number
          currency?: string
          billing_period?: BillingPeriod
          credits_included?: number | null
          credits_type?: string | null
          valid_days?: number | null
          valid_spaces?: string[] | null
          valid_time_slots?: Json | null
          stripe_product_id?: string | null
          stripe_price_id?: string | null
          is_active?: boolean
          is_featured?: boolean
          display_order?: number
          max_purchases_per_client?: number | null
          terms_and_conditions?: string | null
          metadata?: Json
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          studio_id?: string
          name?: string
          description?: string | null
          type?: PricingProductType
          price?: number
          currency?: string
          billing_period?: BillingPeriod
          credits_included?: number | null
          credits_type?: string | null
          valid_days?: number | null
          valid_spaces?: string[] | null
          valid_time_slots?: Json | null
          stripe_product_id?: string | null
          stripe_price_id?: string | null
          is_active?: boolean
          is_featured?: boolean
          display_order?: number
          max_purchases_per_client?: number | null
          terms_and_conditions?: string | null
          metadata?: Json
        }
        Relationships: []
      }
      client_wallets: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          studio_id: string
          client_id: string
          credits_balance: number
          credits_type: string
          total_credits_purchased: number
          total_credits_used: number
          total_credits_expired: number
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          studio_id: string
          client_id: string
          credits_balance?: number
          credits_type?: string
          total_credits_purchased?: number
          total_credits_used?: number
          total_credits_expired?: number
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          studio_id?: string
          client_id?: string
          credits_balance?: number
          credits_type?: string
          total_credits_purchased?: number
          total_credits_used?: number
          total_credits_expired?: number
        }
        Relationships: []
      }
      client_purchases: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          studio_id: string
          client_id: string
          product_id: string
          invoice_id: string | null
          status: SubscriptionStatus
          purchased_at: string
          activated_at: string | null
          expires_at: string | null
          cancelled_at: string | null
          pause_started_at: string | null
          pause_ends_at: string | null
          credits_remaining: number | null
          stripe_subscription_id: string | null
          current_period_start: string | null
          current_period_end: string | null
          gift_code: string | null
          gift_recipient_email: string | null
          gift_message: string | null
          gift_redeemed_at: string | null
          gift_redeemed_by: string | null
          metadata: Json
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          studio_id: string
          client_id: string
          product_id: string
          invoice_id?: string | null
          status?: SubscriptionStatus
          purchased_at?: string
          activated_at?: string | null
          expires_at?: string | null
          cancelled_at?: string | null
          pause_started_at?: string | null
          pause_ends_at?: string | null
          credits_remaining?: number | null
          stripe_subscription_id?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          gift_code?: string | null
          gift_recipient_email?: string | null
          gift_message?: string | null
          gift_redeemed_at?: string | null
          gift_redeemed_by?: string | null
          metadata?: Json
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          studio_id?: string
          client_id?: string
          product_id?: string
          invoice_id?: string | null
          status?: SubscriptionStatus
          purchased_at?: string
          activated_at?: string | null
          expires_at?: string | null
          cancelled_at?: string | null
          pause_started_at?: string | null
          pause_ends_at?: string | null
          credits_remaining?: number | null
          stripe_subscription_id?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          gift_code?: string | null
          gift_recipient_email?: string | null
          gift_message?: string | null
          gift_redeemed_at?: string | null
          gift_redeemed_by?: string | null
          metadata?: Json
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          id: string
          created_at: string
          studio_id: string
          client_id: string
          wallet_id: string
          purchase_id: string | null
          booking_id: string | null
          type: WalletTransactionType
          amount: number
          balance_before: number
          balance_after: number
          description: string | null
          expires_at: string | null
          created_by: string | null
          metadata: Json
        }
        Insert: {
          id?: string
          created_at?: string
          studio_id: string
          client_id: string
          wallet_id: string
          purchase_id?: string | null
          booking_id?: string | null
          type: WalletTransactionType
          amount: number
          balance_before: number
          balance_after: number
          description?: string | null
          expires_at?: string | null
          created_by?: string | null
          metadata?: Json
        }
        Update: {
          id?: string
          created_at?: string
          studio_id?: string
          client_id?: string
          wallet_id?: string
          purchase_id?: string | null
          booking_id?: string | null
          type?: WalletTransactionType
          amount?: number
          balance_before?: number
          balance_after?: number
          description?: string | null
          expires_at?: string | null
          created_by?: string | null
          metadata?: Json
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          studio_id: string
          client_id: string | null
          visitor_id: string
          visitor_name: string | null
          visitor_email: string | null
          visitor_phone: string | null
          status: ChatStatus
          assigned_to: string | null
          last_message_at: string | null
          last_message_preview: string | null
          unread_count: number
          ai_context: Json
          tags: string[]
          rating: number | null
          rating_feedback: string | null
          resolved_at: string | null
          resolved_by: string | null
          metadata: Json
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          studio_id: string
          client_id?: string | null
          visitor_id: string
          visitor_name?: string | null
          visitor_email?: string | null
          visitor_phone?: string | null
          status?: ChatStatus
          assigned_to?: string | null
          last_message_at?: string | null
          last_message_preview?: string | null
          unread_count?: number
          ai_context?: Json
          tags?: string[]
          rating?: number | null
          rating_feedback?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          metadata?: Json
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          studio_id?: string
          client_id?: string | null
          visitor_id?: string
          visitor_name?: string | null
          visitor_email?: string | null
          visitor_phone?: string | null
          status?: ChatStatus
          assigned_to?: string | null
          last_message_at?: string | null
          last_message_preview?: string | null
          unread_count?: number
          ai_context?: Json
          tags?: string[]
          rating?: number | null
          rating_feedback?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          metadata?: Json
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          id: string
          created_at: string
          conversation_id: string
          sender_type: ChatSenderType
          sender_id: string | null
          content_type: ChatContentType
          content: string
          content_data: Json | null
          is_internal: boolean
          read_at: string | null
          metadata: Json
        }
        Insert: {
          id?: string
          created_at?: string
          conversation_id: string
          sender_type: ChatSenderType
          sender_id?: string | null
          content_type?: ChatContentType
          content: string
          content_data?: Json | null
          is_internal?: boolean
          read_at?: string | null
          metadata?: Json
        }
        Update: {
          id?: string
          created_at?: string
          conversation_id?: string
          sender_type?: ChatSenderType
          sender_id?: string | null
          content_type?: ChatContentType
          content?: string
          content_data?: Json | null
          is_internal?: boolean
          read_at?: string | null
          metadata?: Json
        }
        Relationships: []
      }
      widget_configs: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          studio_id: string
          type: WidgetType
          name: string
          is_active: boolean
          allowed_domains: string[]
          theme: Json
          position: Json
          behavior: Json
          content: Json
          analytics_enabled: boolean
          embed_code: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          studio_id: string
          type: WidgetType
          name: string
          is_active?: boolean
          allowed_domains?: string[]
          theme?: Json
          position?: Json
          behavior?: Json
          content?: Json
          analytics_enabled?: boolean
          embed_code?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          studio_id?: string
          type?: WidgetType
          name?: string
          is_active?: boolean
          allowed_domains?: string[]
          theme?: Json
          position?: Json
          behavior?: Json
          content?: Json
          analytics_enabled?: boolean
          embed_code?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      booking_status: BookingStatus
      invoice_status: InvoiceStatus
      payment_method: PaymentMethod
      equipment_status: EquipmentStatus
      team_role: TeamRole
      client_tier: ClientTier
      // Premium Expansion Enums
      pricing_product_type: PricingProductType
      billing_period: BillingPeriod
      subscription_status: SubscriptionStatus
      wallet_transaction_type: WalletTransactionType
      chat_status: ChatStatus
      chat_sender_type: ChatSenderType
      chat_content_type: ChatContentType
      widget_type: WidgetType
    }
  }
}

// Utility types for easier usage
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Convenience types
export type Studio = Tables<'studios'>
export type Space = Tables<'spaces'>
export type Client = Tables<'clients'>
export type Booking = Tables<'bookings'>
export type Equipment = Tables<'equipment'>
export type Invoice = Tables<'invoices'>
export type Payment = Tables<'payments'>
export type TeamMember = Tables<'team_members'>
export type AIConversation = Tables<'ai_conversations'>
export type Notification = Tables<'notifications'>
// Premium Expansion Types
export type PricingProduct = Tables<'pricing_products'>
export type ClientWallet = Tables<'client_wallets'>
export type ClientPurchase = Tables<'client_purchases'>
export type WalletTransaction = Tables<'wallet_transactions'>
export type ChatConversation = Tables<'chat_conversations'>
export type ChatMessage = Tables<'chat_messages'>
export type WidgetConfig = Tables<'widget_configs'>

// Insert types
export type StudioInsert = InsertTables<'studios'>
export type SpaceInsert = InsertTables<'spaces'>
export type ClientInsert = InsertTables<'clients'>
export type BookingInsert = InsertTables<'bookings'>
export type EquipmentInsert = InsertTables<'equipment'>
export type InvoiceInsert = InsertTables<'invoices'>
export type PaymentInsert = InsertTables<'payments'>
export type TeamMemberInsert = InsertTables<'team_members'>
// Premium Expansion Insert Types
export type PricingProductInsert = InsertTables<'pricing_products'>
export type ClientWalletInsert = InsertTables<'client_wallets'>
export type ClientPurchaseInsert = InsertTables<'client_purchases'>
export type WalletTransactionInsert = InsertTables<'wallet_transactions'>
export type ChatConversationInsert = InsertTables<'chat_conversations'>
export type ChatMessageInsert = InsertTables<'chat_messages'>
export type WidgetConfigInsert = InsertTables<'widget_configs'>

// Update types
export type StudioUpdate = UpdateTables<'studios'>
export type SpaceUpdate = UpdateTables<'spaces'>
export type ClientUpdate = UpdateTables<'clients'>
export type BookingUpdate = UpdateTables<'bookings'>
export type EquipmentUpdate = UpdateTables<'equipment'>
export type InvoiceUpdate = UpdateTables<'invoices'>
export type PaymentUpdate = UpdateTables<'payments'>
export type TeamMemberUpdate = UpdateTables<'team_members'>
// Premium Expansion Update Types
export type PricingProductUpdate = UpdateTables<'pricing_products'>
export type ClientWalletUpdate = UpdateTables<'client_wallets'>
export type ClientPurchaseUpdate = UpdateTables<'client_purchases'>
export type WalletTransactionUpdate = UpdateTables<'wallet_transactions'>
export type ChatConversationUpdate = UpdateTables<'chat_conversations'>
export type ChatMessageUpdate = UpdateTables<'chat_messages'>
export type WidgetConfigUpdate = UpdateTables<'widget_configs'>

// Pack aliases for cleaner naming
export type Pack = PricingProduct
export type PackInsert = PricingProductInsert
export type PackUpdate = PricingProductUpdate

// Extended types with relations for UI
export interface PackWithStats extends PricingProduct {
  sales_count?: number
  active_subscriptions?: number
  total_revenue?: number
}

export interface ClientPurchaseWithRelations extends ClientPurchase {
  client?: Client
  product?: PricingProduct
}
