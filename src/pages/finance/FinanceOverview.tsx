import { memo } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { formatCurrency } from '../../lib/utils';
import type { KpiItem, FinanceStats } from './types';
import styles from '../Finance.module.css';

interface FinanceOverviewProps {
  kpis: KpiItem[];
  stats: FinanceStats;
}

export const FinanceOverview = memo(function FinanceOverview({
  kpis,
  stats,
}: FinanceOverviewProps) {
  return (
    <>
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
              <div className={styles.kpiValue}>
                {kpi.isCount ? kpi.value : formatCurrency(kpi.value)}
              </div>
              {kpi.change !== 0 && (
                <div className={styles.kpiChange}>
                  {kpi.trend === 'up' ? (
                    <ArrowUpRight size={14} className={styles.kpiUp} />
                  ) : (
                    <ArrowDownRight size={14} className={styles.kpiDown} />
                  )}
                  <span className={kpi.trend === 'up' ? styles.kpiUp : styles.kpiDown}>
                    {Math.abs(kpi.change).toFixed(1)}%
                  </span>
                  <span className={styles.kpiPeriod}>vs mois dernier</span>
                </div>
              )}
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Revenue Overview Section */}
      <div className={styles.revenueOverview}>
        <Card padding="lg">
          <CardHeader
            title="Apercu des revenus"
            subtitle="Performance financiere"
          />
          <CardContent>
            <div className={styles.revenueStats}>
              <div className={styles.revenueStat}>
                <span className={styles.revenueLabel}>Mois en cours</span>
                <span className={styles.revenueValue}>{formatCurrency(stats.currentMonthRevenue)}</span>
              </div>
              <div className={styles.revenueStat}>
                <span className={styles.revenueLabel}>Mois precedent</span>
                <span className={styles.revenueValue}>{formatCurrency(stats.prevMonthRevenue)}</span>
              </div>
              <div className={styles.revenueStat}>
                <span className={styles.revenueLabel}>Cumul annuel (YTD)</span>
                <span className={styles.revenueValue}>{formatCurrency(stats.ytdRevenue)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
});
