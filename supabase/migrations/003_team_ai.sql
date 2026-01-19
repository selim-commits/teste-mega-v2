-- Rooom OS Database Schema
-- Migration 003: Team & AI Tables

-- ============================================
-- TEAM
-- ============================================

CREATE TABLE team_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '[]',
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default roles
INSERT INTO team_roles (name, description, permissions, is_system) VALUES
  ('admin', 'Full access to all features', '["*"]', true),
  ('manager', 'Manage bookings, clients, team', '["bookings.*", "clients.*", "team.view", "team.edit", "inventory.*", "finance.view"]', true),
  ('operator', 'Day-to-day operations', '["bookings.view", "bookings.create", "bookings.edit", "clients.view", "inventory.view"]', true),
  ('freelance', 'Limited external access', '["bookings.view.assigned", "clients.view.assigned"]', true);

CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE,
  role_id UUID REFERENCES team_roles(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  photo_url TEXT,
  job_title TEXT,
  department TEXT,
  hourly_rate DECIMAL(10,2),
  contract_type TEXT, -- 'full_time', 'part_time', 'freelance', 'intern'
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active', -- 'active', 'inactive', 'on_leave'
  emergency_contact JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE team_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

CREATE TABLE team_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  notes TEXT,
  UNIQUE (member_id, day_of_week)
);

CREATE TABLE team_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
  role TEXT, -- 'lead', 'assistant', 'technician'
  confirmed BOOLEAN DEFAULT false,
  confirmed_at TIMESTAMPTZ,
  notes TEXT,
  UNIQUE (booking_id, member_id)
);

CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  break_minutes INTEGER DEFAULT 0,
  total_hours DECIMAL(5,2),
  booking_id UUID REFERENCES bookings(id),
  notes TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  approved_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE leave_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'vacation', 'sick', 'personal', 'training', 'other'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_half_day BOOLEAN DEFAULT false,
  end_half_day BOOLEAN DEFAULT false,
  reason TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'cancelled'
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE team_announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  target_roles UUID[],
  published_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  pinned BOOLEAN DEFAULT false
);

CREATE TABLE freelancers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  specialty TEXT[],
  day_rate DECIMAL(10,2),
  half_day_rate DECIMAL(10,2),
  hourly_rate DECIMAL(10,2),
  portfolio_url TEXT,
  rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5),
  notes TEXT,
  last_worked DATE,
  total_bookings INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active', -- 'active', 'inactive', 'blacklisted'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- AI & AUTOMATION
-- ============================================

CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id TEXT NOT NULL, -- 'yoda', 'nexus', 'nova', 'sentinel'
  user_id UUID,
  title TEXT,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ai_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'user', 'assistant', 'system'
  content TEXT NOT NULL,
  metadata JSONB,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ai_agent_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id TEXT NOT NULL,
  user_id UUID,
  memory_type TEXT NOT NULL, -- 'preference', 'fact', 'pattern'
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  confidence DECIMAL(3,2) DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (agent_id, user_id, key)
);

CREATE TABLE ai_workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  agent TEXT DEFAULT 'nexus',
  trigger_type TEXT NOT NULL, -- 'schedule', 'event', 'webhook', 'manual'
  trigger_config JSONB NOT NULL,
  conditions JSONB,
  actions JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  run_count INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ai_workflow_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID REFERENCES ai_workflows(id) ON DELETE CASCADE,
  status TEXT NOT NULL, -- 'started', 'success', 'failure', 'skipped'
  trigger_data JSONB,
  actions_executed JSONB,
  error_message TEXT,
  duration_ms INTEGER,
  executed_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ai_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id TEXT NOT NULL,
  user_id UUID,
  type TEXT NOT NULL, -- 'insight', 'action', 'warning', 'opportunity'
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_type TEXT,
  action_data JSONB,
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'dismissed', 'expired'
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ai_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  provider TEXT NOT NULL, -- 'google', 'slack', 'zapier', 'custom'
  credentials JSONB,
  config JSONB,
  status TEXT DEFAULT 'disconnected', -- 'connected', 'disconnected', 'error'
  last_sync_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- AUDIT & SECURITY
-- ============================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  action TEXT NOT NULL, -- 'create', 'read', 'update', 'delete', 'login', 'logout'
  entity_type TEXT NOT NULL,
  entity_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE security_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL, -- 'failed_login', 'suspicious_activity', 'data_export', 'permission_change'
  severity TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
  title TEXT NOT NULL,
  message TEXT,
  metadata JSONB,
  user_id UUID,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  type TEXT NOT NULL, -- 'booking', 'payment', 'stock', 'maintenance', 'system', 'ai'
  title TEXT NOT NULL,
  message TEXT,
  action_url TEXT,
  metadata JSONB,
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  email BOOLEAN DEFAULT true,
  push BOOLEAN DEFAULT true,
  sms BOOLEAN DEFAULT false,
  in_app BOOLEAN DEFAULT true,
  UNIQUE (user_id, event_type)
);

-- ============================================
-- GOALS & DASHBOARD
-- ============================================

CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
  metric TEXT NOT NULL, -- 'revenue', 'bookings', 'new_clients', 'occupation'
  target DECIMAL(10,2) NOT NULL,
  current DECIMAL(10,2) DEFAULT 0,
  period TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'yearly'
  period_start DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  widget_type TEXT NOT NULL,
  position JSONB NOT NULL DEFAULT '{"x": 0, "y": 0}',
  size JSONB NOT NULL DEFAULT '{"w": 1, "h": 1}',
  config JSONB DEFAULT '{}',
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_team_members_status ON team_members(status);
CREATE INDEX idx_team_assignments_booking ON team_assignments(booking_id);
CREATE INDEX idx_time_entries_member_date ON time_entries(member_id, date);
CREATE INDEX idx_leave_requests_member ON leave_requests(member_id);
CREATE INDEX idx_ai_conversations_agent_user ON ai_conversations(agent_id, user_id);
CREATE INDEX idx_ai_messages_conversation ON ai_messages(conversation_id);
CREATE INDEX idx_ai_suggestions_user_status ON ai_suggestions(user_id, status);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX idx_goals_studio_period ON goals(studio_id, period_start);

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_ai_conversations_updated_at
  BEFORE UPDATE ON ai_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_ai_agent_memory_updated_at
  BEFORE UPDATE ON ai_agent_memory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
