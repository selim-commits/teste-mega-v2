-- Rooom OS Core Database Schema
-- Migration 001: Core Tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- STUDIOS
-- ============================================

CREATE TABLE studios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'multi', -- 'photo', 'video', 'event', 'multi'
  color TEXT DEFAULT '#FF4400',
  hourly_rate DECIMAL(10,2) NOT NULL,
  half_day_rate DECIMAL(10,2),
  full_day_rate DECIMAL(10,2),
  capacity INTEGER,
  amenities TEXT[],
  description TEXT,
  photos TEXT[],
  status TEXT DEFAULT 'active', -- 'active', 'maintenance', 'inactive'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE studio_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID REFERENCES studios(id) ON DELETE CASCADE UNIQUE,
  legal_name TEXT,
  siret TEXT,
  vat_number TEXT,
  address JSONB,
  phone TEXT,
  email TEXT,
  website TEXT,
  social_links JSONB,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE studio_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  open_time TIME,
  close_time TIME,
  is_closed BOOLEAN DEFAULT false,
  UNIQUE (studio_id, day_of_week)
);

-- ============================================
-- CLIENTS
-- ============================================

CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT DEFAULT 'individual', -- 'individual', 'company'
  first_name TEXT,
  last_name TEXT,
  company_name TEXT,
  email TEXT,
  phone TEXT,
  address JSONB,
  photo_url TEXT,
  website TEXT,
  social_links JSONB,
  notes TEXT,
  source TEXT, -- 'website', 'referral', 'social', 'direct'
  referred_by UUID REFERENCES clients(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE client_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#666666',
  description TEXT
);

CREATE TABLE client_tag_assignments (
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES client_tags(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (client_id, tag_id)
);

CREATE TABLE client_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE UNIQUE,
  frequency_score INTEGER DEFAULT 0 CHECK (frequency_score >= 0 AND frequency_score <= 25),
  revenue_score INTEGER DEFAULT 0 CHECK (revenue_score >= 0 AND revenue_score <= 25),
  loyalty_score INTEGER DEFAULT 0 CHECK (loyalty_score >= 0 AND loyalty_score <= 25),
  payment_score INTEGER DEFAULT 0 CHECK (payment_score >= 0 AND payment_score <= 25),
  total_score INTEGER GENERATED ALWAYS AS (frequency_score + revenue_score + loyalty_score + payment_score) STORED,
  tier TEXT DEFAULT 'bronze', -- 'bronze', 'silver', 'gold', 'platinum'
  calculated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE client_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE UNIQUE,
  preferred_studio UUID REFERENCES studios(id),
  preferred_days INTEGER[],
  preferred_times TEXT[],
  equipment_notes TEXT,
  special_requests TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE client_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'contract', 'brief', 'moodboard', 'invoice', 'other'
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- BOOKINGS
-- ============================================

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'
  type TEXT, -- 'photo', 'video', 'event', 'other'
  title TEXT,
  notes TEXT,
  internal_notes TEXT,
  subtotal DECIMAL(10,2),
  discount DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2),
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_booking_times CHECK (end_at > start_at)
);

CREATE TABLE booking_extras (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  extra_type TEXT NOT NULL, -- 'equipment', 'service', 'staff'
  item_id UUID,
  description TEXT,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL
);

CREATE TABLE booking_recurrence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  pattern TEXT NOT NULL, -- 'daily', 'weekly', 'biweekly', 'monthly'
  days_of_week INTEGER[],
  until_date DATE NOT NULL,
  exceptions DATE[],
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE check_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'check_in', 'check_out'
  timestamp TIMESTAMPTZ DEFAULT now(),
  photo_urls TEXT[],
  condition_notes TEXT,
  recorded_by UUID
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_bookings_studio_date ON bookings(studio_id, start_at);
CREATE INDEX idx_bookings_client ON bookings(client_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_client_scores_tier ON client_scores(tier);

-- ============================================
-- TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_studios_updated_at
  BEFORE UPDATE ON studios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
