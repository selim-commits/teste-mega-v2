import { useState, useMemo, useCallback } from 'react';
import {
  Building2,
  TrendingUp,
  TrendingDown,
  PieChart,
  Wallet,
  FileText,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Send,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { useNotifications } from '../stores/uiStore';
import { formatCurrency } from '../lib/utils';
import { cn } from '../lib/utils';
import styles from './OwnerPortal.module.css';

// ===== Types =====

type TabId = 'dashboard' | 'revenus' | 'depenses' | 'releves';

interface Space {
  id: string;
  name: string;
  type: string;
  monthlyData: MonthlyData[];
  occupancyRate: number;
  roi: number;
}

interface MonthlyData {
  month: string;
  monthIndex: number;
  revenue: number;
  expenses: number;
  occupancy: number;
}

interface ExpenseCategory {
  category: string;
  amount: number;
  percentage: number;
}

interface Payout {
  id: string;
  date: string;
  reference: string;
  amount: number;
  status: 'paid' | 'pending';
  spaces: string[];
}

interface ManagerMessage {
  id: string;
  sender: string;
  initials: string;
  text: string;
  date: string;
}

// ===== Mock Data =====

const MONTHS_LABELS = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Fev'];

function generateMockSpaces(): Space[] {
  return [
    {
      id: crypto.randomUUID(),
      name: 'Studio A - Lumiere',
      type: 'Studio photo',
      occupancyRate: 78,
      roi: 14.2,
      monthlyData: [
        { month: 'Sep', monthIndex: 0, revenue: 8200, expenses: 3100, occupancy: 72 },
        { month: 'Oct', monthIndex: 1, revenue: 9100, expenses: 3200, occupancy: 76 },
        { month: 'Nov', monthIndex: 2, revenue: 8800, expenses: 3050, occupancy: 74 },
        { month: 'Dec', monthIndex: 3, revenue: 10500, expenses: 3400, occupancy: 82 },
        { month: 'Jan', monthIndex: 4, revenue: 7600, expenses: 2900, occupancy: 68 },
        { month: 'Fev', monthIndex: 5, revenue: 9800, expenses: 3150, occupancy: 80 },
      ],
    },
    {
      id: crypto.randomUUID(),
      name: 'Studio B - Obscura',
      type: 'Studio video',
      occupancyRate: 65,
      roi: 11.8,
      monthlyData: [
        { month: 'Sep', monthIndex: 0, revenue: 6800, expenses: 2800, occupancy: 60 },
        { month: 'Oct', monthIndex: 1, revenue: 7200, expenses: 2900, occupancy: 64 },
        { month: 'Nov', monthIndex: 2, revenue: 7500, expenses: 2850, occupancy: 66 },
        { month: 'Dec', monthIndex: 3, revenue: 8900, expenses: 3100, occupancy: 72 },
        { month: 'Jan', monthIndex: 4, revenue: 6200, expenses: 2700, occupancy: 58 },
        { month: 'Fev', monthIndex: 5, revenue: 7800, expenses: 2950, occupancy: 68 },
      ],
    },
    {
      id: crypto.randomUUID(),
      name: 'Salle C - Grand Angle',
      type: 'Salle evenementielle',
      occupancyRate: 52,
      roi: 9.5,
      monthlyData: [
        { month: 'Sep', monthIndex: 0, revenue: 5200, expenses: 2400, occupancy: 48 },
        { month: 'Oct', monthIndex: 1, revenue: 5800, expenses: 2500, occupancy: 52 },
        { month: 'Nov', monthIndex: 2, revenue: 6100, expenses: 2450, occupancy: 54 },
        { month: 'Dec', monthIndex: 3, revenue: 7200, expenses: 2700, occupancy: 60 },
        { month: 'Jan', monthIndex: 4, revenue: 4800, expenses: 2300, occupancy: 44 },
        { month: 'Fev', monthIndex: 5, revenue: 5600, expenses: 2350, occupancy: 52 },
      ],
    },
    {
      id: crypto.randomUUID(),
      name: 'Studio D - Micro',
      type: 'Studio podcast',
      occupancyRate: 85,
      roi: 18.3,
      monthlyData: [
        { month: 'Sep', monthIndex: 0, revenue: 3200, expenses: 1100, occupancy: 80 },
        { month: 'Oct', monthIndex: 1, revenue: 3500, expenses: 1150, occupancy: 84 },
        { month: 'Nov', monthIndex: 2, revenue: 3400, expenses: 1100, occupancy: 82 },
        { month: 'Dec', monthIndex: 3, revenue: 3800, expenses: 1200, occupancy: 88 },
        { month: 'Jan', monthIndex: 4, revenue: 3100, expenses: 1050, occupancy: 78 },
        { month: 'Fev', monthIndex: 5, revenue: 3600, expenses: 1100, occupancy: 86 },
      ],
    },
  ];
}

function generateMockPayouts(): Payout[] {
  return [
    {
      id: crypto.randomUUID(),
      date: '2026-02-01',
      reference: 'PAY-2026-02-001',
      amount: 18240,
      status: 'paid',
      spaces: ['Studio A', 'Studio B', 'Salle C', 'Studio D'],
    },
    {
      id: crypto.randomUUID(),
      date: '2026-01-01',
      reference: 'PAY-2026-01-001',
      amount: 14520,
      status: 'paid',
      spaces: ['Studio A', 'Studio B', 'Salle C', 'Studio D'],
    },
    {
      id: crypto.randomUUID(),
      date: '2025-12-01',
      reference: 'PAY-2025-12-001',
      amount: 21340,
      status: 'paid',
      spaces: ['Studio A', 'Studio B', 'Salle C', 'Studio D'],
    },
    {
      id: crypto.randomUUID(),
      date: '2025-11-01',
      reference: 'PAY-2025-11-001',
      amount: 18650,
      status: 'paid',
      spaces: ['Studio A', 'Studio B', 'Salle C', 'Studio D'],
    },
    {
      id: crypto.randomUUID(),
      date: '2025-10-01',
      reference: 'PAY-2025-10-001',
      amount: 17980,
      status: 'paid',
      spaces: ['Studio A', 'Studio B', 'Salle C', 'Studio D'],
    },
    {
      id: crypto.randomUUID(),
      date: '2025-09-01',
      reference: 'PAY-2025-09-001',
      amount: 15820,
      status: 'paid',
      spaces: ['Studio A', 'Studio B', 'Salle C', 'Studio D'],
    },
  ];
}

function generateMockMessages(): ManagerMessage[] {
  return [
    {
      id: crypto.randomUUID(),
      sender: 'Marie Dupont',
      initials: 'MD',
      text: 'Le taux d\'occupation du Studio A a augmente de 5% ce mois-ci grace aux nouvelles campagnes marketing. Nous envisageons d\'etendre cette strategie aux autres espaces.',
      date: '2026-02-07',
    },
    {
      id: crypto.randomUUID(),
      sender: 'Marie Dupont',
      initials: 'MD',
      text: 'Maintenance prevue pour le Studio B la semaine prochaine : remplacement de l\'eclairage LED. Budget estime : 1 200 EUR.',
      date: '2026-02-03',
    },
    {
      id: crypto.randomUUID(),
      sender: 'Marie Dupont',
      initials: 'MD',
      text: 'Bilan de janvier : revenus en baisse saisonniere comme prevu. Les reservations pour mars sont deja en forte hausse (+22%).',
      date: '2026-01-28',
    },
  ];
}

// ===== Component =====

export function OwnerPortal() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const { success: showSuccess } = useNotifications();

  // Mock data (stable references via useMemo)
  const spaces = useMemo(() => generateMockSpaces(), []);
  const payouts = useMemo(() => generateMockPayouts(), []);
  const messages = useMemo(() => generateMockMessages(), []);

  // Selected space or all
  const selectedSpace = useMemo(
    () => (selectedSpaceId ? spaces.find((s) => s.id === selectedSpaceId) : null),
    [spaces, selectedSpaceId]
  );

  // Aggregated stats
  const stats = useMemo(() => {
    const targetSpaces = selectedSpace ? [selectedSpace] : spaces;
    const totalRevenue6m = targetSpaces.reduce(
      (sum, s) => sum + s.monthlyData.reduce((ms, m) => ms + m.revenue, 0),
      0
    );
    const totalExpenses6m = targetSpaces.reduce(
      (sum, s) => sum + s.monthlyData.reduce((ms, m) => ms + m.expenses, 0),
      0
    );
    const currentMonthRevenue = targetSpaces.reduce(
      (sum, s) => sum + s.monthlyData[5].revenue,
      0
    );
    const prevMonthRevenue = targetSpaces.reduce(
      (sum, s) => sum + s.monthlyData[4].revenue,
      0
    );
    const avgOccupancy =
      targetSpaces.reduce((sum, s) => sum + s.occupancyRate, 0) / targetSpaces.length;
    const avgRoi =
      targetSpaces.reduce((sum, s) => sum + s.roi, 0) / targetSpaces.length;
    const monthChange =
      prevMonthRevenue > 0
        ? ((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100
        : 0;

    return {
      totalRevenue6m,
      totalExpenses6m,
      netIncome6m: totalRevenue6m - totalExpenses6m,
      currentMonthRevenue,
      prevMonthRevenue,
      monthChange,
      avgOccupancy: Math.round(avgOccupancy),
      avgRoi: Math.round(avgRoi * 10) / 10,
      spacesCount: targetSpaces.length,
    };
  }, [spaces, selectedSpace]);

  // Monthly aggregated data for charts
  const monthlyAggregated = useMemo(() => {
    const targetSpaces = selectedSpace ? [selectedSpace] : spaces;
    return MONTHS_LABELS.map((label, idx) => {
      const revenue = targetSpaces.reduce(
        (sum, s) => sum + s.monthlyData[idx].revenue,
        0
      );
      const expenses = targetSpaces.reduce(
        (sum, s) => sum + s.monthlyData[idx].expenses,
        0
      );
      return { month: label, revenue, expenses };
    });
  }, [spaces, selectedSpace]);

  // Max revenue for chart scaling
  const maxRevenue = useMemo(
    () => Math.max(...monthlyAggregated.map((m) => m.revenue), 1),
    [monthlyAggregated]
  );

  // Expense breakdown
  const expenseBreakdown = useMemo((): ExpenseCategory[] => {
    const total = stats.totalExpenses6m;
    const categories = [
      { category: 'Loyer & Charges', ratio: 0.30 },
      { category: 'Maintenance', ratio: 0.18 },
      { category: 'Equipement', ratio: 0.22 },
      { category: 'Assurances', ratio: 0.12 },
      { category: 'Marketing', ratio: 0.10 },
      { category: 'Divers', ratio: 0.08 },
    ];
    return categories.map((c) => ({
      category: c.category,
      amount: Math.round(total * c.ratio),
      percentage: Math.round(c.ratio * 100),
    }));
  }, [stats.totalExpenses6m]);

  // Handlers
  const handleGenerateStatement = useCallback(
    (month: string) => {
      showSuccess(
        'Releve genere',
        `Le releve du mois de ${month} a ete genere avec succes`
      );
    },
    [showSuccess]
  );

  const handleExportCSV = useCallback(() => {
    const headers = ['Mois', 'Revenus', 'Depenses', 'Net'];
    const rows = monthlyAggregated.map((m) => [
      m.month,
      m.revenue.toFixed(2),
      m.expenses.toFixed(2),
      (m.revenue - m.expenses).toFixed(2),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `owner-portal-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showSuccess('Export CSV', 'Le fichier a ete telecharge');
  }, [monthlyAggregated, showSuccess]);

  const handleSendMessage = useCallback(() => {
    showSuccess('Message envoye', 'Votre message a ete transmis au gestionnaire');
  }, [showSuccess]);

  // ===== Tab: Dashboard =====
  function renderDashboard() {
    return (
      <>
        {/* Space Selector */}
        <div className={styles.spaceSelector}>
          <button
            className={cn(styles.spaceBtn, !selectedSpaceId && styles.spaceBtnActive)}
            onClick={() => setSelectedSpaceId(null)}
          >
            Tous les espaces
          </button>
          {spaces.map((space) => (
            <button
              key={space.id}
              className={cn(
                styles.spaceBtn,
                selectedSpaceId === space.id && styles.spaceBtnActive
              )}
              onClick={() => setSelectedSpaceId(space.id)}
            >
              {space.name}
            </button>
          ))}
        </div>

        {/* KPIs */}
        <div className={styles.kpiGrid}>
          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <span className={styles.kpiLabel}>Revenus du mois</span>
              <div className={styles.kpiIcon}>
                <Wallet size={20} />
              </div>
            </div>
            <div className={styles.kpiValue}>
              {formatCurrency(stats.currentMonthRevenue)}
            </div>
            <div className={styles.kpiChange}>
              {stats.monthChange >= 0 ? (
                <span className={styles.kpiUp}>
                  <ArrowUpRight size={14} />
                  +{stats.monthChange.toFixed(1)}%
                </span>
              ) : (
                <span className={styles.kpiDown}>
                  <ArrowDownRight size={14} />
                  {stats.monthChange.toFixed(1)}%
                </span>
              )}
              <span className={styles.kpiMeta}>vs mois dernier</span>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <span className={styles.kpiLabel}>Taux d'occupation</span>
              <div className={styles.kpiIcon}>
                <Building2 size={20} />
              </div>
            </div>
            <div className={styles.kpiValue}>{stats.avgOccupancy}%</div>
            <div className={styles.kpiChange}>
              <span className={styles.kpiMeta}>
                {stats.spacesCount} espace{stats.spacesCount > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <span className={styles.kpiLabel}>ROI annualise</span>
              <div className={styles.kpiIcon}>
                <TrendingUp size={20} />
              </div>
            </div>
            <div className={styles.kpiValue}>{stats.avgRoi}%</div>
            <div className={styles.kpiChange}>
              <span className={styles.kpiUp}>
                <ArrowUpRight size={14} />
                Positif
              </span>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <span className={styles.kpiLabel}>Revenu net (6 mois)</span>
              <div className={styles.kpiIcon}>
                <PieChart size={20} />
              </div>
            </div>
            <div className={styles.kpiValue}>
              {formatCurrency(stats.netIncome6m)}
            </div>
            <div className={styles.kpiChange}>
              <span className={styles.kpiMeta}>
                sur {formatCurrency(stats.totalRevenue6m)} brut
              </span>
            </div>
          </div>
        </div>

        {/* Revenue Bar Chart + Occupancy Gauges */}
        <div className={styles.twoColGrid}>
          {/* Bar Chart */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <div className={styles.cardTitle}>Revenus mensuels</div>
                <div className={styles.cardSubtitle}>6 derniers mois</div>
              </div>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.barChart}>
                {monthlyAggregated.map((m) => {
                  const heightPercent = (m.revenue / maxRevenue) * 100;
                  return (
                    <div key={m.month} className={styles.barGroup}>
                      <span className={styles.barValue}>
                        {formatCurrency(m.revenue)}
                      </span>
                      <div
                        className={styles.bar}
                        style={{ height: `${heightPercent}%` }}
                      />
                      <span className={styles.barLabel}>{m.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Occupancy Gauges */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <div className={styles.cardTitle}>Taux d'occupation</div>
                <div className={styles.cardSubtitle}>Par espace</div>
              </div>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.gaugesGrid}>
                {spaces.map((space) => {
                  const pct = space.occupancyRate;
                  const color =
                    pct >= 75
                      ? 'var(--state-success)'
                      : pct >= 50
                      ? 'var(--state-warning)'
                      : 'var(--state-error)';
                  return (
                    <div key={space.id} className={styles.gaugeItem}>
                      <div
                        className={styles.gauge}
                        style={{
                          background: `conic-gradient(${color} ${pct * 3.6}deg, var(--bg-tertiary) ${pct * 3.6}deg)`,
                        }}
                      >
                        <div className={styles.gaugeInner}>{pct}%</div>
                      </div>
                      <span className={styles.gaugeLabel}>{space.name.split(' - ')[1] || space.name}</span>
                      <span className={styles.gaugeSub}>{space.type}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ===== Tab: Revenus =====
  function renderRevenus() {
    return (
      <>
        <div className={styles.spaceSelector}>
          <button
            className={cn(styles.spaceBtn, !selectedSpaceId && styles.spaceBtnActive)}
            onClick={() => setSelectedSpaceId(null)}
          >
            Tous les espaces
          </button>
          {spaces.map((space) => (
            <button
              key={space.id}
              className={cn(
                styles.spaceBtn,
                selectedSpaceId === space.id && styles.spaceBtnActive
              )}
              onClick={() => setSelectedSpaceId(space.id)}
            >
              {space.name}
            </button>
          ))}
        </div>

        {/* Revenue by space, by month */}
        <div className={cn(styles.card, styles.sectionMargin)}>
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.cardTitle}>Detail des revenus</div>
              <div className={styles.cardSubtitle}>
                Par espace et par mois (6 derniers mois)
              </div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={handleExportCSV}>
              <Download size={14} />
              Export CSV
            </button>
          </div>
          <div className={styles.cardContent}>
            <table className={styles.revenueTable}>
              <thead>
                <tr>
                  <th>Espace</th>
                  {MONTHS_LABELS.map((m) => (
                    <th key={m} className={styles.cellRight}>
                      {m}
                    </th>
                  ))}
                  <th className={styles.cellRight}>Total</th>
                  <th className={styles.cellRight}>Evol.</th>
                </tr>
              </thead>
              <tbody>
                {(selectedSpace ? [selectedSpace] : spaces).map((space) => {
                  const total = space.monthlyData.reduce(
                    (sum, m) => sum + m.revenue,
                    0
                  );
                  const lastMonth = space.monthlyData[5].revenue;
                  const prevMonth = space.monthlyData[4].revenue;
                  const evolution =
                    prevMonth > 0
                      ? ((lastMonth - prevMonth) / prevMonth) * 100
                      : 0;
                  return (
                    <tr key={space.id}>
                      <td>{space.name}</td>
                      {space.monthlyData.map((m) => (
                        <td key={m.month} className={styles.cellRight}>
                          {formatCurrency(m.revenue)}
                        </td>
                      ))}
                      <td className={styles.cellRight}>
                        <strong>{formatCurrency(total)}</strong>
                      </td>
                      <td
                        className={cn(
                          styles.cellRight,
                          evolution >= 0
                            ? styles.positiveChange
                            : styles.negativeChange
                        )}
                      >
                        {evolution >= 0 ? '+' : ''}
                        {evolution.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
                {/* Total Row */}
                <tr className={styles.totalRow}>
                  <td>
                    <strong>Total</strong>
                  </td>
                  {monthlyAggregated.map((m) => (
                    <td key={m.month} className={styles.cellRight}>
                      <strong>{formatCurrency(m.revenue)}</strong>
                    </td>
                  ))}
                  <td className={styles.cellRight}>
                    <strong>{formatCurrency(stats.totalRevenue6m)}</strong>
                  </td>
                  <td
                    className={cn(
                      styles.cellRight,
                      stats.monthChange >= 0
                        ? styles.positiveChange
                        : styles.negativeChange
                    )}
                  >
                    <strong>
                      {stats.monthChange >= 0 ? '+' : ''}
                      {stats.monthChange.toFixed(1)}%
                    </strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Bar chart (revenue vs expenses) */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.cardTitle}>Revenus vs Depenses</div>
              <div className={styles.cardSubtitle}>Evolution sur 6 mois</div>
            </div>
          </div>
          <div className={styles.cardContent}>
            <div className={styles.barChart}>
              {monthlyAggregated.map((m) => {
                const maxVal = Math.max(
                  ...monthlyAggregated.map((a) => a.revenue),
                  1
                );
                const revenueHeight = (m.revenue / maxVal) * 100;
                return (
                  <div key={m.month} className={styles.barGroup}>
                    <span className={styles.barValue}>
                      {formatCurrency(m.revenue - m.expenses)}
                    </span>
                    <div
                      className={styles.bar}
                      style={{ height: `${revenueHeight}%` }}
                    />
                    <span className={styles.barLabel}>{m.month}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </>
    );
  }

  // ===== Tab: Depenses =====
  function renderDepenses() {
    const depensesRatio =
      stats.totalRevenue6m > 0
        ? ((stats.totalExpenses6m / stats.totalRevenue6m) * 100).toFixed(1)
        : '0';

    return (
      <>
        <div className={styles.spaceSelector}>
          <button
            className={cn(styles.spaceBtn, !selectedSpaceId && styles.spaceBtnActive)}
            onClick={() => setSelectedSpaceId(null)}
          >
            Tous les espaces
          </button>
          {spaces.map((space) => (
            <button
              key={space.id}
              className={cn(
                styles.spaceBtn,
                selectedSpaceId === space.id && styles.spaceBtnActive
              )}
              onClick={() => setSelectedSpaceId(space.id)}
            >
              {space.name}
            </button>
          ))}
        </div>

        <div className={styles.twoColGrid}>
          {/* Expense Breakdown */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <div className={styles.cardTitle}>Repartition des depenses</div>
                <div className={styles.cardSubtitle}>
                  Total : {formatCurrency(stats.totalExpenses6m)} sur 6 mois
                </div>
              </div>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.expenseList}>
                {expenseBreakdown.map((item) => (
                  <div key={item.category} className={styles.expenseItem}>
                    <div className={styles.expenseInfo}>
                      <span className={styles.expenseCategory}>
                        {item.category}
                      </span>
                      <span className={styles.expenseAmount}>
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                    <div className={styles.expenseBar}>
                      <div
                        className={styles.expenseBarFill}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <span className={styles.expensePercent}>
                      {item.percentage}%
                    </span>
                  </div>
                ))}
              </div>
              <div className={styles.ratioSummary}>
                <span className={styles.ratioLabel}>
                  Ratio depenses / revenus
                </span>
                <span className={styles.ratioValue}>{depensesRatio}%</span>
              </div>
            </div>
          </div>

          {/* Expenses by month table */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <div className={styles.cardTitle}>Depenses mensuelles</div>
                <div className={styles.cardSubtitle}>Par mois</div>
              </div>
            </div>
            <div className={styles.cardContent}>
              <table className={styles.revenueTable}>
                <thead>
                  <tr>
                    <th>Mois</th>
                    <th className={styles.cellRight}>Depenses</th>
                    <th className={styles.cellRight}>Revenus</th>
                    <th className={styles.cellRight}>Marge</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyAggregated.map((m) => {
                    const margin = m.revenue - m.expenses;
                    const marginPct =
                      m.revenue > 0
                        ? ((margin / m.revenue) * 100).toFixed(1)
                        : '0';
                    return (
                      <tr key={m.month}>
                        <td>{m.month}</td>
                        <td className={styles.cellRight}>
                          {formatCurrency(m.expenses)}
                        </td>
                        <td className={styles.cellRight}>
                          {formatCurrency(m.revenue)}
                        </td>
                        <td
                          className={cn(
                            styles.cellRight,
                            margin >= 0
                              ? styles.positiveChange
                              : styles.negativeChange
                          )}
                        >
                          {marginPct}%
                        </td>
                      </tr>
                    );
                  })}
                  <tr className={styles.totalRow}>
                    <td>
                      <strong>Total</strong>
                    </td>
                    <td className={styles.cellRight}>
                      <strong>
                        {formatCurrency(stats.totalExpenses6m)}
                      </strong>
                    </td>
                    <td className={styles.cellRight}>
                      <strong>
                        {formatCurrency(stats.totalRevenue6m)}
                      </strong>
                    </td>
                    <td
                      className={cn(
                        styles.cellRight,
                        styles.positiveChange
                      )}
                    >
                      <strong>
                        {stats.totalRevenue6m > 0
                          ? (
                              ((stats.netIncome6m) / stats.totalRevenue6m) *
                              100
                            ).toFixed(1)
                          : '0'}
                        %
                      </strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Conic-gradient gauges for expenses per space */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.cardTitle}>
                Ratio depenses/revenus par espace
              </div>
              <div className={styles.cardSubtitle}>
                Plus le ratio est bas, meilleure est la rentabilite
              </div>
            </div>
          </div>
          <div className={styles.cardContent}>
            <div className={styles.gaugesGrid}>
              {spaces.map((space) => {
                const totalRev = space.monthlyData.reduce(
                  (s, m) => s + m.revenue,
                  0
                );
                const totalExp = space.monthlyData.reduce(
                  (s, m) => s + m.expenses,
                  0
                );
                const ratio =
                  totalRev > 0
                    ? Math.round((totalExp / totalRev) * 100)
                    : 0;
                const color =
                  ratio <= 40
                    ? 'var(--state-success)'
                    : ratio <= 55
                    ? 'var(--state-warning)'
                    : 'var(--state-error)';
                return (
                  <div key={space.id} className={styles.gaugeItem}>
                    <div
                      className={styles.gauge}
                      style={{
                        background: `conic-gradient(${color} ${ratio * 3.6}deg, var(--bg-tertiary) ${ratio * 3.6}deg)`,
                      }}
                    >
                      <div className={styles.gaugeInner}>{ratio}%</div>
                    </div>
                    <span className={styles.gaugeLabel}>
                      {space.name.split(' - ')[1] || space.name}
                    </span>
                    <span className={styles.gaugeSub}>
                      {formatCurrency(totalExp)} / {formatCurrency(totalRev)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </>
    );
  }

  // ===== Tab: Releves =====
  function renderReleves() {
    return (
      <>
        {/* Payout History */}
        <div className={cn(styles.card, styles.sectionMargin)}>
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.cardTitle}>Historique des versements</div>
              <div className={styles.cardSubtitle}>
                Payouts mensuels vers votre compte
              </div>
            </div>
          </div>
          <div className={styles.cardContent}>
            {payouts.map((payout) => (
              <div key={payout.id} className={styles.payoutRow}>
                <div className={styles.payoutInfo}>
                  <span className={styles.payoutDate}>
                    {new Date(payout.date).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                    })}
                  </span>
                  <span className={styles.payoutRef}>{payout.reference}</span>
                </div>
                <span className={styles.payoutAmount}>
                  {formatCurrency(payout.amount)}
                </span>
                <span
                  className={cn(
                    styles.payoutStatus,
                    payout.status === 'paid'
                      ? styles.payoutStatusPaid
                      : styles.payoutStatusPending
                  )}
                >
                  {payout.status === 'paid' ? 'Verse' : 'En attente'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Generate Statement + Actions */}
        <div className={cn(styles.twoColGrid, styles.sectionMargin)}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <div className={styles.cardTitle}>Generer un releve</div>
                <div className={styles.cardSubtitle}>
                  Releve mensuel detaille au format PDF
                </div>
              </div>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.actionsRow}>
                {MONTHS_LABELS.map((m) => (
                  <button
                    key={m}
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleGenerateStatement(m)}
                  >
                    <FileText size={14} />
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Communication */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <div className={styles.cardTitle}>
                  Communication gestionnaire
                </div>
                <div className={styles.cardSubtitle}>
                  Messages de votre gestionnaire
                </div>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSendMessage}
              >
                <Send size={14} />
                Envoyer un message
              </button>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.messageList}>
                {messages.map((msg) => (
                  <div key={msg.id} className={styles.messageItem}>
                    <div className={styles.messageAvatar}>{msg.initials}</div>
                    <div className={styles.messageContent}>
                      <div className={styles.messageSender}>{msg.sender}</div>
                      <div className={styles.messageText}>{msg.text}</div>
                      <div className={styles.messageDate}>
                        {new Date(msg.date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Tab config
  const tabs: { id: TabId; label: string; icon: typeof Building2 }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Building2 },
    { id: 'revenus', label: 'Revenus', icon: TrendingUp },
    { id: 'depenses', label: 'Depenses', icon: TrendingDown },
    { id: 'releves', label: 'Releves', icon: FileText },
  ];

  return (
    <div className={styles.page}>
      <Header
        title="Portail Proprietaire"
        subtitle="Suivez la performance de vos espaces"
        actions={
          <button className="btn btn-secondary btn-sm" onClick={handleExportCSV}>
            <Download size={14} />
            Exporter
          </button>
        }
      />

      <div className={styles.content}>
        {/* Tabs */}
        <div className={styles.tabs}>
          {tabs.map((t) => (
            <button
              key={t.id}
              className={cn(styles.tab, activeTab === t.id && styles.tabActive)}
              onClick={() => setActiveTab(t.id)}
            >
              <t.icon
                size={14}
                style={{ marginRight: 'var(--space-2)', verticalAlign: 'middle' }}
              />
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'revenus' && renderRevenus()}
        {activeTab === 'depenses' && renderDepenses()}
        {activeTab === 'releves' && renderReleves()}
      </div>
    </div>
  );
}
