import { memo } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { formatCurrency } from '../../lib/utils';
import type { AgingBucketsData } from './types';
import styles from '../Finance.module.css';

interface AgingBucketsProps {
  agingBuckets: AgingBucketsData;
  agingTotal: number;
}

export const AgingBuckets = memo(function AgingBuckets({
  agingBuckets,
  agingTotal,
}: AgingBucketsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card padding="lg">
        <CardHeader
          title="Soldes en attente"
          subtitle="Anciennete des creances"
          action={
            <div className={styles.expenseIcon}>
              <Clock size={18} />
            </div>
          }
        />
        <CardContent>
          <div className={styles.agingSection}>
            <div className={styles.agingBuckets}>
              <div className={`${styles.agingBucket} ${styles.agingBucketGreen}`}>
                <span className={styles.agingBucketLabel}>0-30 jours</span>
                <span className={styles.agingBucketValue}>{formatCurrency(agingBuckets.current.amount)}</span>
                <span className={styles.agingBucketCount}>{agingBuckets.current.count} facture{agingBuckets.current.count > 1 ? 's' : ''}</span>
              </div>
              <div className={`${styles.agingBucket} ${styles.agingBucketYellow}`}>
                <span className={styles.agingBucketLabel}>31-60 jours</span>
                <span className={styles.agingBucketValue}>{formatCurrency(agingBuckets.days31_60.amount)}</span>
                <span className={styles.agingBucketCount}>{agingBuckets.days31_60.count} facture{agingBuckets.days31_60.count > 1 ? 's' : ''}</span>
              </div>
              <div className={`${styles.agingBucket} ${styles.agingBucketOrange}`}>
                <span className={styles.agingBucketLabel}>61-90 jours</span>
                <span className={styles.agingBucketValue}>{formatCurrency(agingBuckets.days61_90.amount)}</span>
                <span className={styles.agingBucketCount}>{agingBuckets.days61_90.count} facture{agingBuckets.days61_90.count > 1 ? 's' : ''}</span>
              </div>
              <div className={`${styles.agingBucket} ${styles.agingBucketRed}`}>
                <span className={styles.agingBucketLabel}>90+ jours</span>
                <span className={styles.agingBucketValue}>{formatCurrency(agingBuckets.days90plus.amount)}</span>
                <span className={styles.agingBucketCount}>{agingBuckets.days90plus.count} facture{agingBuckets.days90plus.count > 1 ? 's' : ''}</span>
              </div>
            </div>
            <div className={styles.agingTotal}>
              <span className={styles.agingTotalLabel}>Total en souffrance</span>
              <span className={styles.agingTotalValue}>{formatCurrency(agingTotal)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});
