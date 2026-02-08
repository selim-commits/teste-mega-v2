import { memo } from 'react';
import { motion } from 'framer-motion';
import { Receipt } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { formatCurrency } from '../../lib/utils';
import type { TaxCalculationsData } from './types';
import styles from '../Finance.module.css';

interface TaxSectionProps {
  taxCalculations: TaxCalculationsData;
}

export const TaxSection = memo(function TaxSection({
  taxCalculations,
}: TaxSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
    >
      <Card padding="lg">
        <CardHeader
          title="Calcul TVA"
          subtitle={`Taux applique : ${(taxCalculations.tvaRate * 100).toFixed(0)}%`}
          action={
            <div className={styles.expenseIcon}>
              <Receipt size={18} />
            </div>
          }
        />
        <CardContent>
          <div className={styles.taxSection}>
            <div className={styles.taxGrid}>
              <div className={styles.taxCard}>
                <span className={styles.taxCardLabel}>TVA collectee</span>
                <span className={styles.taxCardValue}>{formatCurrency(taxCalculations.tvaCollected)}</span>
                <span className={styles.taxCardSubtext}>Ce mois</span>
              </div>
              <div className={styles.taxCard}>
                <span className={styles.taxCardLabel}>Taux TVA</span>
                <span className={styles.taxCardValue}>{(taxCalculations.tvaRate * 100).toFixed(0)}%</span>
                <span className={styles.taxCardSubtext}>Taux en vigueur</span>
              </div>
            </div>
            <div className={styles.taxSummary}>
              <div className={styles.taxSummaryRow}>
                <span>Revenus bruts (TTC)</span>
                <span>{formatCurrency(taxCalculations.grossRevenue)}</span>
              </div>
              <div className={styles.taxSummaryRow}>
                <span>TVA collectee</span>
                <span>{formatCurrency(taxCalculations.tvaCollected)}</span>
              </div>
              <div className={`${styles.taxSummaryRow} ${styles.taxSummaryTotal}`}>
                <span>Revenus nets (HT)</span>
                <span>{formatCurrency(taxCalculations.netRevenue)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});
