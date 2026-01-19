-- Rooom OS Database Schema
-- Execute this in Supabase SQL Editor: https://supabase.com/dashboard/project/vozgxzaphaixylivdpwt/sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types (enums)
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled');
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');
CREATE TYPE payment_method AS ENUM ('card', 'bank_transfer', 'cash', 'check', 'other');
CREATE TYPE equipment_status AS ENUM ('available', 'reserved', 'in_use', 'maintenance', 'retired');
CREATE TYPE team_role AS ENUM ('owner', 'admin', 'manager', 'staff', 'viewer');
CREATE TYPE client_tier AS ENUM ('standard', 'premium', 'vip');

-- Studios table
CREATE TABLE studios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  cover_url TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  postal_code TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  timezone TEXT DEFAULT 'Europe/Paris',
  currency TEXT DEFAULT 'EUR',
  tax_rate DECIMAL(5,2) DEFAULT 20.00,
  owner_id UUID NOT NULL,
  settings JSONB DEFAULT '{
    "booking_lead_time_hours": 24,
    "booking_max_advance_days": 90,
    "cancellation_policy_hours": 48,
    "require_deposit": true,
    "deposit_percentage": 30
  }'::jsonb
);

-- Spaces table
CREATE TABLE spaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  capacity INTEGER DEFAULT 10,
  hourly_rate DECIMAL(10,2) NOT NULL,
  half_day_rate DECIMAL(10,2),
  full_day_rate DECIMAL(10,2),
  color TEXT DEFAULT '#3b82f6',
  is_active BOOLEAN DEFAULT true,
  amenities TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}'
);

-- Clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  postal_code TEXT,
  tax_id TEXT,
  notes TEXT,
  tier client_tier DEFAULT 'standard',
  score INTEGER DEFAULT 50,
  tags TEXT[] DEFAULT '{}',
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true
);

-- Bookings table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status booking_status DEFAULT 'pending',
  total_amount DECIMAL(10,2) DEFAULT 0,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  internal_notes TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT,
  parent_booking_id UUID REFERENCES bookings(id),
  created_by UUID NOT NULL
);

-- Equipment table
CREATE TABLE equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  purchase_date DATE,
  purchase_price DECIMAL(10,2),
  current_value DECIMAL(10,2),
  hourly_rate DECIMAL(10,2),
  daily_rate DECIMAL(10,2),
  status equipment_status DEFAULT 'available',
  condition INTEGER DEFAULT 100,
  location TEXT,
  qr_code TEXT,
  image_url TEXT,
  notes TEXT
);

-- Invoices table
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id),
  invoice_number TEXT NOT NULL,
  status invoice_status DEFAULT 'draft',
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  subtotal DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) DEFAULT 0,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  terms TEXT,
  pdf_url TEXT
);

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  method payment_method NOT NULL,
  reference TEXT,
  notes TEXT,
  stripe_payment_id TEXT
);

-- Team members table
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role team_role DEFAULT 'staff',
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  job_title TEXT,
  hourly_rate DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  permissions JSONB DEFAULT '{}'::jsonb
);

-- AI Conversations table
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  agent TEXT NOT NULL,
  title TEXT,
  messages JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  user_id UUID,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ
);

-- Create indexes for better performance
CREATE INDEX idx_spaces_studio ON spaces(studio_id);
CREATE INDEX idx_clients_studio ON clients(studio_id);
CREATE INDEX idx_bookings_studio ON bookings(studio_id);
CREATE INDEX idx_bookings_space ON bookings(space_id);
CREATE INDEX idx_bookings_client ON bookings(client_id);
CREATE INDEX idx_bookings_dates ON bookings(start_time, end_time);
CREATE INDEX idx_equipment_studio ON equipment(studio_id);
CREATE INDEX idx_invoices_studio ON invoices(studio_id);
CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_payments_studio ON payments(studio_id);
CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_team_members_studio ON team_members(studio_id);
CREATE INDEX idx_notifications_studio ON notifications(studio_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_studios_updated_at BEFORE UPDATE ON studios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_spaces_updated_at BEFORE UPDATE ON spaces FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON equipment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_conversations_updated_at BEFORE UPDATE ON ai_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all for now - customize based on auth requirements)
-- Studios: Allow all authenticated users
CREATE POLICY "Allow all for studios" ON studios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for spaces" ON spaces FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for clients" ON clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for bookings" ON bookings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for equipment" ON equipment FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for invoices" ON invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for payments" ON payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for team_members" ON team_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for ai_conversations" ON ai_conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);

-- Insert demo data
INSERT INTO studios (id, name, slug, description, owner_id, email, phone, address, city, country) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Studio Lumière', 'studio-lumiere', 'Studio photo et vidéo professionnel à Paris', '00000000-0000-0000-0000-000000000000', 'contact@studio-lumiere.fr', '+33 1 23 45 67 89', '123 Rue de la Photo', 'Paris', 'France');

INSERT INTO spaces (studio_id, name, description, capacity, hourly_rate, half_day_rate, full_day_rate, color, amenities) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Studio A - Cyclorama', 'Grand studio avec cyclorama blanc de 6m', 15, 85.00, 320.00, 580.00, '#3b82f6', ARRAY['Cyclorama blanc', 'Éclairage LED', 'Wifi', 'Climatisation']),
  ('11111111-1111-1111-1111-111111111111', 'Studio B - Vidéo', 'Studio polyvalent pour tournages vidéo', 10, 95.00, 360.00, 650.00, '#10b981', ARRAY['Green screen', 'Audio pro', 'Teleprompter', 'Loges']),
  ('11111111-1111-1111-1111-111111111111', 'Salle de réunion', 'Espace créatif pour meetings', 8, 45.00, 160.00, 280.00, '#f59e0b', ARRAY['Écran 4K', 'Visioconférence', 'Whiteboard', 'Café']);

INSERT INTO clients (studio_id, name, email, phone, company, tier, score) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Marie Dupont', 'marie@example.com', '+33 6 12 34 56 78', 'Studio Creative', 'premium', 85),
  ('11111111-1111-1111-1111-111111111111', 'Jean Martin', 'jean@example.com', '+33 6 98 76 54 32', 'Agence Photo', 'vip', 95),
  ('11111111-1111-1111-1111-111111111111', 'Sophie Bernard', 'sophie@example.com', '+33 6 11 22 33 44', NULL, 'standard', 60);

INSERT INTO equipment (studio_id, name, category, brand, model, status, hourly_rate) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Canon EOS R5', 'Appareil photo', 'Canon', 'EOS R5', 'available', 25.00),
  ('11111111-1111-1111-1111-111111111111', 'Sony A7 IV', 'Appareil photo', 'Sony', 'A7 IV', 'available', 20.00),
  ('11111111-1111-1111-1111-111111111111', 'Godox AD600', 'Éclairage', 'Godox', 'AD600 Pro', 'available', 15.00),
  ('11111111-1111-1111-1111-111111111111', 'Aputure 600d', 'Éclairage', 'Aputure', 'LS 600d Pro', 'available', 30.00);

RAISE NOTICE 'Database schema created successfully!';
