import { X } from 'lucide-react';
import styles from './BulkActionBar.module.css';

export interface BulkAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  onClick: () => void;
  disabled?: boolean;
}

interface BulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  actions: BulkAction[];
  isVisible?: boolean;
}

export function BulkActionBar({
  selectedCount,
  onClearSelection,
  actions,
  isVisible = true,
}: BulkActionBarProps) {
  if (!isVisible || selectedCount === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={`${styles.bar} ${styles.entering}`}>
        <div className={styles.inner}>
          {/* Left section - Selection info */}
          <div className={styles.info}>
            <div className={styles.count}>
              <span className={styles.badge}>{selectedCount}</span>
              <span>
                {selectedCount === 1
                  ? 'élément sélectionné'
                  : 'éléments sélectionnés'}
              </span>
            </div>

            <button
              type="button"
              className={styles.clearButton}
              onClick={onClearSelection}
              aria-label="Tout désélectionner"
            >
              <X size={16} />
              <span>Tout désélectionner</span>
            </button>
          </div>

          {/* Right section - Actions */}
          <div className={styles.actions}>
            {actions.map((action) => (
              <button
                key={action.id}
                type="button"
                className={`${styles.actionButton} ${
                  action.variant ? styles[action.variant] : styles.secondary
                }`}
                onClick={action.onClick}
                disabled={action.disabled}
                aria-label={action.label}
              >
                {action.icon}
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
