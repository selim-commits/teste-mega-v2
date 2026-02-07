import { useState, createContext, useContext, type ReactNode } from 'react';
import { cn } from '../../lib/utils';
import styles from './Tabs.module.css';

type TabsSize = 'sm' | 'md' | 'lg';
type TabsVariant = 'default' | 'pills' | 'underline';

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (value: string) => void;
  size: TabsSize;
  variant: TabsVariant;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider');
  }
  return context;
}

interface TabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  size?: TabsSize;
  variant?: TabsVariant;
  children: ReactNode;
  className?: string;
}

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  size = 'md',
  variant = 'default',
  children,
  className,
}: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const activeTab = value ?? internalValue;

  const setActiveTab = (newValue: string) => {
    setInternalValue(newValue);
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab, size, variant }}>
      <div className={cn(styles.tabs, className)}>{children}</div>
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  children: ReactNode;
  className?: string;
}

export function TabsList({ children, className }: TabsListProps) {
  const { variant } = useTabsContext();

  return (
    <div
      className={cn(styles.list, styles[`list-${variant}`], className)}
      role="tablist"
    >
      {children}
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  disabled?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function TabsTrigger({
  value,
  disabled = false,
  icon,
  children,
  className,
}: TabsTriggerProps) {
  const { activeTab, setActiveTab, size, variant } = useTabsContext();
  const isActive = activeTab === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      disabled={disabled}
      className={cn(
        styles.trigger,
        styles[`trigger-${variant}`],
        styles[size],
        isActive && styles.active,
        disabled && styles.disabled,
        className
      )}
      onClick={() => !disabled && setActiveTab(value)}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      <span className={styles.label}>{children}</span>
      {isActive && variant === 'default' && (
        <div className={styles.indicator} />
      )}
      {isActive && variant === 'underline' && (
        <div className={styles.underline} />
      )}
    </button>
  );
}

interface TabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  const { activeTab } = useTabsContext();

  if (activeTab !== value) return null;

  return (
    <div
      className={cn(styles.content, styles.animateIn, className)}
      role="tabpanel"
    >
      {children}
    </div>
  );
}
