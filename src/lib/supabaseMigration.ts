/**
 * Supabase Migration Infrastructure
 *
 * Ce module definit les schemas SQL pour les tables de migration
 * et fournit les utilitaires pour migrer les donnees localStorage vers Supabase.
 */

import type { Json } from '../types/database';

// ============================================================================
// Types pour les tables de migration
// ============================================================================

export type AutomationTrigger =
  | 'booking_created'
  | 'booking_cancelled'
  | 'booking_completed'
  | 'payment_received'
  | 'client_created'
  | 'reminder_due';

export type AutomationAction =
  | 'send_email'
  | 'send_sms'
  | 'create_task'
  | 'update_status'
  | 'notify_team'
  | 'webhook';

export type TaskType = 'preparation' | 'followup' | 'maintenance' | 'admin' | 'custom';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'cancelled';
export type PricingRuleType = 'discount' | 'surcharge' | 'peak_hour' | 'last_minute' | 'early_bird';
export type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app';
export type NotificationCategory = 'booking' | 'payment' | 'reminder' | 'marketing' | 'system';
export type SyncDirection = 'push' | 'pull' | 'bidirectional';
export type JourneyType = 'welcome' | 'pre_booking' | 'post_booking' | 'vip';
export type ChartType = 'line' | 'bar' | 'pie' | 'area' | 'doughnut';

export interface AutomationRow {
  id: string;
  studio_id: string;
  name: string;
  trigger: AutomationTrigger;
  action: AutomationAction;
  enabled: boolean;
  config: Json;
  created_at: string;
  updated_at: string;
}

export interface TaskRow {
  id: string;
  studio_id: string;
  title: string;
  description: string | null;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  assignee_id: string | null;
  booking_id: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface PricingRuleRow {
  id: string;
  studio_id: string;
  space_id: string | null;
  rule_type: PricingRuleType;
  modifier: number;
  conditions: Json;
  enabled: boolean;
  created_at: string;
}

export interface NotificationPreferenceRow {
  id: string;
  studio_id: string;
  channel: NotificationChannel;
  category: NotificationCategory;
  enabled: boolean;
  config: Json;
}

export interface EmailTemplateRow {
  id: string;
  studio_id: string;
  category: string;
  subject: string;
  body: string;
  variables: Json;
  enabled: boolean;
}

export interface SmsTemplateRow {
  id: string;
  studio_id: string;
  category: string;
  message: string;
  variables: Json;
  enabled: boolean;
}

export interface AvailabilitySettingRow {
  id: string;
  studio_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export interface AppointmentTypeRow {
  id: string;
  studio_id: string;
  name: string;
  duration: number;
  price: number;
  color: string;
  description: string | null;
  enabled: boolean;
}

export interface IntegrationConfigRow {
  id: string;
  studio_id: string;
  provider: string;
  api_key_encrypted: string | null;
  webhook_url: string | null;
  sync_frequency: string | null;
  enabled: boolean;
}

export interface CalendarSyncConfigRow {
  id: string;
  studio_id: string;
  provider: string;
  calendar_id: string | null;
  sync_direction: SyncDirection;
  enabled: boolean;
}

export interface GuestJourneyRow {
  id: string;
  studio_id: string;
  name: string;
  journey_type: JourneyType;
  steps: Json;
  enabled: boolean;
}

export interface SavedReportRow {
  id: string;
  studio_id: string;
  name: string;
  metrics: Json;
  period: string;
  chart_type: ChartType;
  config: Json;
}

export interface CancellationPolicyRow {
  id: string;
  studio_id: string;
  window_hours: number;
  refund_tiers: Json;
  late_fee: number;
  no_show_fee: number;
  grace_period: number;
}

// ============================================================================
// Cles localStorage connues dans l'application
// ============================================================================

export interface LocalStorageKeyInfo {
  key: string;
  table: string;
  label: string;
  description: string;
}

/**
 * Retourne la liste exhaustive des cles localStorage utilisees par l'application
 * avec leur table Supabase cible correspondante.
 */
export function getLocalStorageKeys(): LocalStorageKeyInfo[] {
  return [
    {
      key: 'rooom_automations',
      table: 'automations',
      label: 'Automatisations',
      description: 'Regles d\'automatisation des processus studio',
    },
    {
      key: 'rooom_automation_workflows',
      table: 'automations',
      label: 'Workflows',
      description: 'Workflows d\'automatisation avances',
    },
    {
      key: 'rooom_guest_journeys',
      table: 'guest_journeys',
      label: 'Parcours invites',
      description: 'Parcours personnalises pour les invites',
    },
    {
      key: 'rooom_appointment_types',
      table: 'appointment_types',
      label: 'Types de rendez-vous',
      description: 'Types de rendez-vous et services proposes',
    },
    {
      key: 'rooom_availability_settings',
      table: 'availability_settings',
      label: 'Disponibilites',
      description: 'Configuration des horaires de disponibilite',
    },
    {
      key: 'rooom-email-templates',
      table: 'email_templates',
      label: 'Templates email',
      description: 'Modeles de notifications par email',
    },
    {
      key: 'rooom-sms-templates',
      table: 'sms_templates',
      label: 'Templates SMS',
      description: 'Modeles de notifications par SMS',
    },
    {
      key: 'rooom-alert-notifications',
      table: 'notification_preferences',
      label: 'Preferences alertes',
      description: 'Preferences de notifications et alertes',
    },
    {
      key: 'rooom-push-preferences',
      table: 'notification_preferences',
      label: 'Preferences push',
      description: 'Preferences de notifications push',
    },
    {
      key: 'rooom-integrations',
      table: 'integration_configs',
      label: 'Integrations',
      description: 'Configurations des integrations tierces',
    },
    {
      key: 'rooom-calendar-sync',
      table: 'calendar_sync_configs',
      label: 'Synchronisation calendrier',
      description: 'Configuration de la synchronisation des calendriers',
    },
    {
      key: 'rooom-saved-reports',
      table: 'saved_reports',
      label: 'Rapports sauvegardes',
      description: 'Configurations de rapports personnalises',
    },
    {
      key: 'rooom_cancellation_policy',
      table: 'cancellation_policies',
      label: 'Politique d\'annulation',
      description: 'Regles et paliers de remboursement',
    },
    {
      key: 'rooom-settings-profile',
      table: 'studios',
      label: 'Profil studio',
      description: 'Informations generales du studio',
    },
    {
      key: 'rooom-settings-hours',
      table: 'availability_settings',
      label: 'Horaires d\'ouverture',
      description: 'Horaires d\'ouverture hebdomadaires',
    },
    {
      key: 'rooom-settings-booking',
      table: 'studios',
      label: 'Parametres reservation',
      description: 'Configuration des reservations',
    },
    {
      key: 'rooom-settings-notifications',
      table: 'notification_preferences',
      label: 'Parametres notifications',
      description: 'Preferences de notification generales',
    },
    {
      key: 'rooom-settings-billing',
      table: 'studios',
      label: 'Facturation',
      description: 'Parametres de facturation et TVA',
    },
    {
      key: 'rooom-payments',
      table: 'payments',
      label: 'Paiements (parametres)',
      description: 'Configuration des methodes de paiement',
    },
    {
      key: 'rooom-payments-transactions',
      table: 'payments',
      label: 'Paiements (transactions)',
      description: 'Historique des transactions',
    },
    {
      key: 'rooom-webhooks',
      table: 'integration_configs',
      label: 'Webhooks',
      description: 'Configurations des webhooks',
    },
    {
      key: 'rooom_widget_configs',
      table: 'widget_configs',
      label: 'Configurations widget',
      description: 'Configurations des widgets embed sauvegardes',
    },
    {
      key: 'rooom-currency',
      table: 'studios',
      label: 'Devise',
      description: 'Preference de devise du studio',
    },
    {
      key: 'rooom_booking_conflict_mode',
      table: 'studios',
      label: 'Mode conflit reservation',
      description: 'Configuration de prevention des doubles reservations',
    },
  ];
}

// ============================================================================
// SQL de migration
// ============================================================================

/**
 * Retourne le SQL complet pour creer toutes les tables de migration.
 * A executer dans la console SQL Supabase ou via une migration.
 */
export function getMigrationSQL(): string {
  return `
-- ============================================================================
-- Rooom OS - Migration SQL
-- Tables supplementaires pour les donnees actuellement stockees en localStorage
-- ============================================================================

-- Types enum
CREATE TYPE automation_trigger AS ENUM (
  'booking_created', 'booking_cancelled', 'booking_completed',
  'payment_received', 'client_created', 'reminder_due'
);

CREATE TYPE automation_action AS ENUM (
  'send_email', 'send_sms', 'create_task',
  'update_status', 'notify_team', 'webhook'
);

CREATE TYPE task_type AS ENUM ('preparation', 'followup', 'maintenance', 'admin', 'custom');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'done', 'cancelled');
CREATE TYPE pricing_rule_type AS ENUM ('discount', 'surcharge', 'peak_hour', 'last_minute', 'early_bird');
CREATE TYPE notification_channel AS ENUM ('email', 'sms', 'push', 'in_app');
CREATE TYPE notification_category AS ENUM ('booking', 'payment', 'reminder', 'marketing', 'system');
CREATE TYPE sync_direction AS ENUM ('push', 'pull', 'bidirectional');
CREATE TYPE journey_type AS ENUM ('welcome', 'pre_booking', 'post_booking', 'vip');
CREATE TYPE chart_type AS ENUM ('line', 'bar', 'pie', 'area', 'doughnut');

-- ============================================================================
-- Table: automations
-- ============================================================================
CREATE TABLE automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trigger automation_trigger NOT NULL,
  action automation_action NOT NULL,
  enabled BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_automations_studio ON automations(studio_id);
ALTER TABLE automations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Studio members can manage automations"
  ON automations FOR ALL
  USING (studio_id IN (SELECT studio_id FROM team_members WHERE user_id = auth.uid()));

-- ============================================================================
-- Table: tasks
-- ============================================================================
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type task_type DEFAULT 'custom',
  priority task_priority DEFAULT 'medium',
  status task_status DEFAULT 'todo',
  assignee_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tasks_studio ON tasks(studio_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Studio members can manage tasks"
  ON tasks FOR ALL
  USING (studio_id IN (SELECT studio_id FROM team_members WHERE user_id = auth.uid()));

-- ============================================================================
-- Table: pricing_rules
-- ============================================================================
CREATE TABLE pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
  rule_type pricing_rule_type NOT NULL,
  modifier NUMERIC(10, 2) NOT NULL DEFAULT 0,
  conditions JSONB DEFAULT '{}'::jsonb,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_pricing_rules_studio ON pricing_rules(studio_id);
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Studio members can manage pricing rules"
  ON pricing_rules FOR ALL
  USING (studio_id IN (SELECT studio_id FROM team_members WHERE user_id = auth.uid()));

-- ============================================================================
-- Table: notification_preferences
-- ============================================================================
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  channel notification_channel NOT NULL,
  category notification_category NOT NULL,
  enabled BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}'::jsonb,
  UNIQUE (studio_id, channel, category)
);

CREATE INDEX idx_notification_preferences_studio ON notification_preferences(studio_id);
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Studio members can manage notification preferences"
  ON notification_preferences FOR ALL
  USING (studio_id IN (SELECT studio_id FROM team_members WHERE user_id = auth.uid()));

-- ============================================================================
-- Table: email_templates
-- ============================================================================
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  variables JSONB DEFAULT '[]'::jsonb,
  enabled BOOLEAN DEFAULT true
);

CREATE INDEX idx_email_templates_studio ON email_templates(studio_id);
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Studio members can manage email templates"
  ON email_templates FOR ALL
  USING (studio_id IN (SELECT studio_id FROM team_members WHERE user_id = auth.uid()));

-- ============================================================================
-- Table: sms_templates
-- ============================================================================
CREATE TABLE sms_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  variables JSONB DEFAULT '[]'::jsonb,
  enabled BOOLEAN DEFAULT true
);

CREATE INDEX idx_sms_templates_studio ON sms_templates(studio_id);
ALTER TABLE sms_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Studio members can manage SMS templates"
  ON sms_templates FOR ALL
  USING (studio_id IN (SELECT studio_id FROM team_members WHERE user_id = auth.uid()));

-- ============================================================================
-- Table: availability_settings
-- ============================================================================
CREATE TABLE availability_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  UNIQUE (studio_id, day_of_week)
);

CREATE INDEX idx_availability_settings_studio ON availability_settings(studio_id);
ALTER TABLE availability_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Studio members can manage availability"
  ON availability_settings FOR ALL
  USING (studio_id IN (SELECT studio_id FROM team_members WHERE user_id = auth.uid()));

-- ============================================================================
-- Table: appointment_types
-- ============================================================================
CREATE TABLE appointment_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration INTEGER NOT NULL DEFAULT 60,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT '#1E3A5F',
  description TEXT,
  enabled BOOLEAN DEFAULT true
);

CREATE INDEX idx_appointment_types_studio ON appointment_types(studio_id);
ALTER TABLE appointment_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Studio members can manage appointment types"
  ON appointment_types FOR ALL
  USING (studio_id IN (SELECT studio_id FROM team_members WHERE user_id = auth.uid()));

-- ============================================================================
-- Table: integration_configs
-- ============================================================================
CREATE TABLE integration_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  api_key_encrypted TEXT,
  webhook_url TEXT,
  sync_frequency TEXT,
  enabled BOOLEAN DEFAULT false,
  UNIQUE (studio_id, provider)
);

CREATE INDEX idx_integration_configs_studio ON integration_configs(studio_id);
ALTER TABLE integration_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Studio members can manage integrations"
  ON integration_configs FOR ALL
  USING (studio_id IN (SELECT studio_id FROM team_members WHERE user_id = auth.uid()));

-- ============================================================================
-- Table: calendar_sync_configs
-- ============================================================================
CREATE TABLE calendar_sync_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  calendar_id TEXT,
  sync_direction sync_direction DEFAULT 'bidirectional',
  enabled BOOLEAN DEFAULT false,
  UNIQUE (studio_id, provider)
);

CREATE INDEX idx_calendar_sync_configs_studio ON calendar_sync_configs(studio_id);
ALTER TABLE calendar_sync_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Studio members can manage calendar sync"
  ON calendar_sync_configs FOR ALL
  USING (studio_id IN (SELECT studio_id FROM team_members WHERE user_id = auth.uid()));

-- ============================================================================
-- Table: guest_journeys
-- ============================================================================
CREATE TABLE guest_journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  journey_type journey_type NOT NULL DEFAULT 'welcome',
  steps JSONB DEFAULT '[]'::jsonb,
  enabled BOOLEAN DEFAULT true
);

CREATE INDEX idx_guest_journeys_studio ON guest_journeys(studio_id);
ALTER TABLE guest_journeys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Studio members can manage guest journeys"
  ON guest_journeys FOR ALL
  USING (studio_id IN (SELECT studio_id FROM team_members WHERE user_id = auth.uid()));

-- ============================================================================
-- Table: saved_reports
-- ============================================================================
CREATE TABLE saved_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  metrics JSONB DEFAULT '[]'::jsonb,
  period TEXT NOT NULL DEFAULT 'month',
  chart_type chart_type DEFAULT 'line',
  config JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_saved_reports_studio ON saved_reports(studio_id);
ALTER TABLE saved_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Studio members can manage saved reports"
  ON saved_reports FOR ALL
  USING (studio_id IN (SELECT studio_id FROM team_members WHERE user_id = auth.uid()));

-- ============================================================================
-- Table: cancellation_policies
-- ============================================================================
CREATE TABLE cancellation_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  window_hours INTEGER NOT NULL DEFAULT 48,
  refund_tiers JSONB DEFAULT '[]'::jsonb,
  late_fee NUMERIC(10, 2) DEFAULT 0,
  no_show_fee NUMERIC(10, 2) DEFAULT 0,
  grace_period INTEGER DEFAULT 15,
  UNIQUE (studio_id)
);

CREATE INDEX idx_cancellation_policies_studio ON cancellation_policies(studio_id);
ALTER TABLE cancellation_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Studio members can manage cancellation policies"
  ON cancellation_policies FOR ALL
  USING (studio_id IN (SELECT studio_id FROM team_members WHERE user_id = auth.uid()));

-- ============================================================================
-- Trigger de mise a jour updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_automations_updated_at
  BEFORE UPDATE ON automations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`.trim();
}
