import { useEffect, useState, useCallback, createContext, useContext, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { cn, generateId } from '../../lib/utils';
import styles from './Toast.module.css';

type ToastVariant = 'default' | 'success' | 'warning' | 'error' | 'info';
type ToastPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  duration: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
  position?: ToastPosition;
  maxToasts?: number;
}

export function ToastProvider({
  children,
  position = 'bottom-right',
  maxToasts = 5,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = generateId();
      setToasts((prev) => {
        const newToasts = [...prev, { ...toast, id }];
        if (newToasts.length > maxToasts) {
          return newToasts.slice(-maxToasts);
        }
        return newToasts;
      });
      return id;
    },
    [maxToasts]
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
      {children}
      {createPortal(
        <ToastContainer toasts={toasts} position={position} onRemove={removeToast} />,
        document.body
      )}
    </ToastContext.Provider>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  position: ToastPosition;
  onRemove: (id: string) => void;
}

function ToastContainer({ toasts, position, onRemove }: ToastContainerProps) {
  return (
    <div className={cn(styles.container, styles[position])}>
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (toast.duration === 0 || isHovered) return;

    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, toast.duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, isHovered, onRemove]);

  const icons: Record<ToastVariant, ReactNode> = {
    default: null,
    success: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    warning: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    error: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
    info: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
      transition={{ type: 'spring', duration: 0.4, bounce: 0.3 }}
      className={cn(styles.toast, styles[toast.variant])}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="alert"
    >
      {icons[toast.variant] && (
        <span className={styles.icon}>{icons[toast.variant]}</span>
      )}
      <div className={styles.content}>
        <p className={styles.title}>{toast.title}</p>
        {toast.description && (
          <p className={styles.description}>{toast.description}</p>
        )}
      </div>
      {toast.action && (
        <button
          className={styles.action}
          onClick={() => {
            toast.action?.onClick();
            onRemove(toast.id);
          }}
        >
          {toast.action.label}
        </button>
      )}
      <motion.button
        className={styles.closeButton}
        onClick={() => onRemove(toast.id)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label="Dismiss toast"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </motion.button>
    </motion.div>
  );
}

// Helper functions for quick toast creation
// eslint-disable-next-line react-refresh/only-export-components
export function toast(options: Omit<Toast, 'id' | 'variant'> & { variant?: ToastVariant }) {
  // This will be used with the hook
  return {
    ...options,
    variant: options.variant || 'default',
    duration: options.duration ?? 5000,
  };
}

toast.success = (title: string, options?: Partial<Omit<Toast, 'id' | 'title' | 'variant'>>) => ({
  title,
  variant: 'success' as const,
  duration: 5000,
  ...options,
});

toast.error = (title: string, options?: Partial<Omit<Toast, 'id' | 'title' | 'variant'>>) => ({
  title,
  variant: 'error' as const,
  duration: 5000,
  ...options,
});

toast.warning = (title: string, options?: Partial<Omit<Toast, 'id' | 'title' | 'variant'>>) => ({
  title,
  variant: 'warning' as const,
  duration: 5000,
  ...options,
});

toast.info = (title: string, options?: Partial<Omit<Toast, 'id' | 'title' | 'variant'>>) => ({
  title,
  variant: 'info' as const,
  duration: 5000,
  ...options,
});
