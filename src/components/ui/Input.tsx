import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode } from 'react';
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
      id: externalId,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const generatedId = useId();
    const inputId = externalId || generatedId;
    const messageId = `${inputId}-message`;
    const hasMessage = !!(error || hint);

    return (
      <div className={cn(styles.wrapper, fullWidth && styles.fullWidth)}>
        {label && (
          <label className={styles.label} htmlFor={inputId}>{label}</label>
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
          {icon && <span className={styles.icon} aria-hidden="true">{icon}</span>}
          <input
            ref={ref}
            id={inputId}
            type={type}
            disabled={disabled}
            className={cn(styles.input, className)}
            aria-invalid={error ? true : undefined}
            aria-describedby={hasMessage ? messageId : undefined}
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
          {iconRight && <span className={styles.iconRight} aria-hidden="true">{iconRight}</span>}
        </motion.div>
        {hasMessage && (
          <span id={messageId} className={cn(styles.message, error && styles.errorMessage)}>
            {error || hint}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
