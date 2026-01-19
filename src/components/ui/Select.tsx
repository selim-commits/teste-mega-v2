import { forwardRef, useState, useRef, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import styles from './Select.module.css';

type SelectSize = 'sm' | 'md' | 'lg';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  hint?: string;
  size?: SelectSize;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
  className?: string;
}

export const Select = forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      options,
      value,
      defaultValue,
      onChange,
      placeholder = 'Select an option',
      label,
      error,
      hint,
      size = 'md',
      disabled = false,
      fullWidth = false,
      icon,
      className,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedValue, setSelectedValue] = useState(value ?? defaultValue ?? '');
    const selectRef = useRef<HTMLDivElement>(null);

    // Ensure options is always an array
    const safeOptions = options || [];
    const selectedOption = safeOptions.find((opt) => opt.value === selectedValue);

    useEffect(() => {
      if (value !== undefined) {
        setSelectedValue(value);
      }
    }, [value]);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue: string) => {
      const option = safeOptions.find((opt) => opt.value === optionValue);
      if (option?.disabled) return;

      setSelectedValue(optionValue);
      onChange?.(optionValue);
      setIsOpen(false);
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (disabled) return;

      switch (event.key) {
        case 'Enter':
        case ' ':
          event.preventDefault();
          setIsOpen(!isOpen);
          break;
        case 'Escape':
          setIsOpen(false);
          break;
        case 'ArrowDown':
          event.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else {
            const currentIndex = safeOptions.findIndex((opt) => opt.value === selectedValue);
            const nextIndex = Math.min(currentIndex + 1, safeOptions.length - 1);
            if (safeOptions[nextIndex] && !safeOptions[nextIndex].disabled) {
              setSelectedValue(safeOptions[nextIndex].value);
            }
          }
          break;
        case 'ArrowUp':
          event.preventDefault();
          if (isOpen) {
            const currentIndex = safeOptions.findIndex((opt) => opt.value === selectedValue);
            const prevIndex = Math.max(currentIndex - 1, 0);
            if (safeOptions[prevIndex] && !safeOptions[prevIndex].disabled) {
              setSelectedValue(safeOptions[prevIndex].value);
            }
          }
          break;
      }
    };

    return (
      <div
        ref={ref}
        className={cn(styles.wrapper, fullWidth && styles.fullWidth, className)}
      >
        {label && <label className={styles.label}>{label}</label>}
        <div ref={selectRef} className={styles.selectContainer}>
          <motion.button
            type="button"
            className={cn(
              styles.trigger,
              styles[size],
              isOpen && styles.open,
              error && styles.error,
              disabled && styles.disabled
            )}
            onClick={() => !disabled && setIsOpen(!isOpen)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            whileTap={{ scale: disabled ? 1 : 0.99 }}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
          >
            {icon && <span className={styles.icon}>{icon}</span>}
            <span className={cn(styles.value, !selectedOption && styles.placeholder)}>
              {selectedOption?.label || placeholder}
            </span>
            <motion.span
              className={styles.chevron}
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </motion.span>
          </motion.button>

          <AnimatePresence>
            {isOpen && (
              <motion.ul
                className={styles.dropdown}
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                role="listbox"
              >
                {safeOptions.map((option) => (
                  <motion.li
                    key={option.value}
                    className={cn(
                      styles.option,
                      option.value === selectedValue && styles.selected,
                      option.disabled && styles.optionDisabled
                    )}
                    onClick={() => handleSelect(option.value)}
                    whileHover={{ backgroundColor: 'var(--bg-surface-hover)' }}
                    role="option"
                    aria-selected={option.value === selectedValue}
                    aria-disabled={option.disabled}
                  >
                    {option.label}
                    {option.value === selectedValue && (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
        {(error || hint) && (
          <span className={cn(styles.message, error && styles.errorMessage)}>
            {error || hint}
          </span>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
