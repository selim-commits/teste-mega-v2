import { HelpCircle, ChevronDown } from 'lucide-react';
import styles from './Header.module.css';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
      </div>

      <div className={styles.right}>
        {/* Help Button */}
        <button className={styles.helpBtn}>
          <HelpCircle size={20} />
        </button>

        {/* Action Buttons */}
        {actions ? (
          actions
        ) : (
          <>
            <button className={styles.secondaryBtn}>
              Bloquer un créneau
            </button>
            <button className={styles.primaryBtn}>
              Ajouter
              <ChevronDown size={16} />
            </button>
          </>
        )}
      </div>
    </header>
  );
}
