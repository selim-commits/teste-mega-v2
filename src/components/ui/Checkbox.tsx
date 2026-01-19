import { forwardRef, type InputHTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { Check, Minus } from 'lucide-react';
import { cn } from '../../lib/utils';
import styles from './Checkbox.module.css';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
  indeterminate?: boolean;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      description,
      size = 'md',
      indeterminate = false,
      error,
      className,
      checked,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <label className={cn(styles.container, disabled && styles.disabled, className)}>
        <div className={styles.checkboxWrapper}>
          <input
            ref={ref}
            type="checkbox"
            className={styles.input}
            checked={checked}
            disabled={disabled}
            {...props}
          />
          <motion.div
            className={cn(
              styles.checkbox,
              styles[size],
              checked && styles.checked,
              indeterminate && styles.indeterminate,
              error && styles.error
            )}
            whileTap={{ scale: 0.9 }}
          >
            {(checked || indeterminate) && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.1 }}
                className={styles.icon}
              >
                {indeterminate ? <Minus size={12} /> : <Check size={12} />}
              </motion.span>
            )}
          </motion.div>
        </div>
        {(label || description) && (
          <div className={styles.content}>
            {label && <span className={styles.label}>{label}</span>}
            {description && <span className={styles.description}>{description}</span>}
          </div>
        )}
        {error && <span className={styles.errorText}>{error}</span>}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';

interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ label, description, size = 'md', className, checked, disabled, ...props }, ref) => {
    return (
      <label className={cn(styles.switchContainer, disabled && styles.disabled, className)}>
        <div className={styles.switchWrapper}>
          <input
            ref={ref}
            type="checkbox"
            className={styles.input}
            checked={checked}
            disabled={disabled}
            {...props}
          />
          <motion.div
            className={cn(styles.switch, styles[`switch-${size}`], checked && styles.switchChecked)}
          >
            <motion.div
              className={styles.switchThumb}
              animate={{ x: checked ? '100%' : '0%' }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </motion.div>
        </div>
        {(label || description) && (
          <div className={styles.content}>
            {label && <span className={styles.label}>{label}</span>}
            {description && <span className={styles.description}>{description}</span>}
          </div>
        )}
      </label>
    );
  }
);

Switch.displayName = 'Switch';

interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ label, size = 'md', className, checked, disabled, ...props }, ref) => {
    return (
      <label className={cn(styles.container, disabled && styles.disabled, className)}>
        <div className={styles.checkboxWrapper}>
          <input
            ref={ref}
            type="radio"
            className={styles.input}
            checked={checked}
            disabled={disabled}
            {...props}
          />
          <motion.div
            className={cn(styles.radio, styles[size], checked && styles.checked)}
            whileTap={{ scale: 0.9 }}
          >
            {checked && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.1 }}
                className={styles.radioDot}
              />
            )}
          </motion.div>
        </div>
        {label && <span className={styles.label}>{label}</span>}
      </label>
    );
  }
);

Radio.displayName = 'Radio';
