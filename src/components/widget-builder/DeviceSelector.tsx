import { motion } from 'framer-motion';
import { Monitor, Tablet, Smartphone } from 'lucide-react';
import { cn } from '../../lib/utils';
import styles from './DeviceSelector.module.css';

export type DeviceType = 'desktop' | 'tablet' | 'mobile';

interface DeviceSelectorProps {
  value: DeviceType;
  onChange: (device: DeviceType) => void;
}

const devices: Array<{
  type: DeviceType;
  label: string;
  icon: typeof Monitor;
  width: number;
}> = [
  { type: 'desktop', label: 'Bureau', icon: Monitor, width: 1200 },
  { type: 'tablet', label: 'Tablette', icon: Tablet, width: 768 },
  { type: 'mobile', label: 'Mobile', icon: Smartphone, width: 375 },
];

export function DeviceSelector({ value, onChange }: DeviceSelectorProps) {
  return (
    <div className={styles.container}>
      <div className={styles.buttons}>
        {devices.map(({ type, label, icon: Icon }) => (
          <motion.button
            key={type}
            type="button"
            className={cn(styles.button, value === type && styles.buttonActive)}
            onClick={() => onChange(type)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            aria-label={label}
            title={label}
          >
            <Icon size={18} />
            <span className={styles.label}>{label}</span>
            {value === type && (
              <motion.div
                className={styles.indicator}
                layoutId="device-indicator"
                transition={{ type: 'spring', duration: 0.4, bounce: 0.2 }}
              />
            )}
          </motion.button>
        ))}
      </div>
      <span className={styles.dimensions}>
        {devices.find(d => d.type === value)?.width}px
      </span>
    </div>
  );
}
