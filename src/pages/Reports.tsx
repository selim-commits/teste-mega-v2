import { useState, useMemo, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Download,
  Percent,
  ShoppingCart,
  XCircle,
  UserPlus,
  CreditCard,
  CalendarCheck,
  FileSpreadsheet,
  FileText,
  BarChart3,
  PieChart,
  LineChart,
  Table,
  Save,
  Play,
  Trash2,
  Plus,
  FolderOpen,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Dropdown, DropdownItem, DropdownLabel } from '../components/ui/Dropdown';
import { useNotifications } from '../stores/uiStore';
import { exportCSV, exportPDF } from './reports/exportUtils';
import type { ReportExportData } from './reports/exportUtils';
import styles from './Reports.module.css';

// ─── Types ──────────────────────────────────────────────

interface KpiStat {
  key: string;
  label: string;
  value: string;
  rawValue: number;
  change: number;
  icon: typeof DollarSign;
  color: string;
  suffix?: string;
}

interface MonthlyRevenue {
  month: string;
  value: number;
}

interface SpaceData {
  name: string;
  percentage: number;
  color: string;
}

interface WeeklyBooking {
  label: string;
  value: number;
}

interface TopClient {
  name: string;
  revenue: number;
}

interface ActivityItem {
  type: 'reservation' | 'paiement' | 'annulation' | 'client';
  title: string;
  description: string;
  amount?: number;
  time: string;
}

interface PeriodData {
  kpis: KpiStat[];
  monthlyRevenue: MonthlyRevenue[];
  spaces: SpaceData[];
  weeklyBookings: WeeklyBooking[];
  topClients: TopClient[];
  activities: ActivityItem[];
}

// ─── Report Builder Types ─────────────────────────────

type MetricKey = 'revenus' | 'reservations' | 'occupation' | 'clients' | 'depenses' | 'roi';
type PeriodKey = 'semaine' | 'mois' | 'trimestre' | 'annee' | 'personnalise';
type ChartType = 'barres' | 'donut' | 'ligne' | 'tableau';
type ReportsTab = 'dashboard' | 'builder' | 'saved';

interface MetricOption {
  key: MetricKey;
  label: string;
}

interface BuilderFormState {
  name: string;
  metrics: MetricKey[];
  period: PeriodKey;
  chartType: ChartType;
}

interface GeneratedDataPoint {
  label: string;
  value: number;
  color: string;
}

interface GeneratedReport {
  name: string;
  metrics: MetricKey[];
  period: PeriodKey;
  chartType: ChartType;
  data: GeneratedDataPoint[];
}

interface SavedReport {
  id: string;
  name: string;
  metrics: MetricKey[];
  period: PeriodKey;
  chartType: ChartType;
  data: GeneratedDataPoint[];
  createdAt: string;
}

// ─── Constants ──────────────────────────────────────────

const METRIC_OPTIONS: MetricOption[] = [
  { key: 'revenus', label: 'Revenus' },
  { key: 'reservations', label: 'Reservations' },
  { key: 'occupation', label: "Taux d'occupation" },
  { key: 'clients', label: 'Clients' },
  { key: 'depenses', label: 'Depenses' },
  { key: 'roi', label: 'ROI' },
];

const METRIC_LABELS: Record<MetricKey, string> = {
  revenus: 'Revenus',
  reservations: 'Reservations',
  occupation: "Taux d'occupation",
  clients: 'Clients',
  depenses: 'Depenses',
  roi: 'ROI',
};

const PERIOD_OPTIONS = [
  { value: 'semaine' as PeriodKey, label: 'Semaine' },
  { value: 'mois' as PeriodKey, label: 'Mois' },
  { value: 'trimestre' as PeriodKey, label: 'Trimestre' },
  { value: 'annee' as PeriodKey, label: 'Annee' },
  { value: 'personnalise' as PeriodKey, label: 'Personnalise' },
];

const CHART_OPTIONS: { value: ChartType; label: string; icon: typeof BarChart3 }[] = [
  { value: 'barres', label: 'Barres', icon: BarChart3 },
  { value: 'donut', label: 'Donut', icon: PieChart },
  { value: 'ligne', label: 'Ligne', icon: LineChart },
  { value: 'tableau', label: 'Tableau', icon: Table },
];

const CHART_COLORS = [
  'var(--accent-primary)',
  'var(--state-info)',
  'var(--state-success)',
  'var(--state-warning)',
  'var(--state-error)',
  'var(--text-secondary)',
];

const STORAGE_KEY = 'rooom-saved-reports';

// ─── Period Options (Dashboard) ─────────────────────────

const periodOptions = [
  { value: '7d', label: '7 derniers jours' },
  { value: '30d', label: '30 derniers jours' },
  { value: '90d', label: '90 derniers jours' },
  { value: '12m', label: '12 derniers mois' },
];

// ─── Mock Data by Period ────────────────────────────────

const dataByPeriod: Record<string, PeriodData> = {
  '7d': {
    kpis: [
      { key: 'revenue', label: 'Revenu total', value: '2 180 \u20ac', rawValue: 2180, change: 5.2, icon: DollarSign, color: 'var(--state-success)' },
      { key: 'occupation', label: "Taux d'occupation", value: '72%', rawValue: 72, change: 3.1, icon: Percent, color: 'var(--state-info)', suffix: '%' },
      { key: 'bookings', label: 'Reservations', value: '34', rawValue: 34, change: 8.5, icon: CalendarCheck, color: 'var(--accent-primary)' },
      { key: 'basket', label: 'Panier moyen', value: '64 \u20ac', rawValue: 64, change: -2.3, icon: ShoppingCart, color: 'var(--state-warning)' },
      { key: 'new_clients', label: 'Nouveaux clients', value: '7', rawValue: 7, change: 16.7, icon: UserPlus, color: 'var(--state-info)' },
      { key: 'cancel', label: "Taux d'annulation", value: '4.2%', rawValue: 4.2, change: -1.5, icon: XCircle, color: 'var(--state-error)', suffix: '%' },
    ],
    monthlyRevenue: [
      { month: 'Jan', value: 8200 }, { month: 'Fev', value: 9100 }, { month: 'Mar', value: 10500 },
      { month: 'Avr', value: 9800 }, { month: 'Mai', value: 11200 }, { month: 'Juin', value: 12800 },
      { month: 'Juil', value: 11500 }, { month: 'Aou', value: 8900 }, { month: 'Sep', value: 13200 },
      { month: 'Oct', value: 14100 }, { month: 'Nov', value: 12600 }, { month: 'Dec', value: 15300 },
    ],
    spaces: [
      { name: 'Studio A', percentage: 35, color: 'var(--accent-primary)' },
      { name: 'Studio B', percentage: 28, color: 'var(--state-info)' },
      { name: 'Salle de reunion', percentage: 20, color: 'var(--state-success)' },
      { name: 'Espace coworking', percentage: 12, color: 'var(--state-warning)' },
      { name: 'Terrasse', percentage: 5, color: 'var(--state-error)' },
    ],
    weeklyBookings: [
      { label: 'S1', value: 5 }, { label: 'S2', value: 3 }, { label: 'S3', value: 7 },
      { label: 'S4', value: 4 }, { label: 'S5', value: 6 }, { label: 'S6', value: 8 },
      { label: 'S7', value: 5 }, { label: 'S8', value: 9 }, { label: 'S9', value: 6 },
      { label: 'S10', value: 7 }, { label: 'S11', value: 4 }, { label: 'S12', value: 8 },
    ],
    topClients: [
      { name: 'Marie Laurent', revenue: 420 },
      { name: 'Jean Dupont', revenue: 380 },
      { name: 'Sophie Martin', revenue: 310 },
      { name: 'Pierre Durand', revenue: 290 },
      { name: 'Claire Petit', revenue: 250 },
    ],
    activities: [
      { type: 'reservation', title: 'Nouvelle reservation', description: 'Studio A - Marie Laurent, 14h-17h', amount: 180, time: 'Il y a 25 min' },
      { type: 'paiement', title: 'Paiement recu', description: 'Facture #2024-0147 - Jean Dupont', amount: 150, time: 'Il y a 1h' },
      { type: 'client', title: 'Nouveau client', description: 'Thomas Bernard inscrit via le site web', time: 'Il y a 2h' },
      { type: 'annulation', title: 'Annulation', description: 'Studio B - Claire Petit, 10h-12h', amount: -90, time: 'Il y a 3h' },
      { type: 'paiement', title: 'Paiement recu', description: 'Pack 10 seances - Sophie Martin', amount: 450, time: 'Il y a 4h' },
      { type: 'reservation', title: 'Nouvelle reservation', description: 'Salle de reunion - Startup XYZ, 9h-18h', amount: 320, time: 'Il y a 5h' },
      { type: 'client', title: 'Nouveau client', description: 'Emma Leroy recommandee par Marie Laurent', time: 'Hier' },
      { type: 'paiement', title: 'Paiement recu', description: 'Facture #2024-0145 - Pierre Durand', amount: 210, time: 'Hier' },
    ],
  },
  '30d': {
    kpis: [
      { key: 'revenue', label: 'Revenu total', value: '12 450 \u20ac', rawValue: 12450, change: 12.4, icon: DollarSign, color: 'var(--state-success)' },
      { key: 'occupation', label: "Taux d'occupation", value: '78%', rawValue: 78, change: 5.8, icon: Percent, color: 'var(--state-info)', suffix: '%' },
      { key: 'bookings', label: 'Reservations', value: '156', rawValue: 156, change: 8.3, icon: CalendarCheck, color: 'var(--accent-primary)' },
      { key: 'basket', label: 'Panier moyen', value: '80 \u20ac', rawValue: 80, change: 3.7, icon: ShoppingCart, color: 'var(--state-warning)' },
      { key: 'new_clients', label: 'Nouveaux clients', value: '28', rawValue: 28, change: 22.0, icon: UserPlus, color: 'var(--state-info)' },
      { key: 'cancel', label: "Taux d'annulation", value: '3.8%', rawValue: 3.8, change: -0.5, icon: XCircle, color: 'var(--state-error)', suffix: '%' },
    ],
    monthlyRevenue: [
      { month: 'Jan', value: 9200 }, { month: 'Fev', value: 10400 }, { month: 'Mar', value: 11800 },
      { month: 'Avr', value: 10500 }, { month: 'Mai', value: 12100 }, { month: 'Juin', value: 13900 },
      { month: 'Juil', value: 12200 }, { month: 'Aou', value: 9600 }, { month: 'Sep', value: 14500 },
      { month: 'Oct', value: 15200 }, { month: 'Nov', value: 13800 }, { month: 'Dec', value: 16400 },
    ],
    spaces: [
      { name: 'Studio A', percentage: 32, color: 'var(--accent-primary)' },
      { name: 'Studio B', percentage: 26, color: 'var(--state-info)' },
      { name: 'Salle de reunion', percentage: 22, color: 'var(--state-success)' },
      { name: 'Espace coworking', percentage: 14, color: 'var(--state-warning)' },
      { name: 'Terrasse', percentage: 6, color: 'var(--state-error)' },
    ],
    weeklyBookings: [
      { label: 'S1', value: 12 }, { label: 'S2', value: 10 }, { label: 'S3', value: 15 },
      { label: 'S4', value: 11 }, { label: 'S5', value: 14 }, { label: 'S6', value: 18 },
      { label: 'S7', value: 13 }, { label: 'S8', value: 20 }, { label: 'S9', value: 16 },
      { label: 'S10', value: 15 }, { label: 'S11', value: 12 }, { label: 'S12', value: 19 },
    ],
    topClients: [
      { name: 'Marie Laurent', revenue: 1850 },
      { name: 'Jean Dupont', revenue: 1620 },
      { name: 'Sophie Martin', revenue: 1340 },
      { name: 'Pierre Durand', revenue: 1180 },
      { name: 'Claire Petit', revenue: 980 },
    ],
    activities: [
      { type: 'reservation', title: 'Nouvelle reservation', description: 'Studio A - Marie Laurent, 14h-17h', amount: 180, time: 'Il y a 25 min' },
      { type: 'paiement', title: 'Paiement recu', description: 'Facture #2024-0147 - Jean Dupont', amount: 150, time: 'Il y a 1h' },
      { type: 'client', title: 'Nouveau client', description: 'Thomas Bernard inscrit via le site web', time: 'Il y a 2h' },
      { type: 'annulation', title: 'Annulation', description: 'Studio B - Claire Petit, 10h-12h', amount: -90, time: 'Il y a 3h' },
      { type: 'paiement', title: 'Paiement recu', description: 'Pack 10 seances - Sophie Martin', amount: 450, time: 'Il y a 4h' },
      { type: 'reservation', title: 'Nouvelle reservation', description: 'Salle de reunion - Startup XYZ, 9h-18h', amount: 320, time: 'Il y a 5h' },
      { type: 'reservation', title: 'Reservation modifiee', description: 'Studio B - Lucas Moreau, 15h-18h', amount: 135, time: 'Il y a 6h' },
      { type: 'client', title: 'Nouveau client', description: 'Emma Leroy recommandee par Marie Laurent', time: 'Hier' },
      { type: 'paiement', title: 'Paiement recu', description: 'Facture #2024-0145 - Pierre Durand', amount: 210, time: 'Hier' },
      { type: 'annulation', title: 'Annulation', description: 'Espace coworking - Freelance Co, journee', amount: -65, time: 'Il y a 2j' },
    ],
  },
  '90d': {
    kpis: [
      { key: 'revenue', label: 'Revenu total', value: '35 890 \u20ac', rawValue: 35890, change: 18.2, icon: DollarSign, color: 'var(--state-success)' },
      { key: 'occupation', label: "Taux d'occupation", value: '81%', rawValue: 81, change: 7.5, icon: Percent, color: 'var(--state-info)', suffix: '%' },
      { key: 'bookings', label: 'Reservations', value: '423', rawValue: 423, change: 14.1, icon: CalendarCheck, color: 'var(--accent-primary)' },
      { key: 'basket', label: 'Panier moyen', value: '85 \u20ac', rawValue: 85, change: 6.2, icon: ShoppingCart, color: 'var(--state-warning)' },
      { key: 'new_clients', label: 'Nouveaux clients', value: '72', rawValue: 72, change: 28.6, icon: UserPlus, color: 'var(--state-info)' },
      { key: 'cancel', label: "Taux d'annulation", value: '3.2%', rawValue: 3.2, change: -2.1, icon: XCircle, color: 'var(--state-error)', suffix: '%' },
    ],
    monthlyRevenue: [
      { month: 'Jan', value: 10100 }, { month: 'Fev', value: 11500 }, { month: 'Mar', value: 12800 },
      { month: 'Avr', value: 11400 }, { month: 'Mai', value: 13200 }, { month: 'Juin', value: 14800 },
      { month: 'Juil', value: 13100 }, { month: 'Aou', value: 10300 }, { month: 'Sep', value: 15700 },
      { month: 'Oct', value: 16400 }, { month: 'Nov', value: 14900 }, { month: 'Dec', value: 17800 },
    ],
    spaces: [
      { name: 'Studio A', percentage: 30, color: 'var(--accent-primary)' },
      { name: 'Studio B', percentage: 27, color: 'var(--state-info)' },
      { name: 'Salle de reunion', percentage: 23, color: 'var(--state-success)' },
      { name: 'Espace coworking', percentage: 13, color: 'var(--state-warning)' },
      { name: 'Terrasse', percentage: 7, color: 'var(--state-error)' },
    ],
    weeklyBookings: [
      { label: 'S1', value: 28 }, { label: 'S2', value: 32 }, { label: 'S3', value: 35 },
      { label: 'S4', value: 30 }, { label: 'S5', value: 38 }, { label: 'S6', value: 42 },
      { label: 'S7', value: 36 }, { label: 'S8', value: 45 }, { label: 'S9', value: 40 },
      { label: 'S10', value: 37 }, { label: 'S11', value: 34 }, { label: 'S12', value: 44 },
    ],
    topClients: [
      { name: 'Marie Laurent', revenue: 5200 },
      { name: 'Jean Dupont', revenue: 4800 },
      { name: 'Sophie Martin', revenue: 3950 },
      { name: 'Pierre Durand', revenue: 3400 },
      { name: 'Claire Petit', revenue: 2900 },
    ],
    activities: [
      { type: 'reservation', title: 'Nouvelle reservation', description: 'Studio A - Marie Laurent, 14h-17h', amount: 180, time: 'Il y a 25 min' },
      { type: 'paiement', title: 'Paiement recu', description: 'Facture #2024-0147 - Jean Dupont', amount: 150, time: 'Il y a 1h' },
      { type: 'client', title: 'Nouveau client', description: 'Thomas Bernard inscrit via le site web', time: 'Il y a 2h' },
      { type: 'annulation', title: 'Annulation', description: 'Studio B - Claire Petit, 10h-12h', amount: -90, time: 'Il y a 3h' },
      { type: 'paiement', title: 'Paiement recu', description: 'Pack 10 seances - Sophie Martin', amount: 450, time: 'Il y a 4h' },
      { type: 'reservation', title: 'Nouvelle reservation', description: 'Salle de reunion - Startup XYZ, 9h-18h', amount: 320, time: 'Il y a 5h' },
      { type: 'reservation', title: 'Reservation modifiee', description: 'Studio B - Lucas Moreau, 15h-18h', amount: 135, time: 'Il y a 6h' },
      { type: 'client', title: 'Nouveau client', description: 'Emma Leroy recommandee par Marie Laurent', time: 'Hier' },
      { type: 'paiement', title: 'Paiement recu', description: 'Facture #2024-0145 - Pierre Durand', amount: 210, time: 'Hier' },
      { type: 'annulation', title: 'Annulation', description: 'Espace coworking - Freelance Co, journee', amount: -65, time: 'Il y a 2j' },
    ],
  },
  '12m': {
    kpis: [
      { key: 'revenue', label: 'Revenu total', value: '148 200 \u20ac', rawValue: 148200, change: 25.4, icon: DollarSign, color: 'var(--state-success)' },
      { key: 'occupation', label: "Taux d'occupation", value: '84%', rawValue: 84, change: 9.2, icon: Percent, color: 'var(--state-info)', suffix: '%' },
      { key: 'bookings', label: 'Reservations', value: '1 842', rawValue: 1842, change: 20.5, icon: CalendarCheck, color: 'var(--accent-primary)' },
      { key: 'basket', label: 'Panier moyen', value: '80 \u20ac', rawValue: 80, change: 4.8, icon: ShoppingCart, color: 'var(--state-warning)' },
      { key: 'new_clients', label: 'Nouveaux clients', value: '312', rawValue: 312, change: 35.2, icon: UserPlus, color: 'var(--state-info)' },
      { key: 'cancel', label: "Taux d'annulation", value: '2.9%', rawValue: 2.9, change: -3.4, icon: XCircle, color: 'var(--state-error)', suffix: '%' },
    ],
    monthlyRevenue: [
      { month: 'Jan', value: 10800 }, { month: 'Fev', value: 11900 }, { month: 'Mar', value: 13500 },
      { month: 'Avr', value: 12100 }, { month: 'Mai', value: 13800 }, { month: 'Juin', value: 15600 },
      { month: 'Juil', value: 13700 }, { month: 'Aou', value: 10900 }, { month: 'Sep', value: 16200 },
      { month: 'Oct', value: 17100 }, { month: 'Nov', value: 15500 }, { month: 'Dec', value: 18200 },
    ],
    spaces: [
      { name: 'Studio A', percentage: 33, color: 'var(--accent-primary)' },
      { name: 'Studio B', percentage: 25, color: 'var(--state-info)' },
      { name: 'Salle de reunion', percentage: 21, color: 'var(--state-success)' },
      { name: 'Espace coworking', percentage: 15, color: 'var(--state-warning)' },
      { name: 'Terrasse', percentage: 6, color: 'var(--state-error)' },
    ],
    weeklyBookings: [
      { label: 'S1', value: 120 }, { label: 'S2', value: 135 }, { label: 'S3', value: 148 },
      { label: 'S4', value: 128 }, { label: 'S5', value: 155 }, { label: 'S6', value: 170 },
      { label: 'S7', value: 145 }, { label: 'S8', value: 185 }, { label: 'S9', value: 165 },
      { label: 'S10', value: 158 }, { label: 'S11', value: 140 }, { label: 'S12', value: 178 },
    ],
    topClients: [
      { name: 'Marie Laurent', revenue: 18500 },
      { name: 'Jean Dupont', revenue: 16200 },
      { name: 'Sophie Martin', revenue: 13400 },
      { name: 'Pierre Durand', revenue: 11800 },
      { name: 'Claire Petit', revenue: 9800 },
    ],
    activities: [
      { type: 'reservation', title: 'Nouvelle reservation', description: 'Studio A - Marie Laurent, 14h-17h', amount: 180, time: 'Il y a 25 min' },
      { type: 'paiement', title: 'Paiement recu', description: 'Facture #2024-0147 - Jean Dupont', amount: 150, time: 'Il y a 1h' },
      { type: 'client', title: 'Nouveau client', description: 'Thomas Bernard inscrit via le site web', time: 'Il y a 2h' },
      { type: 'annulation', title: 'Annulation', description: 'Studio B - Claire Petit, 10h-12h', amount: -90, time: 'Il y a 3h' },
      { type: 'paiement', title: 'Paiement recu', description: 'Pack 10 seances - Sophie Martin', amount: 450, time: 'Il y a 4h' },
      { type: 'reservation', title: 'Nouvelle reservation', description: 'Salle de reunion - Startup XYZ, 9h-18h', amount: 320, time: 'Il y a 5h' },
      { type: 'reservation', title: 'Reservation modifiee', description: 'Studio B - Lucas Moreau, 15h-18h', amount: 135, time: 'Il y a 6h' },
      { type: 'client', title: 'Nouveau client', description: 'Emma Leroy recommandee par Marie Laurent', time: 'Hier' },
      { type: 'paiement', title: 'Paiement recu', description: 'Facture #2024-0145 - Pierre Durand', amount: 210, time: 'Hier' },
      { type: 'annulation', title: 'Annulation', description: 'Espace coworking - Freelance Co, journee', amount: -65, time: 'Il y a 2j' },
    ],
  },
};

// ─── Helpers ────────────────────────────────────────────

function formatEur(value: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}

function buildConicGradient(spaces: SpaceData[]): string {
  let accumulated = 0;
  const stops: string[] = [];
  for (const space of spaces) {
    const start = accumulated;
    accumulated += space.percentage;
    stops.push(`${space.color} ${start}% ${accumulated}%`);
  }
  return `conic-gradient(${stops.join(', ')})`;
}

function getActivityIcon(type: ActivityItem['type']) {
  switch (type) {
    case 'reservation': return CalendarCheck;
    case 'paiement': return CreditCard;
    case 'annulation': return XCircle;
    case 'client': return Users;
  }
}

function getActivityIconClass(type: ActivityItem['type']): string {
  switch (type) {
    case 'reservation': return styles.activityIconReservation;
    case 'paiement': return styles.activityIconPaiement;
    case 'annulation': return styles.activityIconAnnulation;
    case 'client': return styles.activityIconClient;
  }
}

// ─── Report Builder Helpers ─────────────────────────────

function generateMockData(metrics: MetricKey[], period: PeriodKey): GeneratedDataPoint[] {
  const periodLabels: Record<PeriodKey, string[]> = {
    semaine: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
    mois: ['S1', 'S2', 'S3', 'S4'],
    trimestre: ['Mois 1', 'Mois 2', 'Mois 3'],
    annee: ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec'],
    personnalise: ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'],
  };

  const labels = periodLabels[period];
  const baseValues: Record<MetricKey, { min: number; max: number }> = {
    revenus: { min: 2000, max: 18000 },
    reservations: { min: 10, max: 180 },
    occupation: { min: 40, max: 95 },
    clients: { min: 5, max: 60 },
    depenses: { min: 800, max: 6000 },
    roi: { min: 10, max: 45 },
  };

  // Use the first selected metric to generate values
  const primaryMetric = metrics[0];
  const range = baseValues[primaryMetric];

  return labels.map((label, i) => ({
    label,
    value: Math.round(range.min + Math.random() * (range.max - range.min)),
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));
}

function buildDonutConicGradient(data: GeneratedDataPoint[]): string {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let accumulated = 0;
  const stops: string[] = [];
  for (const point of data) {
    const start = accumulated;
    const pct = (point.value / total) * 100;
    accumulated += pct;
    stops.push(`${point.color} ${start}% ${accumulated}%`);
  }
  return `conic-gradient(${stops.join(', ')})`;
}

function loadSavedReports(): SavedReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedReport[];
  } catch {
    return [];
  }
}

function persistSavedReports(reports: SavedReport[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

function formatDateFR(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatMetricValue(value: number, metric: MetricKey): string {
  switch (metric) {
    case 'revenus':
    case 'depenses':
      return formatEur(value);
    case 'occupation':
    case 'roi':
      return `${value}%`;
    default:
      return new Intl.NumberFormat('fr-FR').format(value);
  }
}

// ─── Sub-Components ─────────────────────────────────────

function BarChartPreview({ data, metricKey }: { data: GeneratedDataPoint[]; metricKey: MetricKey }) {
  const maxVal = Math.max(...data.map((d) => d.value));

  return (
    <div className={styles.reportChartWrapper}>
      <div className={styles.builderBarChart}>
        {data.map((point, i) => (
          <div key={point.label} className={styles.builderBarColumn}>
            <div className={styles.builderBarWrapper}>
              <div
                className={styles.builderBar}
                style={{
                  height: `${(point.value / maxVal) * 100}%`,
                  backgroundColor: point.color,
                  animationDelay: `${i * 50}ms`,
                }}
                data-value={formatMetricValue(point.value, metricKey)}
              />
            </div>
            <span className={styles.builderBarLabel}>{point.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DonutChartPreview({ data, metricKey }: { data: GeneratedDataPoint[]; metricKey: MetricKey }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className={styles.reportChartWrapper}>
      <div className={styles.builderDonutContainer}>
        <div
          className={styles.builderDonut}
          style={{ background: buildDonutConicGradient(data) }}
        >
          <div className={styles.builderDonutHole}>
            <span className={styles.builderDonutTotal}>{formatMetricValue(total, metricKey)}</span>
            <span className={styles.builderDonutLabel}>Total</span>
          </div>
        </div>
        <div className={styles.builderDonutLegend}>
          {data.map((point) => (
            <div key={point.label} className={styles.builderDonutLegendItem}>
              <span
                className={styles.builderDonutLegendDot}
                style={{ backgroundColor: point.color }}
              />
              <span className={styles.builderDonutLegendName}>{point.label}</span>
              <span className={styles.builderDonutLegendValue}>
                {formatMetricValue(point.value, metricKey)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LineChartPreview({ data, metricKey }: { data: GeneratedDataPoint[]; metricKey: MetricKey }) {
  const maxVal = Math.max(...data.map((d) => d.value));

  return (
    <div className={styles.reportChartWrapper}>
      <div className={styles.builderLineChart}>
        {data.map((point) => {
          const heightPercent = (point.value / maxVal) * 100;
          return (
            <div key={point.label} className={styles.builderLineColumn}>
              <div
                className={styles.builderLineFill}
                style={{ height: `${heightPercent}%` }}
              />
              <div
                className={styles.builderLinePoint}
                style={{ bottom: `${heightPercent}%` }}
                data-value={formatMetricValue(point.value, metricKey)}
              />
            </div>
          );
        })}
      </div>
      <div className={styles.builderLineLabels}>
        {data.map((point) => (
          <span key={point.label} className={styles.builderLineLabel}>{point.label}</span>
        ))}
      </div>
    </div>
  );
}

function TableChartPreview({ data, metricKey, reportName }: { data: GeneratedDataPoint[]; metricKey: MetricKey; reportName: string }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className={styles.reportChartWrapper}>
      <table className={styles.builderTable}>
        <thead>
          <tr>
            <th>Periode</th>
            <th>{reportName}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((point) => (
            <tr key={point.label}>
              <td>{point.label}</td>
              <td>{formatMetricValue(point.value, metricKey)}</td>
            </tr>
          ))}
          <tr>
            <td><strong>Total</strong></td>
            <td><strong>{formatMetricValue(total, metricKey)}</strong></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function ReportVisualization({ report }: { report: GeneratedReport }) {
  const primaryMetric = report.metrics[0];

  switch (report.chartType) {
    case 'barres':
      return <BarChartPreview data={report.data} metricKey={primaryMetric} />;
    case 'donut':
      return <DonutChartPreview data={report.data} metricKey={primaryMetric} />;
    case 'ligne':
      return <LineChartPreview data={report.data} metricKey={primaryMetric} />;
    case 'tableau':
      return <TableChartPreview data={report.data} metricKey={primaryMetric} reportName={report.name} />;
  }
}

// ─── Component ──────────────────────────────────────────

export function Reports() {
  const [activeTab, setActiveTab] = useState<ReportsTab>('dashboard');
  const [period, setPeriod] = useState('30d');

  // ─── Builder State ─────────────────────────────────
  const [builderForm, setBuilderForm] = useState<BuilderFormState>({
    name: '',
    metrics: [],
    period: 'mois',
    chartType: 'barres',
  });
  const [generatedReport, setGeneratedReport] = useState<GeneratedReport | null>(null);

  // ─── Saved Reports State ───────────────────────────
  const [savedReports, setSavedReports] = useState<SavedReport[]>(() => loadSavedReports());
  const [loadedReport, setLoadedReport] = useState<GeneratedReport | null>(null);

  // ─── Dashboard Data ────────────────────────────────
  const data = useMemo(() => dataByPeriod[period] || dataByPeriod['30d'], [period]);

  const maxMonthlyRevenue = useMemo(
    () => Math.max(...data.monthlyRevenue.map((m) => m.value)),
    [data.monthlyRevenue]
  );

  const maxWeeklyBooking = useMemo(
    () => Math.max(...data.weeklyBookings.map((w) => w.value)),
    [data.weeklyBookings]
  );

  const maxClientRevenue = useMemo(
    () => Math.max(...data.topClients.map((c) => c.revenue)),
    [data.topClients]
  );

  const totalSpaceBookings = useMemo(
    () => data.spaces.reduce((sum, s) => sum + s.percentage, 0),
    [data.spaces]
  );

  // ─── Notifications ──────────────────────────────────
  const { success: notifySuccess, error: notifyError, warning: notifyWarning } = useNotifications();

  // ─── Export Data ───────────────────────────────────
  const exportData: ReportExportData = useMemo(() => ({
    kpis: data.kpis.map((k) => ({ label: k.label, value: k.value, change: k.change })),
    monthlyRevenue: data.monthlyRevenue,
    spaces: data.spaces.map((s) => ({ name: s.name, percentage: s.percentage })),
    weeklyBookings: data.weeklyBookings,
    topClients: data.topClients,
    activities: data.activities.map((a) => ({
      type: a.type,
      title: a.title,
      description: a.description,
      amount: a.amount,
      time: a.time,
    })),
  }), [data]);

  // ─── Export Handlers ──────────────────────────────
  const handleExportCSV = useCallback(() => {
    exportCSV(exportData, period);
    notifySuccess('Export CSV', 'Le rapport a ete telecharge au format CSV.');
  }, [exportData, period, notifySuccess]);

  const handleExportPDF = useCallback(() => {
    exportPDF(exportData, period);
    notifySuccess('Export PDF', 'Le rapport a ete envoye a l\'impression.');
  }, [exportData, period, notifySuccess]);

  // ─── Builder Handlers ─────────────────────────────
  const handleMetricToggle = useCallback((metric: MetricKey) => {
    setBuilderForm((prev) => ({
      ...prev,
      metrics: prev.metrics.includes(metric)
        ? prev.metrics.filter((m) => m !== metric)
        : [...prev.metrics, metric],
    }));
  }, []);

  const handleGenerateReport = useCallback(() => {
    if (!builderForm.name.trim()) {
      notifyWarning('Nom requis', 'Veuillez saisir un nom pour le rapport.');
      return;
    }
    if (builderForm.metrics.length === 0) {
      notifyWarning('Metriques requises', 'Veuillez selectionner au moins une metrique.');
      return;
    }

    const mockData = generateMockData(builderForm.metrics, builderForm.period);
    const report: GeneratedReport = {
      name: builderForm.name,
      metrics: builderForm.metrics,
      period: builderForm.period,
      chartType: builderForm.chartType,
      data: mockData,
    };
    setGeneratedReport(report);
    notifySuccess('Rapport genere', `Le rapport "${builderForm.name}" a ete genere avec succes.`);
  }, [builderForm, notifySuccess, notifyWarning]);

  const handleSaveReport = useCallback(() => {
    if (!generatedReport) return;

    const newSaved: SavedReport = {
      id: crypto.randomUUID(),
      name: generatedReport.name,
      metrics: generatedReport.metrics,
      period: generatedReport.period,
      chartType: generatedReport.chartType,
      data: generatedReport.data,
      createdAt: new Date().toISOString(),
    };

    const updated = [newSaved, ...savedReports];
    setSavedReports(updated);
    persistSavedReports(updated);
    notifySuccess('Rapport sauvegarde', `Le rapport "${generatedReport.name}" a ete sauvegarde.`);
  }, [generatedReport, savedReports, notifySuccess]);

  const handleLoadReport = useCallback((report: SavedReport) => {
    const loaded: GeneratedReport = {
      name: report.name,
      metrics: report.metrics,
      period: report.period,
      chartType: report.chartType,
      data: report.data,
    };
    setLoadedReport(loaded);
    notifySuccess('Rapport charge', `Le rapport "${report.name}" a ete charge.`);
  }, [notifySuccess]);

  const handleDeleteReport = useCallback((id: string) => {
    const updated = savedReports.filter((r) => r.id !== id);
    setSavedReports(updated);
    persistSavedReports(updated);
    if (loadedReport) {
      const deletedReport = savedReports.find((r) => r.id === id);
      if (deletedReport && deletedReport.name === loadedReport.name) {
        setLoadedReport(null);
      }
    }
    notifyError('Rapport supprime', 'Le rapport a ete supprime.');
  }, [savedReports, loadedReport, notifyError]);

  // ─── Render ─────────────────────────────────────────

  return (
    <div className={styles.page}>
      <Header
        title="Rapports"
        subtitle="Analysez les performances de votre activite"
      />

      <div className={styles.content}>
        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'dashboard' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'builder' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('builder')}
          >
            Report Builder
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'saved' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('saved')}
          >
            Mes Rapports
          </button>
        </div>

        {/* ═══════════════════════════════════════════
            TAB: Dashboard (original content)
            ═══════════════════════════════════════════ */}
        {activeTab === 'dashboard' && (
          <>
            {/* Toolbar */}
            <div className={styles.toolbar}>
              <Select
                options={periodOptions}
                value={period}
                onChange={setPeriod}
              />
              <div className={styles.toolbarActions}>
                <Dropdown
                  trigger={
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Download size={16} />}
                    >
                      Exporter
                    </Button>
                  }
                  align="end"
                  label="Options d'export"
                >
                  <DropdownLabel>Format d'export</DropdownLabel>
                  <DropdownItem
                    icon={<FileSpreadsheet size={16} />}
                    onClick={handleExportCSV}
                  >
                    Exporter en CSV
                  </DropdownItem>
                  <DropdownItem
                    icon={<FileText size={16} />}
                    onClick={handleExportPDF}
                  >
                    Imprimer / PDF
                  </DropdownItem>
                </Dropdown>
              </div>
            </div>

            {/* KPI Stats - 6 cards */}
            <div className={styles.statsGrid}>
              {data.kpis.map((kpi, index) => {
                const isPositive = kpi.change >= 0;
                const isGood = kpi.key === 'cancel' ? !isPositive : isPositive;

                return (
                  <div
                    key={kpi.key}
                    className={styles.animateIn}
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    <Card padding="md" className={styles.statCard}>
                      <div className={styles.statHeader}>
                        <span className={styles.statLabel}>{kpi.label}</span>
                        <div
                          className={styles.statIcon}
                          style={{ backgroundColor: `color-mix(in srgb, ${kpi.color} 12%, transparent)` }}
                        >
                          <kpi.icon size={16} style={{ color: kpi.color }} />
                        </div>
                      </div>
                      <span className={styles.statValue}>{kpi.value}</span>
                      <span className={`${styles.statTrend} ${isGood ? styles.trendUp : styles.trendDown}`}>
                        {isGood ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {isPositive ? '+' : ''}{kpi.change}%
                      </span>
                    </Card>
                  </div>
                );
              })}
            </div>

            {/* Charts Row 1: Bar Chart + Donut Chart */}
            <div className={styles.chartsGrid}>
              <div className={styles.animateIn} style={{ animationDelay: '200ms' }}>
                <Card padding="lg" className={styles.chartCard}>
                  <div className={styles.chartHeader}>
                    <h3 className={styles.chartTitle}>Revenus par mois</h3>
                    <span className={styles.chartSubtitle}>Annuel</span>
                  </div>
                  <div className={styles.barChart}>
                    {data.monthlyRevenue.map((m, i) => (
                      <div key={m.month} className={styles.barChartColumn}>
                        <div className={styles.barChartBarWrapper}>
                          <div
                            className={styles.barChartBar}
                            style={{
                              height: `${(m.value / maxMonthlyRevenue) * 100}%`,
                              animationDelay: `${i * 50}ms`,
                            }}
                            data-value={formatEur(m.value)}
                          />
                        </div>
                        <span className={styles.barChartLabel}>{m.month}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              <div className={styles.animateIn} style={{ animationDelay: '300ms' }}>
                <Card padding="lg" className={styles.chartCard}>
                  <div className={styles.chartHeader}>
                    <h3 className={styles.chartTitle}>Repartition par espace</h3>
                    <span className={styles.chartSubtitle}>Reservations</span>
                  </div>
                  <div className={styles.donutChartContainer}>
                    <div
                      className={styles.donutChart}
                      style={{ background: buildConicGradient(data.spaces) }}
                    >
                      <div className={styles.donutChartHole}>
                        <span className={styles.donutChartTotal}>{totalSpaceBookings}%</span>
                        <span className={styles.donutChartTotalLabel}>Total</span>
                      </div>
                    </div>
                    <div className={styles.donutLegend}>
                      {data.spaces.map((space) => (
                        <div key={space.name} className={styles.donutLegendItem}>
                          <span
                            className={styles.donutLegendDot}
                            style={{ backgroundColor: space.color }}
                          />
                          <span className={styles.donutLegendLabel}>{space.name}</span>
                          <span className={styles.donutLegendValue}>{space.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Charts Row 2: Area Chart + Horizontal Bar Chart */}
            <div className={styles.chartsGrid}>
              <div className={styles.animateIn} style={{ animationDelay: '400ms' }}>
                <Card padding="lg" className={styles.chartCard}>
                  <div className={styles.chartHeader}>
                    <h3 className={styles.chartTitle}>Tendance reservations</h3>
                    <span className={styles.chartSubtitle}>Par semaine</span>
                  </div>
                  <div className={styles.areaChart}>
                    {data.weeklyBookings.map((w) => {
                      const heightPercent = (w.value / maxWeeklyBooking) * 100;
                      return (
                        <div key={w.label} className={styles.areaChartColumn}>
                          <div
                            className={styles.areaChartFill}
                            style={{ height: `${heightPercent}%` }}
                          />
                          <div
                            className={styles.areaChartPoint}
                            style={{ bottom: `${heightPercent}%` }}
                            data-value={`${w.value} reservations`}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className={styles.areaChartLabels}>
                    {data.weeklyBookings.map((w) => (
                      <span key={w.label} className={styles.areaChartLabel}>{w.label}</span>
                    ))}
                  </div>
                </Card>
              </div>

              <div className={styles.animateIn} style={{ animationDelay: '500ms' }}>
                <Card padding="lg" className={styles.chartCard}>
                  <div className={styles.chartHeader}>
                    <h3 className={styles.chartTitle}>Top 5 clients</h3>
                    <span className={styles.chartSubtitle}>Par revenu</span>
                  </div>
                  <div className={styles.horizontalBars}>
                    {data.topClients.map((client, i) => (
                      <div key={client.name} className={styles.horizontalBarRow}>
                        <div className={styles.horizontalBarHeader}>
                          <span className={styles.horizontalBarLabel}>{client.name}</span>
                          <span className={styles.horizontalBarValue}>{formatEur(client.revenue)}</span>
                        </div>
                        <div className={styles.horizontalBarTrack}>
                          <div
                            className={styles.horizontalBarFill}
                            style={{
                              width: `${(client.revenue / maxClientRevenue) * 100}%`,
                              opacity: 1 - (i * 0.12),
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>

            {/* Activity Table */}
            <div className={styles.animateIn} style={{ animationDelay: '600ms' }}>
              <Card padding="lg">
                <div className={styles.chartHeader}>
                  <h3 className={styles.chartTitle}>Activite recente</h3>
                  <span className={styles.chartSubtitle}>{data.activities.length} evenements</span>
                </div>
                <div className={styles.activityList}>
                  {data.activities.map((activity, index) => {
                    const IconComponent = getActivityIcon(activity.type);
                    const iconClass = getActivityIconClass(activity.type);

                    return (
                      <div key={`${activity.type}-${index}`} className={styles.activityItem}>
                        <div className={`${styles.activityIcon} ${iconClass}`}>
                          <IconComponent size={16} />
                        </div>
                        <div className={styles.activityContent}>
                          <span className={styles.activityTitle}>{activity.title}</span>
                          <span className={styles.activityDescription}>{activity.description}</span>
                        </div>
                        <div className={styles.activityMeta}>
                          {activity.amount !== undefined && (
                            <span className={`${styles.activityAmount} ${activity.amount < 0 ? styles.activityAmountNegative : ''}`}>
                              {activity.amount >= 0 ? '+' : ''}{formatEur(activity.amount)}
                            </span>
                          )}
                          <span className={styles.activityTime}>{activity.time}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          </>
        )}

        {/* ═══════════════════════════════════════════
            TAB: Report Builder
            ═══════════════════════════════════════════ */}
        {activeTab === 'builder' && (
          <>
            <div className={styles.animateIn}>
              <Card padding="lg">
                <div className={styles.chartHeader}>
                  <h3 className={styles.chartTitle}>Creer un rapport personnalise</h3>
                  <span className={styles.chartSubtitle}>Configuration</span>
                </div>

                <div className={styles.builderForm}>
                  {/* Left Column */}
                  <div className={styles.formSection}>
                    {/* Report Name */}
                    <div className={styles.formGroup}>
                      <Input
                        label="Nom du rapport"
                        placeholder="Ex: Revenus mensuels Q1"
                        value={builderForm.name}
                        onChange={(e) =>
                          setBuilderForm((prev) => ({ ...prev, name: e.target.value }))
                        }
                        fullWidth
                      />
                    </div>

                    {/* Metrics Selection */}
                    <div className={styles.formGroup}>
                      <span className={styles.formLabel}>Metriques</span>
                      <div className={styles.checkboxGrid}>
                        {METRIC_OPTIONS.map((metric) => {
                          const isChecked = builderForm.metrics.includes(metric.key);
                          return (
                            <label
                              key={metric.key}
                              className={`${styles.checkboxLabel} ${isChecked ? styles.checkboxLabelChecked : ''}`}
                            >
                              <input
                                type="checkbox"
                                className={styles.checkboxInput}
                                checked={isChecked}
                                onChange={() => handleMetricToggle(metric.key)}
                              />
                              {metric.label}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className={styles.formSection}>
                    {/* Period Selection */}
                    <div className={styles.formGroup}>
                      <Select
                        label="Periode"
                        options={PERIOD_OPTIONS}
                        value={builderForm.period}
                        onChange={(val) =>
                          setBuilderForm((prev) => ({ ...prev, period: val as PeriodKey }))
                        }
                        fullWidth
                      />
                    </div>

                    {/* Chart Type Selection */}
                    <div className={styles.formGroup}>
                      <span className={styles.formLabel}>Type de visualisation</span>
                      <div className={styles.radioGroup}>
                        {CHART_OPTIONS.map((option) => {
                          const isSelected = builderForm.chartType === option.value;
                          const IconComp = option.icon;
                          return (
                            <label
                              key={option.value}
                              className={`${styles.radioLabel} ${isSelected ? styles.radioLabelChecked : ''}`}
                            >
                              <input
                                type="radio"
                                name="chartType"
                                className={styles.radioInput}
                                checked={isSelected}
                                onChange={() =>
                                  setBuilderForm((prev) => ({ ...prev, chartType: option.value }))
                                }
                              />
                              <IconComp size={16} />
                              {option.label}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Generate Button */}
                <div className={styles.builderActions}>
                  <Button
                    variant="primary"
                    icon={<Play size={16} />}
                    onClick={handleGenerateReport}
                  >
                    Generer le rapport
                  </Button>
                </div>
              </Card>
            </div>

            {/* Generated Report Preview */}
            {generatedReport && (
              <div className={styles.generatedReport}>
                <div className={styles.animateIn}>
                  <Card padding="lg">
                    <div className={styles.reportPreviewHeader}>
                      <h3 className={styles.reportPreviewTitle}>{generatedReport.name}</h3>
                      <div className={styles.reportPreviewActions}>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<Save size={16} />}
                          onClick={handleSaveReport}
                        >
                          Sauvegarder
                        </Button>
                      </div>
                    </div>
                    <ReportVisualization report={generatedReport} />
                  </Card>
                </div>
              </div>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════
            TAB: Mes Rapports (Saved Reports)
            ═══════════════════════════════════════════ */}
        {activeTab === 'saved' && (
          <>
            <div className={styles.animateIn}>
              {savedReports.length === 0 ? (
                <Card padding="lg">
                  <div className={styles.emptyState}>
                    <div className={styles.emptyStateIcon}>
                      <FolderOpen size={24} />
                    </div>
                    <h3 className={styles.emptyStateTitle}>Aucun rapport sauvegarde</h3>
                    <p className={styles.emptyStateDescription}>
                      Creez un rapport personnalise dans l'onglet Report Builder puis sauvegardez-le pour le retrouver ici.
                    </p>
                    <div style={{ marginTop: 'var(--space-4)' }}>
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<Plus size={16} />}
                        onClick={() => setActiveTab('builder')}
                      >
                        Creer un rapport
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card padding="lg">
                  <div className={styles.chartHeader}>
                    <h3 className={styles.chartTitle}>Rapports sauvegardes</h3>
                    <span className={styles.chartSubtitle}>
                      {savedReports.length} rapport{savedReports.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className={styles.savedReportsList}>
                    {savedReports.map((report) => (
                      <div key={report.id} className={styles.savedReportItem}>
                        <div className={styles.savedReportIcon}>
                          {report.chartType === 'barres' && <BarChart3 size={20} />}
                          {report.chartType === 'donut' && <PieChart size={20} />}
                          {report.chartType === 'ligne' && <LineChart size={20} />}
                          {report.chartType === 'tableau' && <Table size={20} />}
                        </div>
                        <div className={styles.savedReportInfo}>
                          <div className={styles.savedReportName}>{report.name}</div>
                          <div className={styles.savedReportMeta}>
                            <span className={styles.savedReportDate}>
                              {formatDateFR(report.createdAt)}
                            </span>
                            <div className={styles.savedReportMetrics}>
                              {report.metrics.map((m) => (
                                <span key={m} className={styles.savedReportBadge}>
                                  {METRIC_LABELS[m]}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className={styles.savedReportActions}>
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={<Play size={14} />}
                            onClick={() => handleLoadReport(report)}
                          >
                            Charger
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Trash2 size={14} />}
                            onClick={() => handleDeleteReport(report.id)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {/* Loaded Report Visualization */}
            {loadedReport && (
              <div className={styles.generatedReport}>
                <div className={styles.animateIn}>
                  <Card padding="lg">
                    <div className={styles.reportPreviewHeader}>
                      <h3 className={styles.reportPreviewTitle}>{loadedReport.name}</h3>
                      <span className={styles.chartSubtitle}>Apercu</span>
                    </div>
                    <ReportVisualization report={loadedReport} />
                  </Card>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
