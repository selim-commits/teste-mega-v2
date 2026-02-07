import styles from './LoadingState.module.css';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingState({ message = 'Chargement...', size = 'md' }: LoadingStateProps) {
  return (
    <div className={styles.container} data-size={size}>
      <div className={styles.spinner} />
      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
}
