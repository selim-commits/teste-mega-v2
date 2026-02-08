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
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
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

// ─── Period Options ─────────────────────────────────────

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

// ─── Component ──────────────────────────────────────────

export function Reports() {
  const [period, setPeriod] = useState('30d');

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

  const { success: notifySuccess } = useNotifications();

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

  // ─── Render ─────────────────────────────────────────

  return (
    <div className={styles.page}>
      <Header
        title="Rapports"
        subtitle="Analysez les performances de votre activite"
      />

      <div className={styles.content}>
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
            // For cancel rate, down is good
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
          {/* Bar Chart - Revenus par mois */}
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

          {/* Donut Chart - Repartition par espace */}
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
          {/* Area Chart - Tendance reservations */}
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

          {/* Horizontal Bar Chart - Top 5 clients */}
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
      </div>
    </div>
  );
}
