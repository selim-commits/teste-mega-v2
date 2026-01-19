import { motion } from 'framer-motion';
import { Calendar, MessageCircle, Package } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { WidgetType } from '../../pages/WidgetBuilder';
import styles from './WidgetTypeSelector.module.css';

interface WidgetTypeSelectorProps {
  value: WidgetType;
  onChange: (type: WidgetType) => void;
}

const widgetTypes: Array<{
  type: WidgetType;
  label: string;
  description: string;
  icon: typeof Calendar;
}> = [
  {
    type: 'booking',
    label: 'Reservation',
    description: 'Widget de prise de rendez-vous',
    icon: Calendar,
  },
  {
    type: 'chat',
    label: 'Chat',
    description: 'Assistant de messagerie',
    icon: MessageCircle,
  },
  {
    type: 'packs',
    label: 'Packs',
    description: 'Affichage de vos offres',
    icon: Package,
  },
];

export function WidgetTypeSelector({ value, onChange }: WidgetTypeSelectorProps) {
  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Type de widget</h3>
      <div className={styles.options}>
        {widgetTypes.map(({ type, label, description, icon: Icon }) => (
          <motion.button
            key={type}
            type="button"
            className={cn(styles.option, value === type && styles.optionActive)}
            onClick={() => onChange(type)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className={cn(styles.iconWrapper, value === type && styles.iconWrapperActive)}>
              <Icon size={20} />
            </div>
            <div className={styles.optionContent}>
              <span className={styles.optionLabel}>{label}</span>
              <span className={styles.optionDescription}>{description}</span>
            </div>
            {value === type && (
              <motion.div
                className={styles.checkmark}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.3 }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
