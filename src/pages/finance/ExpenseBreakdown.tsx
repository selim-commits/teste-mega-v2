import { memo } from 'react';
import { motion } from 'framer-motion';
import { CreditCard } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { formatCurrency } from '../../lib/utils';
import type { ExpenseItem } from './types';
import styles from '../Finance.module.css';

interface ExpenseBreakdownProps {
  expenses: ExpenseItem[];
}

export const ExpenseBreakdown = memo(function ExpenseBreakdown({
  expenses,
}: ExpenseBreakdownProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
    >
      <Card padding="lg">
        <CardHeader
          title="Repartition des depenses"
          subtitle="Ce mois"
          action={
            <div className={styles.expenseIcon}>
              <CreditCard size={18} />
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
  );
});
