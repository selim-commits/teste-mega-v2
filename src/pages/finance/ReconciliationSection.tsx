import { memo } from 'react';
import { motion } from 'framer-motion';
import { Link2, Link2Off, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { formatCurrency } from '../../lib/utils';
import type { ReconciliationData } from './types';
import styles from '../Finance.module.css';

interface ReconciliationSectionProps {
  reconciliation: ReconciliationData;
}

export const ReconciliationSection = memo(function ReconciliationSection({
  reconciliation,
}: ReconciliationSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55 }}
    >
      <Card padding="lg">
        <CardHeader
          title="Rapprochement"
          subtitle="Paiements rapproches vs non rapproches"
          action={
            <div className={styles.expenseIcon}>
              <Link2 size={18} />
            </div>
          }
        />
        <CardContent>
          <div className={styles.reconciliationSection}>
            <div className={styles.reconciliationGrid}>
              <div className={styles.reconciliationCard}>
                <div className={`${styles.reconciliationIcon} ${styles.reconciliationIconSuccess}`}>
                  <CheckCircle size={20} />
                </div>
                <span className={styles.reconciliationValue}>{reconciliation.matched.count}</span>
                <span className={styles.reconciliationLabel}>Rapproches</span>
                <span className={styles.reconciliationSubtext}>{formatCurrency(reconciliation.matched.amount)}</span>
              </div>
              <div className={styles.reconciliationCard}>
                <div className={`${styles.reconciliationIcon} ${styles.reconciliationIconWarning}`}>
                  <Link2 size={20} />
                </div>
                <span className={styles.reconciliationValue}>{reconciliation.partial.count}</span>
                <span className={styles.reconciliationLabel}>Partiellement rapproches</span>
                <span className={styles.reconciliationSubtext}>{formatCurrency(reconciliation.partial.amount)}</span>
              </div>
              <div className={styles.reconciliationCard}>
                <div className={`${styles.reconciliationIcon} ${styles.reconciliationIconError}`}>
                  <Link2Off size={20} />
                </div>
                <span className={styles.reconciliationValue}>{reconciliation.unmatched.count}</span>
                <span className={styles.reconciliationLabel}>Non rapproches</span>
                <span className={styles.reconciliationSubtext}>{formatCurrency(reconciliation.unmatched.amount)}</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className={styles.reconciliationBar}>
              <motion.div
                className={styles.reconciliationBarMatched}
                initial={{ width: 0 }}
                animate={{ width: `${reconciliation.matched.percent}%` }}
                transition={{ delay: 0.6, duration: 0.5 }}
              />
              <motion.div
                className={styles.reconciliationBarPartial}
                initial={{ width: 0 }}
                animate={{ width: `${reconciliation.partial.percent}%` }}
                transition={{ delay: 0.65, duration: 0.5 }}
              />
              <motion.div
                className={styles.reconciliationBarUnmatched}
                initial={{ width: 0 }}
                animate={{ width: `${reconciliation.unmatched.percent}%` }}
                transition={{ delay: 0.7, duration: 0.5 }}
              />
            </div>

            <div className={styles.reconciliationLegend}>
              <div className={styles.reconciliationLegendItem}>
                <div className={`${styles.reconciliationLegendDot} ${styles.legendDotSuccess}`} />
                <span>Rapproches ({reconciliation.matched.percent}%)</span>
              </div>
              <div className={styles.reconciliationLegendItem}>
                <div className={`${styles.reconciliationLegendDot} ${styles.legendDotWarning}`} />
                <span>Partiels ({reconciliation.partial.percent}%)</span>
              </div>
              <div className={styles.reconciliationLegendItem}>
                <div className={`${styles.reconciliationLegendDot} ${styles.legendDotError}`} />
                <span>Non rapproches ({reconciliation.unmatched.percent}%)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});
