import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import styles from './Input.module.css';

type InputVariant = 'default' | 'filled' | 'ghost';
type InputSize = 'sm' | 'md' | 'lg';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: InputVariant;
  size?: InputSize;
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      variant = 'default',
      size = 'md',
      label,
      error,
      hint,
      icon,
      iconRight,
      fullWidth = false,
      disabled,
      className,
      type = 'text',
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
      <div className={cn(styles.wrapper, fullWidth && styles.fullWidth)}>
        {label && (
          <label className={styles.label}>{label}</label>
        )}
        <motion.div
          className={cn(
            styles.inputWrapper,
            styles[variant],
            styles[size],
            isFocused && styles.focused,
            error && styles.error,
            disabled && styles.disabled
          )}
          animate={{
            borderColor: error
              ? 'var(--accent-red)'
              : isFocused
              ? 'var(--border-strong)'
              : 'var(--border-default)',
          }}
          transition={{ duration: 0.15 }}
        >
          {icon && <span className={styles.icon}>{icon}</span>}
          <input
            ref={ref}
            type={type}
            disabled={disabled}
            className={cn(styles.input, className)}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          />
          {iconRight && <span className={styles.iconRight}>{iconRight}</span>}
        </motion.div>
        {(error || hint) && (
          <span className={cn(styles.message, error && styles.errorMessage)}>
            {error || hint}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
