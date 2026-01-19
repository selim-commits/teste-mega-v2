import { useState, useRef, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import styles from './Dropdown.module.css';

interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: 'start' | 'center' | 'end';
  className?: string;
}

export function Dropdown({ trigger, children, align = 'start', className }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className={cn(styles.dropdown, className)}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={cn(styles.menu, styles[align])}
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface DropdownItemProps {
  children: ReactNode;
  icon?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  selected?: boolean;
}

export function DropdownItem({
  children,
  icon,
  onClick,
  disabled = false,
  destructive = false,
  selected = false,
}: DropdownItemProps) {
  return (
    <button
      className={cn(
        styles.item,
        disabled && styles.disabled,
        destructive && styles.destructive,
        selected && styles.selected
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className={styles.itemIcon}>{icon}</span>}
      <span className={styles.itemText}>{children}</span>
      {selected && <Check size={16} className={styles.checkIcon} />}
    </button>
  );
}

export function DropdownDivider() {
  return <div className={styles.divider} />;
}

export function DropdownLabel({ children }: { children: ReactNode }) {
  return <div className={styles.label}>{children}</div>;
}

interface DropdownButtonProps {
  children: ReactNode;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function DropdownButton({
  children,
  variant = 'default',
  size = 'md',
  className,
}: DropdownButtonProps) {
  return (
    <button className={cn(styles.button, styles[`button-${variant}`], styles[`button-${size}`], className)}>
      {children}
      <ChevronDown size={16} className={styles.chevron} />
    </button>
  );
}
