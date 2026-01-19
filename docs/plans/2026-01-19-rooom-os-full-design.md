# Rooom OS - Full System Design

**Date**: 2026-01-19
**Version**: 2.0
**Status**: Approved for Implementation

---

## Executive Summary

Rooom OS is a comprehensive studio management platform designed for photo/video studios. This document outlines the complete feature set across 8 modules, database architecture, and implementation roadmap.

### Tech Stack
- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: CSS Modules + Framer Motion
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime, Edge Functions)
- **Payments**: Stripe
- **AI**: Claude API for 4 intelligent agents

---

## Module 1: Dashboard

### Purpose
Central command center providing real-time overview of all studio activity.

### Features

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| D1 | Customizable Widgets | Drag & drop to reorganize, resize, hide widgets | P1 |
| D2 | Real-time KPIs | Revenue, bookings, occupation - Supabase Realtime | P1 |
| D3 | Monthly Goals | Set targets with progress bars | P2 |
| D4 | Notification Center | Bell icon dropdown - stock, payments, maintenance alerts | P1 |
| D5 | Today's Agenda | Visual timeline of bookings with live status | P1 |
| D6 | AI Insights Widget | YODA displays 3 priority recommendations | P2 |
| D7 | Business Weather | Visual indicator: Green/Yellow/Red | P3 |
| D8 | Quick Actions | Buttons: New booking, New client, Create quote | P1 |

### Database Tables

```sql
-- Widget configuration per user
CREATE TABLE dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  widget_type TEXT NOT NULL,
  position JSONB NOT NULL DEFAULT '{"x": 0, "y": 0}',
  size JSONB NOT NULL DEFAULT '{"w": 1, "h": 1}',
  config JSONB DEFAULT '{}',
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Notification system
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'stock', 'payment', 'maintenance', 'booking', 'system'
  title TEXT NOT NULL,
  message TEXT,
  action_url TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Goal tracking
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
  metric TEXT NOT NULL, -- 'revenue', 'bookings', 'new_clients', 'occupation'
  target DECIMAL NOT NULL,
  current DECIMAL DEFAULT 0,
  period TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'yearly'
  period_start DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Components
- `DraggableWidget` - Repositionable container with react-dnd
- `NotificationCenter` - Dropdown with notification list
- `GoalProgress` - Progress bar with target display
- `QuickActionBar` - Action buttons row
- `KPICard` - Real-time metric display
- `AgendaTimeline` - Today's bookings timeline

---

## Module 2: Space Control

### Purpose
Advanced booking and space management with automations.

### Features

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| S1 | Multi-view Calendar | Day / Week / Month + filterable list view | P1 |
| S2 | Recurring Bookings | Create series (e.g., every Tuesday 9-12 for 3 months) | P2 |
| S3 | Conflict Detection | Visual alert on overlap, suggest alternatives | P1 |
| S4 | Auto Contracts | PDF template generated at booking, e-signature | P2 |
| S5 | Check-in/out | QR code scan, auto timestamp, condition photos | P2 |
| S6 | Extras & Options | Add equipment, assistant, catering to booking | P1 |
| S7 | Color by Type | Photo=Orange, Video=Blue, Event=Purple, customizable | P3 |
| S8 | Drag & Resize | Move/resize bookings directly on calendar | P1 |
| S9 | Public Availability | Shareable page for clients (read-only or booking) | P3 |
| S10 | Maintenance Block | Mark studio unavailable with reason | P2 |

### Database Tables

```sql
-- Studio spaces
CREATE TABLE studios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'photo', 'video', 'event', 'multi'
  color TEXT DEFAULT '#FF4400',
  hourly_rate DECIMAL NOT NULL,
  half_day_rate DECIMAL,
  full_day_rate DECIMAL,
  capacity INTEGER,
  amenities TEXT[],
  description TEXT,
  photos TEXT[],
  status TEXT DEFAULT 'active', -- 'active', 'maintenance', 'inactive'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Bookings
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'
  type TEXT, -- 'photo', 'video', 'event', 'other'
  title TEXT,
  notes TEXT,
  internal_notes TEXT,
  subtotal DECIMAL,
  discount DECIMAL DEFAULT 0,
  tax DECIMAL DEFAULT 0,
  total DECIMAL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Recurring booking patterns
CREATE TABLE booking_recurrence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  pattern TEXT NOT NULL, -- 'daily', 'weekly', 'biweekly', 'monthly'
  days_of_week INTEGER[], -- 0-6 for weekly patterns
  until_date DATE NOT NULL,
  exceptions DATE[], -- Dates to skip
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Extras added to bookings
CREATE TABLE booking_extras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  extra_type TEXT NOT NULL, -- 'equipment', 'service', 'staff'
  item_id UUID, -- Reference to equipment or service
  description TEXT,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL NOT NULL,
  total DECIMAL NOT NULL
);

-- Contracts
CREATE TABLE booking_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  template_id UUID,
  pdf_url TEXT,
  signed_at TIMESTAMPTZ,
  signature_url TEXT,
  signer_name TEXT,
  signer_email TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Check-in/out logs
CREATE TABLE check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'check_in', 'check_out'
  timestamp TIMESTAMPTZ DEFAULT now(),
  photo_urls TEXT[],
  condition_notes TEXT,
  recorded_by UUID REFERENCES auth.users(id)
);
```

### Components
- `CalendarView` - Multi-mode calendar (day/week/month)
- `BookingModal` - Create/edit booking form
- `RecurrenceEditor` - Pattern picker for recurring bookings
- `ConflictAlert` - Conflict resolution modal
- `CheckInScanner` - QR code scanning interface
- `ContractPreview` - PDF viewer with signature pad
- `BookingCard` - Draggable booking block

---

## Module 3: Inventory

### Purpose
Complete equipment tracking with traceability and preventive maintenance.

### Features

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| I1 | Complete Equipment Card | Photos, specs, purchase price, current value, PDF manuals | P1 |
| I2 | Unique QR Codes | Generate/print QR for each item, scan for quick access | P2 |
| I3 | Dynamic Status | Available / In Use / Reserved / Maintenance / Out of Service | P1 |
| I4 | Loan System | Assign equipment to booking, complete history | P1 |
| I5 | Predefined Kits | Group items (e.g., "Portrait Kit" = camera + 2 flashes + backdrop) | P2 |
| I6 | Scheduled Maintenance | Revision calendar, alerts before deadline, intervention history | P2 |
| I7 | Stock Alerts | Min thresholds for consumables, auto notification | P1 |
| I8 | Insurance & Warranty | Expiration dates, attached documents, renewal reminders | P3 |
| I9 | Auto Depreciation | Residual value calculation (straight-line method) | P3 |
| I10 | CSV Import/Export | Bulk import, export for accounting | P2 |
| I11 | Complete History | Timeline of all movements per equipment | P1 |

### Database Tables

```sql
-- Equipment categories
CREATE TABLE equipment_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT DEFAULT '#666666',
  parent_id UUID REFERENCES equipment_categories(id)
);

-- Main equipment table
CREATE TABLE equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category_id UUID REFERENCES equipment_categories(id),
  serial_number TEXT,
  barcode TEXT,
  qr_code TEXT,
  brand TEXT,
  model TEXT,
  description TEXT,
  specs JSONB,
  purchase_date DATE,
  purchase_price DECIMAL,
  current_value DECIMAL,
  depreciation_rate DECIMAL DEFAULT 0.2,
  status TEXT DEFAULT 'available', -- 'available', 'in_use', 'reserved', 'maintenance', 'out_of_service'
  location TEXT,
  photos TEXT[],
  manual_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Equipment kits
CREATE TABLE equipment_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE equipment_kit_items (
  kit_id UUID REFERENCES equipment_kits(id) ON DELETE CASCADE,
  equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  PRIMARY KEY (kit_id, equipment_id)
);

-- Equipment loans/assignments
CREATE TABLE equipment_loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  borrowed_by UUID REFERENCES auth.users(id),
  checked_out_at TIMESTAMPTZ NOT NULL,
  expected_return TIMESTAMPTZ,
  checked_in_at TIMESTAMPTZ,
  condition_out TEXT,
  condition_in TEXT,
  notes TEXT
);

-- Maintenance scheduling
CREATE TABLE maintenance_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'inspection', 'cleaning', 'calibration', 'repair'
  interval_days INTEGER NOT NULL,
  last_performed DATE,
  next_due DATE NOT NULL,
  estimated_cost DECIMAL,
  notes TEXT
);

-- Maintenance logs
CREATE TABLE maintenance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES maintenance_schedule(id),
  performed_date DATE NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  cost DECIMAL,
  technician TEXT,
  attachments TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Consumables
CREATE TABLE consumables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  sku TEXT,
  quantity INTEGER DEFAULT 0,
  min_threshold INTEGER DEFAULT 5,
  unit TEXT DEFAULT 'unit',
  unit_price DECIMAL,
  supplier TEXT,
  reorder_url TEXT,
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Components
- `EquipmentDetail` - Full equipment page with tabs
- `QRGenerator` - QR code generation and printing
- `KitBuilder` - Drag & drop kit creation
- `MaintenanceCalendar` - Maintenance schedule view
- `LoanTimeline` - Visual loan history
- `StockAlerts` - Critical threshold alerts widget
- `CSVImporter` - Import modal with column mapping
- `EquipmentGrid` - Grid/list view with filters

---

## Module 4: Clients (CRM)

### Purpose
Complete client vision with history, preferences, and centralized communication.

### Features

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| C1 | Enriched Profile | Photo, multiple contacts, social media, company, notes | P1 |
| C2 | Client Scoring | Auto score based on: frequency, revenue, seniority, payments | P2 |
| C3 | Tags & Segments | Custom labels (VIP, Photographer, Agency, etc.) | P1 |
| C4 | Complete History | Timeline: bookings, invoices, emails, calls, notes | P1 |
| C5 | Studio Preferences | Favorite studio, usual equipment, preferred slots | P2 |
| C6 | Integrated Communication | Send email/SMS from app, customizable templates | P2 |
| C7 | Client Documents | Signed contracts, briefs, moodboards, invoices - centralized | P1 |
| C8 | Birthdays & Reminders | Collaboration anniversary alerts, inactive client follow-up | P3 |
| C9 | Duplicate Merge | Detect and merge duplicate client records | P3 |
| C10 | Client Portal | Personal space: history, invoices, book online | P3 |
| C11 | Contact Import | Google Contacts sync, CSV/vCard import | P2 |

### Database Tables

```sql
-- Main clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT DEFAULT 'individual', -- 'individual', 'company'
  first_name TEXT,
  last_name TEXT,
  company_name TEXT,
  email TEXT,
  phone TEXT,
  address JSONB, -- {street, city, postal_code, country}
  photo_url TEXT,
  website TEXT,
  social_links JSONB, -- {instagram, linkedin, etc.}
  notes TEXT,
  source TEXT, -- 'website', 'referral', 'social', 'direct'
  referred_by UUID REFERENCES clients(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Additional contact methods
CREATE TABLE client_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'email', 'phone', 'mobile', 'fax'
  value TEXT NOT NULL,
  label TEXT, -- 'work', 'personal', 'assistant'
  is_primary BOOLEAN DEFAULT false
);

-- Tags for segmentation
CREATE TABLE client_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Automatic scoring
CREATE TABLE client_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE UNIQUE,
  frequency_score INTEGER DEFAULT 0, -- 0-25
  revenue_score INTEGER DEFAULT 0, -- 0-25
  loyalty_score INTEGER DEFAULT 0, -- 0-25
  payment_score INTEGER DEFAULT 0, -- 0-25
  total_score INTEGER DEFAULT 0, -- 0-100
  tier TEXT DEFAULT 'bronze', -- 'bronze', 'silver', 'gold', 'platinum'
  calculated_at TIMESTAMPTZ DEFAULT now()
);

-- Client preferences
CREATE TABLE client_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE UNIQUE,
  preferred_studio UUID REFERENCES studios(id),
  preferred_days INTEGER[], -- 0-6
  preferred_times TEXT[], -- 'morning', 'afternoon', 'evening'
  equipment_notes TEXT,
  special_requests TEXT,
  dietary_restrictions TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Client documents
CREATE TABLE client_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'contract', 'brief', 'moodboard', 'invoice', 'other'
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- Communication history
CREATE TABLE client_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  channel TEXT NOT NULL, -- 'email', 'sms', 'phone', 'meeting', 'note'
  direction TEXT NOT NULL, -- 'inbound', 'outbound'
  subject TEXT,
  content TEXT,
  attachments TEXT[],
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  status TEXT DEFAULT 'sent', -- 'draft', 'sent', 'delivered', 'read', 'failed'
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Communication templates
CREATE TABLE communication_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  channel TEXT NOT NULL, -- 'email', 'sms'
  subject TEXT,
  body TEXT NOT NULL,
  variables TEXT[], -- Available merge fields
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Reminders
CREATE TABLE client_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'birthday', 'anniversary', 'follow_up', 'custom'
  title TEXT NOT NULL,
  due_date DATE NOT NULL,
  recurring TEXT, -- 'yearly', 'monthly', null
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Components
- `ClientProfile` - Profile page with tabs (info, history, docs, comm)
- `ClientScoreBadge` - Visual score display with breakdown
- `TagManager` - Create/assign tags with colors
- `CommunicationCenter` - Compose email/SMS with templates
- `ClientTimeline` - Chronological history of all interactions
- `DuplicateMerger` - Comparison and merge interface
- `ClientPortalPreview` - Preview of client-facing portal
- `ContactImporter` - CSV/vCard import wizard

---

## Module 5: Finance

### Purpose
Complete financial management from quote to payment with business analytics.

### Features

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| F1 | Quote to Invoice Workflow | Create quote, convert to invoice in 1 click | P1 |
| F2 | Auto Numbering | Customizable format (INV-2024-001), auto sequence | P1 |
| F3 | Product Catalog | Service catalog with prices for quick add | P1 |
| F4 | Discounts & Taxes | Percentage or fixed amount, configurable VAT per line | P1 |
| F5 | Multiple Payments | Deposit + balance, partial payment, installments | P2 |
| F6 | Online Payment | Stripe integration, payment link in invoice | P2 |
| F7 | Auto Reminders | Auto email at D-7, D-3, D-Day, D+7 if unpaid | P2 |
| F8 | Credit Notes & Refunds | Generate credit note linked to invoice, track refund | P2 |
| F9 | Accounting Export | CSV/PDF for accountant, standard formats (FEC) | P2 |
| F10 | Financial Dashboard | Monthly/yearly revenue, Y-1 comparison, forecasts | P1 |
| F11 | Expenses | Enter charges, categorize, net margin | P2 |
| F12 | Custom Reports | Filter by period, client, studio, service type | P2 |

### Database Tables

```sql
-- Quotes
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number TEXT NOT NULL UNIQUE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id),
  status TEXT DEFAULT 'draft', -- 'draft', 'sent', 'accepted', 'rejected', 'expired', 'converted'
  valid_until DATE NOT NULL,
  subtotal DECIMAL NOT NULL DEFAULT 0,
  discount_type TEXT, -- 'percentage', 'fixed'
  discount_value DECIMAL DEFAULT 0,
  discount_amount DECIMAL DEFAULT 0,
  tax_amount DECIMAL DEFAULT 0,
  total DECIMAL NOT NULL DEFAULT 0,
  notes TEXT,
  terms TEXT,
  sent_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number TEXT NOT NULL UNIQUE,
  quote_id UUID REFERENCES quotes(id),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id),
  status TEXT DEFAULT 'draft', -- 'draft', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'cancelled'
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  subtotal DECIMAL NOT NULL DEFAULT 0,
  discount_type TEXT,
  discount_value DECIMAL DEFAULT 0,
  discount_amount DECIMAL DEFAULT 0,
  tax_amount DECIMAL DEFAULT 0,
  total DECIMAL NOT NULL DEFAULT 0,
  paid_amount DECIMAL DEFAULT 0,
  balance_due DECIMAL GENERATED ALWAYS AS (total - paid_amount) STORED,
  notes TEXT,
  terms TEXT,
  payment_instructions TEXT,
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  stripe_invoice_id TEXT,
  pdf_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Line items (shared between quotes and invoices)
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  description TEXT NOT NULL,
  quantity DECIMAL NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'unit',
  unit_price DECIMAL NOT NULL,
  discount_percent DECIMAL DEFAULT 0,
  tax_rate DECIMAL DEFAULT 20,
  subtotal DECIMAL NOT NULL,
  tax_amount DECIMAL NOT NULL,
  total DECIMAL NOT NULL,
  sort_order INTEGER DEFAULT 0,
  CHECK (invoice_id IS NOT NULL OR quote_id IS NOT NULL)
);

-- Product/service catalog
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  sku TEXT,
  unit_price DECIMAL NOT NULL,
  unit TEXT DEFAULT 'unit',
  tax_rate DECIMAL DEFAULT 20,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  amount DECIMAL NOT NULL,
  method TEXT NOT NULL, -- 'cash', 'card', 'transfer', 'check', 'stripe'
  reference TEXT,
  notes TEXT,
  paid_at TIMESTAMPTZ DEFAULT now(),
  stripe_payment_id TEXT,
  stripe_charge_id TEXT,
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Payment reminders
CREATE TABLE payment_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'before_due', 'on_due', 'after_due'
  days_offset INTEGER NOT NULL, -- -7, -3, 0, 7, 14, 30
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'cancelled'
  template_id UUID REFERENCES communication_templates(id)
);

-- Credit notes
CREATE TABLE credit_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number TEXT NOT NULL UNIQUE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  amount DECIMAL NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'issued', -- 'issued', 'applied', 'refunded'
  refunded_at TIMESTAMPTZ,
  refund_method TEXT,
  refund_reference TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Expenses
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES expense_categories(id),
  description TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  tax_amount DECIMAL DEFAULT 0,
  date DATE NOT NULL,
  supplier TEXT,
  reference TEXT,
  receipt_url TEXT,
  is_tax_deductible BOOLEAN DEFAULT true,
  payment_method TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Expense categories
CREATE TABLE expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT DEFAULT '#666666',
  budget_monthly DECIMAL,
  parent_id UUID REFERENCES expense_categories(id)
);

-- Financial snapshots for reporting
CREATE TABLE financial_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'yearly'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  revenue DECIMAL DEFAULT 0,
  expenses DECIMAL DEFAULT 0,
  profit DECIMAL DEFAULT 0,
  bookings_count INTEGER DEFAULT 0,
  new_clients_count INTEGER DEFAULT 0,
  metrics JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (period_type, period_start)
);
```

### Components
- `InvoiceBuilder` - Line-by-line invoice editor
- `QuoteToInvoice` - Conversion workflow with preview
- `ProductCatalog` - Service catalog management
- `PaymentTracker` - Payment tracking with visual status
- `StripeCheckout` - Online payment integration
- `ReminderScheduler` - Auto-reminder configuration
- `FinancialCharts` - Revenue, margin, comparison charts
- `ExpenseManager` - Expense entry and categorization
- `ReportGenerator` - Custom report export

---

## Module 6: AI Console

### Purpose
4 AI agents become real assistants with memory, actions, and learning.

### Agents

| Agent | Role | Capabilities |
|-------|------|--------------|
| **YODA** | Strategic Intelligence | Revenue predictions, pricing suggestions, trend detection, opportunity alerts |
| **NEXUS** | Automation | Custom workflows, auto triggers, external sync, scheduled tasks |
| **NOVA** | Creative Assistant | Brief generation, moodboard suggestions, visual trend analysis, copywriting |
| **SENTINEL** | Security & Compliance | Audit logs, anomaly alerts, auto backup, GDPR compliance, system health |

### Features

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| A1 | Persistent Conversations | History per agent, context preserved between sessions | P1 |
| A2 | Concrete Actions | Agent can create booking, send email, generate invoice | P2 |
| A3 | Proactive Suggestions | Push notifications when agent detects something | P2 |
| A4 | NEXUS Workflows | Visual builder: IF condition THEN action (no-code) | P2 |
| A5 | YODA Reports | Auto-generated weekly/monthly reports with insights | P2 |
| A6 | Voice Mode | Speech-to-text for talking to agents | P3 |
| A7 | Learning | Agents remember preferences and improve | P3 |
| A8 | SENTINEL Logs | Security dashboard, login attempts, suspicious activity | P1 |
| A9 | NEXUS Integrations | Connect Google Calendar, Slack, Zapier, webhooks | P3 |

### Database Tables

```sql
-- AI Conversations
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL, -- 'yoda', 'nexus', 'nova', 'sentinel'
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Conversation messages
CREATE TABLE ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'user', 'assistant', 'system'
  content TEXT NOT NULL,
  metadata JSONB, -- Actions taken, references, etc.
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Agent memory (learning)
CREATE TABLE ai_agent_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_type TEXT NOT NULL, -- 'preference', 'fact', 'pattern'
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  confidence DECIMAL DEFAULT 1.0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (agent_id, user_id, key)
);

-- NEXUS Workflows
CREATE TABLE ai_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  agent TEXT DEFAULT 'nexus',
  trigger_type TEXT NOT NULL, -- 'schedule', 'event', 'webhook', 'manual'
  trigger_config JSONB NOT NULL,
  conditions JSONB, -- Conditions to check before running
  actions JSONB NOT NULL, -- Array of actions to perform
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  run_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Workflow execution logs
CREATE TABLE ai_workflow_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES ai_workflows(id) ON DELETE CASCADE,
  status TEXT NOT NULL, -- 'started', 'success', 'failure', 'skipped'
  trigger_data JSONB,
  actions_executed JSONB,
  error_message TEXT,
  duration_ms INTEGER,
  executed_at TIMESTAMPTZ DEFAULT now()
);

-- Proactive suggestions
CREATE TABLE ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'insight', 'action', 'warning', 'opportunity'
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_type TEXT, -- Type of action if actionable
  action_data JSONB, -- Data needed to execute action
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'dismissed', 'expired'
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- External integrations
CREATE TABLE ai_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  provider TEXT NOT NULL, -- 'google', 'slack', 'zapier', 'custom'
  credentials JSONB, -- Encrypted OAuth tokens, API keys
  config JSONB,
  status TEXT DEFAULT 'disconnected', -- 'connected', 'disconnected', 'error'
  last_sync_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- SENTINEL Audit logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL, -- 'create', 'read', 'update', 'delete', 'login', 'logout'
  entity_type TEXT NOT NULL, -- 'booking', 'client', 'invoice', etc.
  entity_id UUID,
  changes JSONB, -- Before/after for updates
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Security alerts
CREATE TABLE security_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- 'failed_login', 'suspicious_activity', 'data_export', 'permission_change'
  severity TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
  title TEXT NOT NULL,
  message TEXT,
  metadata JSONB,
  user_id UUID REFERENCES auth.users(id),
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Components
- `AgentChat` - Conversation interface with scrollable history
- `AgentActionConfirm` - Confirmation modal before agent action
- `WorkflowBuilder` - Visual no-code drag & drop editor
- `SuggestionCard` - Suggestion card with Accept/Dismiss buttons
- `YodaReport` - Insights report template with charts
- `SentinelDashboard` - Real-time security monitoring
- `IntegrationManager` - External services OAuth connection
- `VoiceInput` - Microphone button with audio visualization

---

## Module 7: Team

### Purpose
Manage collaborators, schedules, roles, and performance.

### Features

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| T1 | Collaborator Profiles | Photo, contacts, skills, hourly rate, contract | P1 |
| T2 | Roles & Permissions | Admin, Manager, Operator, Freelance - granular access | P1 |
| T3 | Team Calendar | Availability and assignment calendar view | P1 |
| T4 | Booking Assignment | Assign technician/assistant to each booking | P1 |
| T5 | Time Tracking | Check-in/out, hours worked, auto calculation | P2 |
| T6 | Leave & Absences | Requests, manager approval, auto planning impact | P2 |
| T7 | Skills & Certifications | Training tracking, renewal alerts | P3 |
| T8 | Performance Dashboard | Hours, revenue generated, client satisfaction per member | P2 |
| T9 | Internal Communication | Team notes, announcements, @mentions | P2 |
| T10 | External Freelancers | Contact database with availability and rates | P2 |

### Database Tables

```sql
-- Team members (extends auth.users)
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  role_id UUID REFERENCES team_roles(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  photo_url TEXT,
  job_title TEXT,
  department TEXT,
  hourly_rate DECIMAL,
  contract_type TEXT, -- 'full_time', 'part_time', 'freelance', 'intern'
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active', -- 'active', 'inactive', 'on_leave'
  emergency_contact JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Roles with permissions
CREATE TABLE team_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB NOT NULL, -- Array of permission strings
  is_system BOOLEAN DEFAULT false, -- System roles can't be deleted
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Skills
CREATE TABLE team_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT, -- 'technical', 'creative', 'administrative', 'soft_skill'
  description TEXT
);

CREATE TABLE team_member_skills (
  member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES team_skills(id) ON DELETE CASCADE,
  level TEXT DEFAULT 'intermediate', -- 'beginner', 'intermediate', 'advanced', 'expert'
  certified BOOLEAN DEFAULT false,
  certified_at DATE,
  expires_at DATE,
  certificate_url TEXT,
  PRIMARY KEY (member_id, skill_id)
);

-- Weekly schedule template
CREATE TABLE team_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL, -- 0-6 (Sunday-Saturday)
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  notes TEXT,
  UNIQUE (member_id, day_of_week)
);

-- Booking assignments
CREATE TABLE team_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
  role TEXT, -- 'lead', 'assistant', 'technician'
  confirmed BOOLEAN DEFAULT false,
  confirmed_at TIMESTAMPTZ,
  notes TEXT,
  UNIQUE (booking_id, member_id)
);

-- Time tracking
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  break_minutes INTEGER DEFAULT 0,
  total_hours DECIMAL,
  booking_id UUID REFERENCES bookings(id),
  notes TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Leave requests
CREATE TABLE leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'vacation', 'sick', 'personal', 'training', 'other'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_half_day BOOLEAN DEFAULT false,
  end_half_day BOOLEAN DEFAULT false,
  reason TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'cancelled'
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Team announcements
CREATE TABLE team_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  target_roles UUID[], -- Specific roles, null = all
  published_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  pinned BOOLEAN DEFAULT false
);

-- Freelancer contacts
CREATE TABLE freelancers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  specialty TEXT[], -- Array of specialties
  day_rate DECIMAL,
  half_day_rate DECIMAL,
  hourly_rate DECIMAL,
  portfolio_url TEXT,
  rating DECIMAL, -- 1-5
  notes TEXT,
  last_worked DATE,
  total_bookings INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active', -- 'active', 'inactive', 'blacklisted'
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Components
- `TeamDirectory` - Member list with filters and search
- `MemberProfile` - Complete profile with tabs
- `RoleEditor` - Permission configuration per role
- `TeamCalendar` - Team view with availability
- `AssignmentPicker` - Member selector for booking
- `TimeTracker` - Time tracking interface with timer
- `LeaveRequestForm` - Leave request form
- `PerformanceCards` - Metrics per member
- `AnnouncementBanner` - Priority announcement display
- `FreelancerPool` - External contacts book

---

## Module 8: Settings

### Purpose
Complete application customization and account management.

### Features

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| ST1 | Studio Profile | Name, logo, address, SIRET, contacts, social media | P1 |
| ST2 | Branding | Custom colors, logo on invoices/quotes/contracts | P2 |
| ST3 | Business Hours | Per day, holidays, exceptional closures | P1 |
| ST4 | Pricing | Rate grids per studio, extras, volume discounts | P2 |
| ST5 | Document Templates | Customize invoices, quotes, contracts, emails | P2 |
| ST6 | Notifications | Configure alerts per channel (email, push, SMS) | P2 |
| ST7 | Integrations | Google Calendar, Stripe, Slack, webhooks, API keys | P2 |
| ST8 | Users | Manage accounts, invite members, reset passwords | P1 |
| ST9 | Backup & Export | Complete data export, scheduled auto backup | P2 |
| ST10 | GDPR | Consent management, client data export, right to forget | P2 |
| ST11 | Subscription | Current plan, billing, upgrade/downgrade | P1 |
| ST12 | Activity Logs | Action history for audit and debug | P2 |

### Database Tables

```sql
-- Studio information
CREATE TABLE studios_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  favicon_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Branding settings
CREATE TABLE studio_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID REFERENCES studios(id) ON DELETE CASCADE UNIQUE,
  primary_color TEXT DEFAULT '#FF4400',
  secondary_color TEXT DEFAULT '#1A1A1A',
  accent_color TEXT DEFAULT '#00B83D',
  font_heading TEXT DEFAULT 'Inter',
  font_body TEXT DEFAULT 'Inter',
  logo_light_url TEXT, -- For dark backgrounds
  logo_dark_url TEXT, -- For light backgrounds
  logo_invoice_url TEXT,
  email_header_url TEXT,
  custom_css TEXT
);

-- Business hours
CREATE TABLE studio_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL, -- 0-6
  open_time TIME,
  close_time TIME,
  is_closed BOOLEAN DEFAULT false,
  break_start TIME,
  break_end TIME,
  UNIQUE (studio_id, day_of_week)
);

-- Exceptional closures
CREATE TABLE studio_closures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  reason TEXT,
  is_all_day BOOLEAN DEFAULT true,
  start_time TIME,
  end_time TIME,
  created_by UUID REFERENCES auth.users(id)
);

-- Pricing rules
CREATE TABLE pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'discount', 'surcharge', 'package'
  apply_to TEXT, -- 'all', 'studio', 'client_tier', 'time_slot'
  conditions JSONB, -- When to apply
  modifier_type TEXT, -- 'percentage', 'fixed'
  modifier_value DECIMAL NOT NULL,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  valid_from DATE,
  valid_until DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Document templates
CREATE TABLE document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'invoice', 'quote', 'contract', 'email', 'receipt'
  name TEXT NOT NULL,
  content TEXT NOT NULL, -- HTML/Markdown template
  variables JSONB, -- Available merge fields
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Notification preferences
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'booking_new', 'payment_received', 'stock_low', etc.
  email BOOLEAN DEFAULT true,
  push BOOLEAN DEFAULT true,
  sms BOOLEAN DEFAULT false,
  in_app BOOLEAN DEFAULT true,
  UNIQUE (user_id, event_type)
);

-- Integration connections
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'google_calendar', 'stripe', 'slack', 'zapier'
  name TEXT,
  credentials JSONB, -- Encrypted
  config JSONB,
  status TEXT DEFAULT 'disconnected',
  last_sync_at TIMESTAMPTZ,
  error_message TEXT,
  connected_by UUID REFERENCES auth.users(id),
  connected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- API keys
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL, -- First 8 chars for display
  key_hash TEXT NOT NULL, -- Hashed full key
  permissions TEXT[], -- Allowed scopes
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Backups
CREATE TABLE backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'manual', 'scheduled', 'pre_migration'
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed'
  file_url TEXT,
  file_size BIGINT,
  tables_included TEXT[],
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- GDPR requests
CREATE TABLE gdpr_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  type TEXT NOT NULL, -- 'export', 'delete', 'anonymize', 'consent_withdraw'
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'rejected'
  request_details JSONB,
  result_url TEXT, -- For exports
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID REFERENCES studios(id) ON DELETE CASCADE UNIQUE,
  plan TEXT NOT NULL, -- 'free', 'starter', 'professional', 'enterprise'
  status TEXT DEFAULT 'active', -- 'active', 'past_due', 'cancelled', 'trialing'
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Components
- `StudioProfile` - Studio info form
- `BrandingEditor` - Color/logo customization with preview
- `HoursScheduler` - Hours grid per day
- `TemplateEditor` - WYSIWYG editor with variables
- `NotificationMatrix` - Events × channels table
- `IntegrationCards` - Integration list with connection status
- `APIKeyManager` - Generate/revoke API keys
- `BackupScheduler` - Auto backup configuration
- `GDPRCenter` - GDPR request management
- `BillingPortal` - Stripe subscription management

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Supabase project setup
- [ ] Authentication (email, Google, magic link)
- [ ] Core database tables
- [ ] Base UI components
- [ ] Dashboard with real-time KPIs

### Phase 2: Core Operations (Week 3-4)
- [ ] Space Control with calendar
- [ ] Booking CRUD operations
- [ ] Inventory management
- [ ] Equipment tracking

### Phase 3: CRM & Finance (Week 5-6)
- [ ] Client management
- [ ] Quote creation
- [ ] Invoice generation
- [ ] Stripe integration

### Phase 4: AI & Automation (Week 7-8)
- [ ] AI agent conversations
- [ ] NEXUS workflows
- [ ] SENTINEL monitoring
- [ ] Notifications system

### Phase 5: Team & Settings (Week 9-10)
- [ ] Team management
- [ ] Role-based access
- [ ] Settings configuration
- [ ] Integrations

### Phase 6: Polish & Launch (Week 11-12)
- [ ] Performance optimization
- [ ] Security audit
- [ ] Documentation
- [ ] Beta testing

---

## Summary

| Metric | Count |
|--------|-------|
| Total Modules | 8 |
| Total Features | 83 |
| Database Tables | 67 |
| UI Components | 70+ |
| API Endpoints | 150+ |

---

*Document generated on 2026-01-19*
*Version 2.0 - Full Stack with Supabase*
