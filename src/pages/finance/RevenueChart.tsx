import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PieChart, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { formatCurrency } from '../../lib/utils';
import type { RevenueDataPoint, StatusBreakdownData, FinanceStats, FilterCountsData } from './types';
import styles from '../Finance.module.css';

interface RevenueChartProps {
  revenueData: RevenueDataPoint[];
  period: string;
  onPeriodChange: (period: string) => void;
  statusBreakdown: StatusBreakdownData;
  stats: FinanceStats;
  filterCounts: FilterCountsData;
}

export const RevenueChart = memo(function RevenueChart({
  revenueData,
  period,
  onPeriodChange,
  statusBreakdown,
  stats,
  filterCounts,
}: RevenueChartProps) {
  const maxRevenue = useMemo(() => Math.max(...revenueData.map((d) => d.value), 1), [revenueData]);

  return (
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
            subtitle="Evolution mensuelle"
            action={
              <div className={styles.periodToggle}>
                {['week', 'month', 'year'].map((p) => (
                  <button
                    key={p}
                    className={`${styles.periodBtn} ${period === p ? styles.active : ''}`}
                    onClick={() => onPeriodChange(p)}
                  >
                    {p === 'week' ? 'Semaine' : p === 'month' ? 'Mois' : 'Annee'}
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

      {/* Payment Status Breakdown */}
      <motion.div
        className={styles.expenseSection}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card padding="lg" className={styles.expenseCard}>
          <CardHeader
            title="Statut des paiements"
            subtitle="Repartition"
            action={
              <div className={styles.expenseIcon}>
                <PieChart size={18} />
              </div>
            }
          />
          <CardContent>
            <div className={styles.statusBreakdown}>
              <div className={styles.statusItem}>
                <div className={styles.statusInfo}>
                  <CheckCircle size={16} color="var(--accent-green)" />
                  <span className={styles.statusLabel}>Payees</span>
                  <span className={styles.statusCount}>{statusBreakdown.paid}</span>
                </div>
                <div className={styles.statusBar}>
                  <motion.div
                    className={styles.statusBarFill}
                    style={{ backgroundColor: 'var(--accent-green)' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${statusBreakdown.paidPercent}%` }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                  />
                </div>
                <span className={styles.statusPercent}>{statusBreakdown.paidPercent}%</span>
              </div>
              <div className={styles.statusItem}>
                <div className={styles.statusInfo}>
                  <Clock size={16} color="var(--accent-yellow)" />
                  <span className={styles.statusLabel}>En attente</span>
                  <span className={styles.statusCount}>{statusBreakdown.pending}</span>
                </div>
                <div className={styles.statusBar}>
                  <motion.div
                    className={styles.statusBarFill}
                    style={{ backgroundColor: 'var(--accent-yellow)' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${statusBreakdown.pendingPercent}%` }}
                    transition={{ delay: 0.45, duration: 0.5 }}
                  />
                </div>
                <span className={styles.statusPercent}>{statusBreakdown.pendingPercent}%</span>
              </div>
              <div className={styles.statusItem}>
                <div className={styles.statusInfo}>
                  <AlertTriangle size={16} color="var(--accent-red)" />
                  <span className={styles.statusLabel}>En retard</span>
                  <span className={styles.statusCount}>{statusBreakdown.overdue}</span>
                </div>
                <div className={styles.statusBar}>
                  <motion.div
                    className={styles.statusBarFill}
                    style={{ backgroundColor: 'var(--accent-red)' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${statusBreakdown.overduePercent}%` }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                  />
                </div>
                <span className={styles.statusPercent}>{statusBreakdown.overduePercent}%</span>
              </div>
            </div>

            {/* Outstanding Summary */}
            <div className={styles.outstandingSummary}>
              <div className={styles.outstandingRow}>
                <span>Factures en attente</span>
                <span>{filterCounts.sent}</span>
              </div>
              <div className={styles.outstandingRow}>
                <span>Montant total en attente</span>
                <span>{formatCurrency(stats.outstandingAmount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
});
