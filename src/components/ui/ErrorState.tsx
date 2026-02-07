import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import styles from './ErrorState.module.css';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Une erreur est survenue',
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className={styles.container}>
      <AlertTriangle size={40} className={styles.icon} />
      <h3 className={styles.title}>{title}</h3>
      {message && <p className={styles.message}>{message}</p>}
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Reessayer
        </Button>
      )}
    </div>
  );
}
