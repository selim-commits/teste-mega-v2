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

// Insert types
export type StudioInsert = InsertTables<'studios'>
export type SpaceInsert = InsertTables<'spaces'>
export type ClientInsert = InsertTables<'clients'>
export type BookingInsert = InsertTables<'bookings'>
export type EquipmentInsert = InsertTables<'equipment'>
export type InvoiceInsert = InsertTables<'invoices'>
export type PaymentInsert = InsertTables<'payments'>
export type TeamMemberInsert = InsertTables<'team_members'>

// Update types
export type StudioUpdate = UpdateTables<'studios'>
export type SpaceUpdate = UpdateTables<'spaces'>
export type ClientUpdate = UpdateTables<'clients'>
export type BookingUpdate = UpdateTables<'bookings'>
export type EquipmentUpdate = UpdateTables<'equipment'>
export type InvoiceUpdate = UpdateTables<'invoices'>
export type PaymentUpdate = UpdateTables<'payments'>
export type TeamMemberUpdate = UpdateTables<'team_members'>
