import { createContext, useContext, useEffect, useRef, useId, useCallback, type ReactNode, type RefObject } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';
import styles from './Modal.module.css';

const ModalContext = createContext<string | null>(null);

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  size?: ModalSize;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  children: ReactNode;
  className?: string;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Returns all focusable elements within a container,
 * filtered to only those that are visible (offsetParent !== null or is <body>).
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const elements = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
  return Array.from(elements).filter(
    (el) => el.offsetParent !== null || el.tagName === 'BODY'
  );
}

/**
 * Custom hook that traps focus within a container element while active.
 *
 * Behavior:
 * - Saves the previously focused element when activated
 * - Moves focus to the first focusable element inside the container
 * - Wraps Tab / Shift+Tab navigation within the container boundaries
 * - If focus escapes the container (e.g. via screen reader), re-captures it on next Tab
 * - Restores focus to the previously focused element when deactivated
 * - Optionally closes on Escape key
 */
function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  isActive: boolean,
  options: { onEscape?: () => void; closeOnEscape?: boolean }
) {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Handle Escape
      if (event.key === 'Escape' && options.closeOnEscape && options.onEscape) {
        event.stopPropagation();
        options.onEscape();
        return;
      }

      // Handle Tab trapping
      if (event.key !== 'Tab' || !containerRef.current) return;

      const focusableElements = getFocusableElements(containerRef.current);
      if (focusableElements.length === 0) {
        // No focusable elements: prevent Tab from leaving the modal entirely
        event.preventDefault();
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      const active = document.activeElement as HTMLElement;

      // If focus has escaped the container (e.g. screen reader navigation),
      // bring it back to the appropriate boundary element
      const isInsideContainer = containerRef.current.contains(active);

      if (event.shiftKey) {
        if (!isInsideContainer || active === first) {
          event.preventDefault();
          last.focus();
        }
      } else {
        if (!isInsideContainer || active === last) {
          event.preventDefault();
          first.focus();
        }
      }
    },
    [containerRef, options.closeOnEscape, options.onEscape]
  );

  useEffect(() => {
    if (!isActive) return;

    // Save the element that had focus before the trap activated
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Lock body scroll
    document.body.style.overflow = 'hidden';

    // Attach keydown listener
    document.addEventListener('keydown', handleKeyDown);

    // Focus the first focusable element after the frame paints
    // (allows entry animations to complete so elements are visible)
    const rafId = requestAnimationFrame(() => {
      if (containerRef.current) {
        const focusableElements = getFocusableElements(containerRef.current);
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        } else {
          // If no focusable children, focus the container itself so
          // keyboard events are still captured
          containerRef.current.setAttribute('tabindex', '-1');
          containerRef.current.focus();
        }
      }
    });

    return () => {
      // Cleanup: remove listener, restore scroll, cancel pending rAF
      cancelAnimationFrame(rafId);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';

      // Restore focus to the element that was focused before the trap
      previousFocusRef.current?.focus();
      previousFocusRef.current = null;
    };
  }, [isActive, handleKeyDown, containerRef]);
}

export function Modal({
  isOpen,
  onClose,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  children,
  className,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  // Focus trap: traps Tab navigation, handles Escape, saves/restores focus
  useFocusTrap(modalRef, isOpen, {
    onEscape: onClose,
    closeOnEscape,
  });

  const handleOverlayClick = (event: React.MouseEvent) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose();
    }
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className={styles.portal}>
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleOverlayClick}
          >
            <motion.div
              ref={modalRef}
              className={cn(styles.modal, styles[size], className)}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
            >
              <ModalContext.Provider value={titleId}>
                {children}
              </ModalContext.Provider>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}

interface ModalHeaderProps {
  title: string;
  subtitle?: string;
  onClose?: () => void;
  children?: ReactNode;
  className?: string;
}

export function ModalHeader({
  title,
  subtitle,
  onClose,
  children,
  className,
}: ModalHeaderProps) {
  const titleId = useContext(ModalContext);

  return (
    <div className={cn(styles.header, className)}>
      <div className={styles.headerContent}>
        <h2 id={titleId || undefined} className={styles.title}>{title}</h2>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {children}
      {onClose && (
        <motion.button
          className={styles.closeButton}
          onClick={onClose}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-label="Close modal"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </motion.button>
      )}
    </div>
  );
}

interface ModalBodyProps {
  children: ReactNode;
  className?: string;
}

export function ModalBody({ children, className }: ModalBodyProps) {
  return <div className={cn(styles.body, className)}>{children}</div>;
}

interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return <div className={cn(styles.footer, className)}>{children}</div>;
}
