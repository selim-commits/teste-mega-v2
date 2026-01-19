import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  FileText,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Clock,
  PieChart,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { formatCurrency } from '../lib/utils';
import styles from './Finance.module.css';

const kpis = [
  {
    title: 'Revenus du mois',
    value: 48250,
    change: 12.5,
    trend: 'up' as const,
    icon: DollarSign,
    color: 'var(--accent-green)',
  },
  {
    title: 'Dépenses',
    value: 12480,
    change: -3.2,
    trend: 'down' as const,
    icon: CreditCard,
    color: 'var(--accent-red)',
  },
  {
    title: 'Profit net',
    value: 35770,
    change: 18.7,
    trend: 'up' as const,
    icon: TrendingUp,
    color: 'var(--accent-blue)',
  },
  {
    title: 'En attente',
    value: 8920,
    change: 5.4,
    trend: 'up' as const,
    icon: Clock,
    color: 'var(--accent-yellow)',
  },
];

const revenueData = [
  { month: 'Jan', value: 32000 },
  { month: 'Fév', value: 28500 },
  { month: 'Mar', value: 41000 },
  { month: 'Avr', value: 38200 },
  { month: 'Mai', value: 45800 },
  { month: 'Juin', value: 48250 },
];

const invoices = [
  {
    id: 'INV-1247',
    client: 'Marie Dupont',
    amount: 2450,
    date: '2024-01-18',
    dueDate: '2024-02-18',
    status: 'paid',
  },
  {
    id: 'INV-1246',
    client: 'Studio XYZ',
    amount: 5800,
    date: '2024-01-17',
    dueDate: '2024-02-17',
    status: 'pending',
  },
  {
    id: 'INV-1245',
    client: 'Jean Martin',
    amount: 1200,
    date: '2024-01-15',
    dueDate: '2024-02-15',
    status: 'paid',
  },
  {
    id: 'INV-1244',
    client: 'Sophie Bernard',
    amount: 3650,
    date: '2024-01-14',
    dueDate: '2024-02-14',
    status: 'overdue',
  },
  {
    id: 'INV-1243',
    client: 'Lucas Petit',
    amount: 890,
    date: '2024-01-12',
    dueDate: '2024-02-12',
    status: 'pending',
  },
];

const expenses = [
  { category: 'Équipement', amount: 4500, percentage: 36 },
  { category: 'Loyer', amount: 3200, percentage: 26 },
  { category: 'Personnel', amount: 2800, percentage: 22 },
  { category: 'Marketing', amount: 1200, percentage: 10 },
  { category: 'Autres', amount: 780, percentage: 6 },
];

export function Finance() {
  const [period, setPeriod] = useState('month');
  const maxRevenue = Math.max(...revenueData.map((d) => d.value));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success" size="sm" dot>Payée</Badge>;
      case 'pending':
        return <Badge variant="warning" size="sm" dot>En attente</Badge>;
      case 'overdue':
        return <Badge variant="error" size="sm" dot>En retard</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className={styles.page}>
      <Header
        title="Finance & BI"
        subtitle="Analysez vos performances financières"
      />

      <div className={styles.content}>
        {/* KPI Cards */}
        <div className={styles.kpiGrid}>
          {kpis.map((kpi, index) => (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card padding="lg" hoverable className={styles.kpiCard}>
                <div className={styles.kpiHeader}>
                  <span className={styles.kpiTitle}>{kpi.title}</span>
                  <div className={styles.kpiIcon} style={{ backgroundColor: `${kpi.color}15` }}>
                    <kpi.icon size={20} color={kpi.color} />
                  </div>
                </div>
                <div className={styles.kpiValue}>{formatCurrency(kpi.value)}</div>
                <div className={styles.kpiChange}>
                  {kpi.trend === 'up' ? (
                    <ArrowUpRight size={14} className={styles.kpiUp} />
                  ) : (
                    <ArrowDownRight size={14} className={styles.kpiDown} />
                  )}
                  <span className={kpi.trend === 'up' ? styles.kpiUp : styles.kpiDown}>
                    {Math.abs(kpi.change)}%
                  </span>
                  <span className={styles.kpiPeriod}>vs mois dernier</span>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className={styles.mainGrid}>
          {/* Revenue Chart */}
          <motion.div
            className={styles.chartSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card padding="lg" className={styles.chartCard}>
              <CardHeader
                title="Revenus"
                subtitle="Évolution mensuelle"
                action={
                  <div className={styles.periodToggle}>
                    {['week', 'month', 'year'].map((p) => (
                      <button
                        key={p}
                        className={`${styles.periodBtn} ${period === p ? styles.active : ''}`}
                        onClick={() => setPeriod(p)}
                      >
                        {p === 'week' ? 'Semaine' : p === 'month' ? 'Mois' : 'Année'}
                      </button>
                    ))}
                  </div>
                }
              />
              <CardContent>
                <div className={styles.chart}>
                  <div className={styles.chartBars}>
                    {revenueData.map((data, index) => (
                      <div key={data.month} className={styles.chartBar}>
                        <motion.div
                          className={styles.barFill}
                          initial={{ height: 0 }}
                          animate={{ height: `${(data.value / maxRevenue) * 100}%` }}
                          transition={{ delay: 0.3 + index * 0.05, duration: 0.5 }}
                        />
                        <span className={styles.barLabel}>{data.month}</span>
                        <span className={styles.barValue}>{formatCurrency(data.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Expenses Breakdown */}
          <motion.div
            className={styles.expenseSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card padding="lg" className={styles.expenseCard}>
              <CardHeader
                title="Répartition des dépenses"
                subtitle="Ce mois"
                action={
                  <div className={styles.expenseIcon}>
                    <PieChart size={18} />
                  </div>
                }
              />
              <CardContent>
                <div className={styles.expenseList}>
                  {expenses.map((expense, index) => (
                    <div key={expense.category} className={styles.expenseItem}>
                      <div className={styles.expenseInfo}>
                        <span className={styles.expenseCategory}>{expense.category}</span>
                        <span className={styles.expenseAmount}>{formatCurrency(expense.amount)}</span>
                      </div>
                      <div className={styles.expenseBar}>
                        <motion.div
                          className={styles.expenseBarFill}
                          initial={{ width: 0 }}
                          animate={{ width: `${expense.percentage}%` }}
                          transition={{ delay: 0.4 + index * 0.05, duration: 0.5 }}
                        />
                      </div>
                      <span className={styles.expensePercentage}>{expense.percentage}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Invoices Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card padding="none" className={styles.invoicesCard}>
            <div className={styles.invoicesHeader}>
              <div>
                <h3 className={styles.invoicesTitle}>Factures récentes</h3>
                <p className={styles.invoicesSubtitle}>Gérez vos factures et paiements</p>
              </div>
              <div className={styles.invoicesActions}>
                <Button variant="secondary" size="sm" icon={<Filter size={16} />}>
                  Filtres
                </Button>
                <Button variant="secondary" size="sm" icon={<Download size={16} />}>
                  Exporter
                </Button>
                <Button variant="primary" size="sm" icon={<FileText size={16} />}>
                  Nouvelle facture
                </Button>
              </div>
            </div>

            <div className={styles.invoicesTable}>
              <div className={styles.tableHeader}>
                <span>Facture</span>
                <span>Client</span>
                <span>Montant</span>
                <span>Date</span>
                <span>Échéance</span>
                <span>Statut</span>
                <span></span>
              </div>
              {invoices.map((invoice) => (
                <div key={invoice.id} className={styles.tableRow}>
                  <span className={styles.invoiceId}>{invoice.id}</span>
                  <span className={styles.invoiceClient}>{invoice.client}</span>
                  <span className={styles.invoiceAmount}>{formatCurrency(invoice.amount)}</span>
                  <span className={styles.invoiceDate}>
                    {new Date(invoice.date).toLocaleDateString('fr-FR')}
                  </span>
                  <span className={styles.invoiceDue}>
                    {new Date(invoice.dueDate).toLocaleDateString('fr-FR')}
                  </span>
                  <span>{getStatusBadge(invoice.status)}</span>
                  <button className={styles.invoiceMenu}>
                    <MoreVertical size={16} />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
