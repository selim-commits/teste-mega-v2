import { memo } from 'react';
import { motion } from 'framer-motion';
import { Bell, BellOff } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';
import { formatCurrency, formatDate } from '../../lib/utils';
import type { RelancesStatsData } from './types';
import styles from '../Finance.module.css';

const REMINDER_FREQUENCY_OPTIONS = [
  { value: '3', label: '3 jours' },
  { value: '7', label: '7 jours' },
  { value: '14', label: '14 jours' },
];

interface RelancesSectionProps {
  relancesStats: RelancesStatsData;
  autoReminder: boolean;
  onAutoReminderChange: (value: boolean) => void;
  reminderFrequency: string;
  onReminderFrequencyChange: (value: string) => void;
}

export const RelancesSection = memo(function RelancesSection({
  relancesStats,
  autoReminder,
  onAutoReminderChange,
  reminderFrequency,
  onReminderFrequencyChange,
}: RelancesSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <Card padding="lg">
        <CardHeader
          title="Relances"
          subtitle="Rappels automatiques pour factures en retard"
          action={
            <div className={styles.expenseIcon}>
              {autoReminder ? <Bell size={18} /> : <BellOff size={18} />}
            </div>
          }
        />
        <CardContent>
          <div className={styles.relancesSection}>
            <div className={styles.relancesToggleRow}>
              <div className={styles.relancesToggleInfo}>
                <span className={styles.relancesToggleLabel}>Relances automatiques</span>
                <span className={styles.relancesToggleDesc}>
                  Envoyer des rappels pour les factures en retard
                </span>
              </div>
              <button
                className={`${styles.toggleSwitch} ${autoReminder ? styles.toggleActive : ''}`}
                onClick={() => onAutoReminderChange(!autoReminder)}
                aria-label="Activer les relances automatiques"
              />
            </div>

            {autoReminder && (
              <div className={styles.relancesConfig}>
                <div className={styles.relancesConfigRow}>
                  <span className={styles.relancesConfigLabel}>Frequence des rappels</span>
                  <div className={styles.relancesConfigSelect}>
                    <Select
                      options={REMINDER_FREQUENCY_OPTIONS}
                      value={reminderFrequency}
                      onChange={(value) => onReminderFrequencyChange(value)}
                    />
                  </div>
                </div>
                <div className={styles.relancesConfigRow}>
                  <span className={styles.relancesConfigLabel}>Dernier rappel envoye</span>
                  <span className={styles.relancesConfigLabel}>
                    {relancesStats.lastReminderDate
                      ? formatDate(relancesStats.lastReminderDate)
                      : 'Aucun'}
                  </span>
                </div>
              </div>
            )}

            <div className={styles.relancesStats}>
              <div className={styles.relanceStat}>
                <span className={styles.relanceStatValue}>{relancesStats.overdueCount}</span>
                <span className={styles.relanceStatLabel}>Factures en retard</span>
              </div>
              <div className={styles.relanceStat}>
                <span className={styles.relanceStatValue}>{formatCurrency(relancesStats.totalOverdueAmount)}</span>
                <span className={styles.relanceStatLabel}>Montant total du</span>
              </div>
              <div className={styles.relanceStat}>
                <span className={styles.relanceStatValue}>{reminderFrequency}j</span>
                <span className={styles.relanceStatLabel}>Frequence</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});
