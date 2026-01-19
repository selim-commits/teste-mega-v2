import { forwardRef, type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/utils';
import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'size'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  iconRight?: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
  children?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      icon,
      iconRight,
      loading = false,
      fullWidth = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        disabled={disabled || loading}
        className={cn(
          styles.button,
          styles[variant],
          styles[size],
          fullWidth && styles.fullWidth,
          loading && styles.loading,
          className
        )}
        {...props}
      >
        {loading && (
          <span className={styles.spinner}>
            <svg viewBox="0 0 24 24" fill="none" className={styles.spinnerIcon}>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="32" strokeDashoffset="32">
                <animate attributeName="stroke-dashoffset" values="32;0" dur="1s" repeatCount="indefinite" />
              </circle>
            </svg>
          </span>
        )}
        {icon && !loading && <span className={styles.icon}>{icon}</span>}
        {children && <span className={styles.label}>{children}</span>}
        {iconRight && <span className={styles.iconRight}>{iconRight}</span>}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
